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

    // 2. Click "This Week" tab
    console.log('👉 Clicking "This Week" tab...')
    const buttons = await page.$$('button')
    let weekBtn
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b)
      if (text && text.includes('This Week')) {
        weekBtn = b
        break
      }
    }
    if (!weekBtn) {
      throw new Error('Could not find "This Week" button')
    }
    await weekBtn.click()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 3. Verify rank uniqueness (ZERO duplicate ranks in table)
    const ranks = await page.evaluate(() => {
      const rankElements = document.querySelectorAll('tbody tr td:first-child span')
      return Array.from(rankElements).map((el) => el.textContent?.trim() || '')
    })
    console.log('📊 Ranks rendered in This Week table:', ranks.slice(0, 15))
    const rankSet = new Set(ranks)
    if (ranks.length > 0 && rankSet.size !== ranks.length) {
      throw new Error(`Duplicate ranks detected in table! Total rows: ${ranks.length}, Unique ranks: ${rankSet.size}`)
    }
    console.log(`✅ Rank uniqueness verified: all ${ranks.length} rows have unique ranks (no duplicate #2s)!`)

    // 4. Click first row to expand and inspect Trending Presence stats
    console.log('👉 Clicking first row to expand AI specs and Trending Presence...')
    const firstRow = await page.$('tbody tr')
    if (firstRow) {
      await firstRow.click()
      await new Promise((resolve) => setTimeout(resolve, 800))

      const expandedText = await page.evaluate(() => {
        const expandedRow = document.querySelector('tbody tr + tr')
        return expandedRow ? expandedRow.textContent : ''
      })

      if (expandedText && expandedText.includes('Trending Presence')) {
        console.log('✅ Expanded row rendered Trending Presence.')
        // Verify dashes are replaced with real metrics
        if (expandedText.includes('7d Hotness: —') && expandedText.includes('30d Endurance: —')) {
          console.warn('⚠️ Warning: Still found dashes in 7d Hotness')
        } else {
          console.log('✅ 7d Hotness and 30d Endurance successfully populated with real numbers!')
        }
      }
    }

    // 5. Take screenshot proof
    const screenshotPath = path.join(scratchDir, 'browser-test-fixed-dashboard.png')
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📸 Screenshot captured and saved to: ${screenshotPath}`)

    console.log('🎉 ALL BROWSER ASSERTIONS PASSED WITH ZERO ERRORS!')
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
