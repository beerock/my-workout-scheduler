/**
 * Test script for class state detection on YMCA schedule
 * Tests detection of: Register, Waitlist Only, Full, Cancelled, Not Reservable
 *
 * Usage:
 *   npx tsx scripts/test-class-state-detection.ts
 *   npx tsx scripts/test-class-state-detection.ts --headless=false
 *   KEEP_BROWSER_OPEN=true npx tsx scripts/test-class-state-detection.ts --headless=false
 */

import puppeteer from 'puppeteer'

// Parse command line arguments
const args = process.argv.slice(2)
const headlessArg = args.find(arg => arg.startsWith('--headless='))
const headless = headlessArg ? headlessArg.split('=')[1] !== 'false' : true

const YMCA_SCHEDULE_BASE_URL = 'https://www.ymcawnc.org/schedules'

// Test cases for today (Jan 18, 2026 - Sunday)
// These are classes we found on the live schedule with different states
const testCases = [
  {
    name: 'Bookable (Register)',
    classType: 'Strength Fusion',
    time: '09:30',
    branch: 'Woodfin YMCA',
    expectedCta: 'Register',
  },
  {
    name: 'Waitlist',
    classType: 'Cycle',
    time: '10:30',
    branch: 'Woodfin YMCA',
    expectedCta: 'Waitlist only',
  },
  {
    name: 'Full',
    classType: 'Racquetball',
    time: '11:10',
    branch: 'Asheville YMCA',
    expectedCta: 'Full',
  },
  {
    name: 'Cancelled',
    classType: 'Strength Fusion',
    time: '10:15',
    branch: 'Ferguson Family YMCA',
    expectedCta: 'Register', // Has Register CTA but title contains "CANCELED:"
    expectCancelled: true,
  },
]

async function detectClassState(page: any, classType: string, time: string, branch: string) {
  // Convert time to match format on page (e.g., "10:30" -> "10:30am")
  const hour = parseInt(time.split(':')[0])
  const minute = time.split(':')[1]
  const ampm = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  const timePattern = `${hour12}:${minute}${ampm}`

  console.log(`\n🔍 Searching for: ${classType} at ${timePattern} @ ${branch}`)

  // Find all schedule rows
  const rows = await page.$$('.schedules-data__row')
  console.log(`   Found ${rows.length} class rows on page`)

  for (const row of rows) {
    const rowText = await row.evaluate((el: Element) => el.textContent?.toLowerCase() || '')

    // Check if this row matches our class
    if (rowText.includes(classType.toLowerCase()) && rowText.includes(timePattern.toLowerCase())) {
      // Check for branch match
      const branchLower = branch.toLowerCase().replace(' ymca', '')
      if (rowText.includes(branchLower)) {
        console.log(`   ✓ Found matching class row`)

        // Check for CANCELED in title - look for the class name button specifically
        const titleButton = await row.$('button[href*="modal--class"]')
        const title = titleButton ? await titleButton.evaluate((el: Element) => el.textContent || '') : ''
        const isCancelled = title.toLowerCase().includes('canceled') || rowText.includes('canceled:')

        // Find CTA link
        const ctaLink = await row.$('a.btn-primary')
        const ctaText = ctaLink ? await ctaLink.evaluate((el: Element) => el.textContent?.trim() || '') : 'No CTA'

        // Get spots info if available
        const spotsText = rowText.match(/(\d+) spots? left/)?.[0] || ''

        return {
          found: true,
          title: title.trim(),
          ctaText,
          isCancelled,
          spotsLeft: spotsText,
        }
      }
    }
  }

  return { found: false, title: '', ctaText: '', isCancelled: false, spotsLeft: '' }
}

async function main() {
  console.log('🧪 Class State Detection Test\n')
  console.log('='.repeat(60))
  console.log(`Date: ${new Date().toLocaleDateString()} (today's schedule)`)
  console.log(`Headless: ${headless ? 'Yes' : 'No (browser visible)'}`)
  console.log('='.repeat(60))

  const browser = await puppeteer.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  // Get today's date in YYYY-MM-DD format
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]

  const scheduleUrl = `${YMCA_SCHEDULE_BASE_URL}?date=${dateStr}`
  console.log(`\n📅 Navigating to: ${scheduleUrl}`)

  await page.goto(scheduleUrl, { waitUntil: 'networkidle2', timeout: 30000 })
  await page.waitForSelector('.schedules-data__row', { timeout: 10000 })

  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Results')
  console.log('='.repeat(60))

  const results: { name: string; pass: boolean; details: string }[] = []

  for (const test of testCases) {
    const result = await detectClassState(page, test.classType, test.time, test.branch)

    let pass = false
    let details = ''

    if (!result.found) {
      details = '❌ Class not found on schedule'
    } else {
      details = `Title: "${result.title}", CTA: "${result.ctaText}"`
      if (result.spotsLeft) details += `, ${result.spotsLeft}`

      // Check if result matches expected
      if (test.expectCancelled) {
        pass = result.isCancelled
        if (pass) {
          details += ' ✅ Correctly detected as CANCELLED'
        } else {
          details += ' ❌ Expected CANCELLED but not detected'
        }
      } else {
        pass = result.ctaText.toLowerCase().includes(test.expectedCta.toLowerCase())
        if (pass) {
          details += ` ✅ Expected "${test.expectedCta}"`
        } else {
          details += ` ❌ Expected "${test.expectedCta}"`
        }
      }
    }

    results.push({ name: test.name, pass, details })
    console.log(`\n${pass ? '✅' : '❌'} ${test.name}`)
    console.log(`   ${details}`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 Summary')
  console.log('='.repeat(60))
  const passed = results.filter(r => r.pass).length
  console.log(`Passed: ${passed}/${results.length}`)
  results.forEach(r => {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.name}`)
  })

  // Keep browser open if requested
  if (process.env.KEEP_BROWSER_OPEN === 'true') {
    console.log('\n⏸️  Browser kept open. Press Ctrl+C to close.')
    await new Promise(() => {}) // Wait forever
  } else {
    await browser.close()
  }
}

main().catch(console.error)
