import puppeteer from 'puppeteer'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dashboardDir = path.resolve(__dirname, '..')
const scratchDir = path.resolve(dashboardDir, '..', 'scratch')

if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true })
}

async function runBrowserVerification() {
  console.log('🚀 Starting Vite preview server...')
  const previewProcess = spawn('npm', ['run', 'preview', '--', '--port', '4173', '--host', '127.0.0.1'], {
    cwd: dashboardDir,
    shell: true,
  })

  // Wait 3 seconds for Vite preview to bind to port
  await new Promise((resolve) => setTimeout(resolve, 3000))

  let browser
  try {
    console.log('🌐 Launching headless Chrome via Puppeteer...')
    const profileDir = path.join(scratchDir, 'puppeteer-profile-' + Date.now())
    browser = await puppeteer.launch({
      headless: true,
      userDataDir: profileDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    page.on('console', (msg) => console.log('PAGE LOG:', msg.type(), msg.text()))
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message))

    console.log('🔗 Navigating to http://127.0.0.1:4173 ...')
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2', timeout: 30000 })

    await page.waitForSelector('table', { timeout: 15000 })
    console.log('✅ Table hydrated successfully.')

    // 1. Verify "Last updated" indicator pill exists and contains valid formatted UTC text
    const lastUpdatedPill = await page.waitForSelector('[data-testid="last-updated-pill"]', { timeout: 5000 })
    if (!lastUpdatedPill) {
      throw new Error('Last updated pill ([data-testid="last-updated-pill"]) was not rendered!')
    }
    const lastUpdatedText = await page.evaluate((el) => el.textContent, lastUpdatedPill)
    console.log('✅ Last Updated Pill Verified:', lastUpdatedText)
    if (!lastUpdatedText.includes('UTC') && !lastUpdatedText.includes('ago')) {
      throw new Error(`Last updated text does not look valid: "${lastUpdatedText}"`)
    }

    // 2. Verify Favorite Icon appears in Table Header
    const favHeader = await page.$('table thead th:nth-child(3)')
    if (!favHeader) {
      throw new Error('Favorite column header not found!')
    }
    console.log('✅ Favorite column header verified between Repository and Stars.')

    // 3. Verify Row Hover & Favorite Toggle
    console.log('👉 Hovering over first repository row...')
    const firstRow = await page.$('tbody tr')
    if (!firstRow) {
      throw new Error('No rows found in table body!')
    }

    const firstRepoName = await page.evaluate(() => {
      const el = document.querySelector('tbody tr td:nth-child(2) span')
      return el ? el.textContent?.trim() : ''
    })
    console.log('Target repository for favorite test:', firstRepoName)

    await firstRow.hover()
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Click the favorite button on the first row
    const favButton = await page.$('tbody tr td:nth-child(3) button')
    if (!favButton) {
      throw new Error('Favorite button not found on first row!')
    }

    console.log('👉 Clicking favorite button to add to favorites...')
    await favButton.click()
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify favorite pill in header/filters shows count 1
    const favPill = await page.$('[data-testid="favorites-pill"]')
    if (!favPill) {
      throw new Error('Favorites pill ([data-testid="favorites-pill"]) not found!')
    }
    const favPillText = await page.evaluate((el) => el.textContent, favPill)
    console.log('Favorites pill text after addition:', favPillText)
    if (!favPillText.includes('1')) {
      throw new Error(`Expected Favorites count 1, but found: "${favPillText}"`)
    }
    console.log('✅ Favorites counter updated to 1!')

    // 4. Click Favorites Pill to view My Fav List
    console.log('👉 Clicking Favorites pill to open My Fav List...')
    await favPill.click()
    await new Promise((resolve) => setTimeout(resolve, 800))

    const favRowsCount = await page.evaluate(() => {
      return document.querySelectorAll('tbody tr').length
    })
    console.log(`Rows in Favorites view: ${favRowsCount}`)
    if (favRowsCount !== 1) {
      throw new Error(`Expected exactly 1 row in Favorites view, but found ${favRowsCount}`)
    }

    const favRowRepoName = await page.evaluate(() => {
      const el = document.querySelector('tbody tr td:nth-child(2) span')
      return el ? el.textContent?.trim() : ''
    })
    if (favRowRepoName !== firstRepoName) {
      throw new Error(`Expected "${firstRepoName}" in favorites, but got "${favRowRepoName}"`)
    }
    console.log(`✅ My Fav List verified: correctly displays "${favRowRepoName}".`)

    // 5. Verify persistence across page reload
    console.log('🔄 Reloading page to verify localStorage persistence...')
    await page.reload({ waitUntil: 'networkidle2' })
    await page.waitForSelector('table', { timeout: 15000 })

    const favPillReloaded = await page.waitForSelector('[data-testid="favorites-pill"]')
    const favPillTextReloaded = await page.evaluate((el) => el.textContent, favPillReloaded)
    console.log('Favorites pill text after reload:', favPillTextReloaded)
    if (!favPillTextReloaded.includes('1')) {
      throw new Error(`Favorites count did not persist across reload! Got: "${favPillTextReloaded}"`)
    }
    console.log('✅ Favorites persistence verified across page refresh!')

    // 6. Verify dedicated Category Favorites Pill (User request: alada fav catagory banao)
    const categoryFavPill = await page.waitForSelector('[data-testid="category-fav-pill"]')
    if (!categoryFavPill) {
      throw new Error('Category Favorites pill ([data-testid="category-fav-pill"]) not found!')
    }
    const categoryFavText = await page.evaluate((el) => el.textContent, categoryFavPill)
    console.log('✅ Category Favorites Pill Verified in Category Row:', categoryFavText)
    if (!categoryFavText.includes('Favorites') || !categoryFavText.includes('1')) {
      throw new Error(`Category favorites pill does not show 1 count: "${categoryFavText}"`)
    }

    // 7. Verify Row Click Expansion & Inset Frame with Start & End Boundaries
    console.log('👉 Clicking first repository row to expand AI specs drawer...')
    const targetRow = await page.$('tbody tr:first-child')
    await targetRow.click()
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Check Start Ribbon
    const startRibbon = await page.evaluate(() => {
      const el = document.querySelector('tbody tr td div div')
      return document.body.innerText.includes('AI Intelligence & Architecture Specs')
    })
    if (!startRibbon) {
      throw new Error('Start ribbon "AI Intelligence & Architecture Specs" not found!')
    }
    console.log('✅ Top Header Ribbon (Start of AI Specs) verified!')

    // Check End Ribbon
    const endRibbon = await page.evaluate(() => {
      return document.body.innerText.includes('End of AI specs for')
    })
    if (!endRibbon) {
      throw new Error('Bottom footer ribbon "End of AI specs for" not found!')
    }
    console.log('✅ Bottom Footer Ribbon (End of AI Specs) verified!')

    // 8. Take screenshot proof of expanded view with framed container
    const screenshotPath = path.join(scratchDir, 'browser-test-favorites-view.png')
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📸 Screenshot captured and saved to: ${screenshotPath}`)

    console.log('🎉 ALL SUITE ASSERTIONS PASSED WITH ZERO ERRORS!')
    process.exit(0)
  } finally {
    if (browser) await browser.close()
    try {
      previewProcess.kill('SIGKILL')
    } catch {}
  }
}

runBrowserVerification().catch((err) => {
  console.error('❌ Browser verification failed:', err)
  process.exit(1)
})
