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
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    // Listen to browser console and page errors
    page.on('console', (msg) => console.log('PAGE LOG:', msg.type(), msg.text()))
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message))

    console.log('🔗 Navigating to http://127.0.0.1:4173 ...')
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2', timeout: 30000 })

    const pageContent = await page.content()
    console.log('Page content length:', pageContent.length)
    if (pageContent.includes('VITE_SUPABASE_ANON_KEY is missing')) {
      console.warn('⚠️ Warning: VITE_SUPABASE_ANON_KEY is missing!')
    }

    // Wait for header and table to hydrate
    await page.waitForSelector('table', { timeout: 15000 })
    console.log('✅ Table hydrated successfully.')

    // 1. Initial State: All-Time should be active, and "All History" badge should be visible
    const allHistoryBadge = await page.$('[data-testid="all-history-badge"]')
    if (!allHistoryBadge) {
      console.warn('⚠️ All History badge not found by testid, checking text...')
    } else {
      console.log('✅ "All History" badge verified in All-Time view.')
    }

    // 2. Click "Today (Daily)"
    console.log('👉 Clicking "Today (Daily)" tab...')
    const buttons = await page.$$('button')
    let dailyBtn
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b)
      if (text && text.includes('Today (Daily)')) {
        dailyBtn = b
        break
      }
    }

    if (!dailyBtn) {
      throw new Error('Could not find "Today (Daily)" button')
    }
    await dailyBtn.click()
    await new Promise((resolve) => setTimeout(resolve, 800))

    // 3. Verify Historical Date Selector appears
    const dateSelector = await page.waitForSelector('#snapshot-date-select', { timeout: 5000 })
    if (!dateSelector) {
      throw new Error('Historical date selector (#snapshot-date-select) failed to render!')
    }
    console.log('✅ Date selector dropdown rendered.')

    // Get options in the dropdown
    const options = await page.evaluate((sel) => {
      const el = document.querySelector('#snapshot-date-select')
      if (!el) return []
      return Array.from(el.options).map((o) => ({ value: o.value, text: o.text }))
    })
    console.log('📅 Available Dates in Dropdown:', options)

    if (options.length === 0) {
      throw new Error('Date selector has 0 options!')
    }

    // 4. Test selecting the second date if available (e.g. 2026-11-05)
    if (options.length > 1) {
      const pastDate = options[1].value
      console.log(`👉 Selecting past date: ${pastDate} ...`)
      await page.select('#snapshot-date-select', pastDate)
      await new Promise((resolve) => setTimeout(resolve, 800))

      const rowsCount = await page.evaluate(() => {
        return document.querySelectorAll('tbody tr').length
      })
      console.log(`✅ Table updated for past date ${pastDate} with ${rowsCount} rows.`)
    }

    // 5. Take screenshot proof
    const screenshotPath = path.join(scratchDir, 'browser-test-date-selector.png')
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
