/**
 * Puppeteer script to automate class bookings on YMCA Daxko platform
 * Handles login, branch selection, class finding, and booking
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

// Detect production environment (GitHub Actions)
const IS_PRODUCTION = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

// =============================================================================
// YMCA Constants (MVP: Single gym - YMCA of Western North Carolina)
// =============================================================================

/**
 * YMCA schedule base URL - all bookings go through this entry point
 * The hybrid flow navigates here, finds the class, then redirects through
 * GroupExPro login to Daxko for final booking
 */
const YMCA_SCHEDULE_BASE_URL = 'https://www.ymcawnc.org/schedules'

/**
 * YMCA timezone - used for date calculations in schedule URLs
 * IANA timezone that auto-handles DST
 */
const YMCA_TIMEZONE = 'America/New_York'

/**
 * Available YMCA branches (hardcoded for MVP)
 * Used for URL-based location filtering on schedule page
 * Exported for use in UI dropdown components
 */
export const YMCA_BRANCHES = [
  'Asheville YMCA',
  'Black Mountain YMCA',
  'Corpening Memorial YMCA',
  'Ferguson Family YMCA',
  'Hendersonville Family YMCA',
  'Reuter Family YMCA',
  'Woodfin YMCA',
] as const

export type YMCABranch = typeof YMCA_BRANCHES[number]

// =============================================================================
// YMCA Helper Functions
// =============================================================================

/**
 * Calculate the target date for YMCA schedule URL in YYYY-MM-DD format
 * Uses the gym's timezone for accurate date calculation
 *
 * Date Logic (same as navigateToDay() and calculateNextClassDate()):
 * - Classes are only on the CURRENT week (next 0-6 days)
 * - If today is Sunday and class is Thursday → returns THIS Thursday
 * - If today is Monday and class is Monday:
 *   - If class time is AFTER current time → returns TODAY
 *   - If class time has PASSED → returns NEXT Monday (7 days out)
 *
 * @param dayOfWeek 0-6 (Sunday-Saturday) - which day class occurs
 * @param classTime HH:MM format (e.g., "15:00") - when class starts
 * @returns YYYY-MM-DD string for the next class occurrence
 */
function calculateTargetDateYYYYMMDD(
  dayOfWeek: number,
  classTime: string
): string {
  // Get current time in gym timezone using Intl.DateTimeFormat
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: YMCA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(now)
  const gymDate = {
    year: parseInt(parts.find(p => p.type === 'year')!.value),
    month: parseInt(parts.find(p => p.type === 'month')!.value),
    day: parseInt(parts.find(p => p.type === 'day')!.value),
    hour: parseInt(parts.find(p => p.type === 'hour')!.value),
    minute: parseInt(parts.find(p => p.type === 'minute')!.value),
  }

  // Get current day of week from timezone-aware formatter
  const weekdayPart = parts.find(p => p.type === 'weekday')?.value || ''
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const currentDayOfWeek = weekdayMap[weekdayPart] ?? 0

  // Calculate days until target day
  let daysUntilTarget = dayOfWeek - currentDayOfWeek

  // Handle same-day classes: check if class time has passed
  if (daysUntilTarget === 0) {
    const [classHour, classMinute] = classTime.split(':').map(Number)
    const currentTimeMinutes = gymDate.hour * 60 + gymDate.minute
    const classTimeMinutes = classHour * 60 + classMinute

    if (currentTimeMinutes >= classTimeMinutes) {
      // Class time has passed today, look for next week
      daysUntilTarget = 7
    }
  } else if (daysUntilTarget < 0) {
    // Past day this week, look for next week
    daysUntilTarget += 7
  }

  // Calculate target date
  const targetDate = new Date(gymDate.year, gymDate.month - 1, gymDate.day)
  targetDate.setDate(targetDate.getDate() + daysUntilTarget)

  // Format as YYYY-MM-DD
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Navigate to YMCA schedule page with date and location filters
 *
 * URL format: https://www.ymcawnc.org/schedules?date=YYYY-MM-DD&locations=Branch%20Name
 *
 * Benefits of URL-based filtering:
 * - Page loads pre-filtered (no checkbox interaction needed)
 * - Faster than clicking filters + waiting for reload
 * - Reduces ambiguity when searching for class by name/time
 *
 * @param page Puppeteer page instance
 * @param targetDate YYYY-MM-DD format date string
 * @param branch YMCA branch name (e.g., "Ferguson Family YMCA")
 * @returns Success/failure result with error message
 */
async function navigateToYMCASchedule(
  page: Page,
  targetDate: string,
  branch: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Construct URL with date and location filters
    // URL-encode the branch name (spaces → %20)
    const encodedBranch = encodeURIComponent(branch)
    const scheduleUrl = `${YMCA_SCHEDULE_BASE_URL}?date=${targetDate}&locations=${encodedBranch}`

    console.log(`📅 Navigating to YMCA schedule: ${scheduleUrl}`)
    await page.goto(scheduleUrl, { waitUntil: 'networkidle2' })

    // Wait for class cards to load
    // YMCA site uses various containers for class listings
    const classCardSelectors = [
      '[class*="class"]',
      '[class*="schedule"]',
      '[class*="event"]',
      '.card',
      'article',
    ]

    let foundClassCards = false
    for (const selector of classCardSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        const count = await page.$$eval(selector, els => els.length)
        if (count > 0) {
          console.log(`✅ Found ${count} elements with selector: ${selector}`)
          foundClassCards = true
          break
        }
      } catch {
        continue
      }
    }

    if (!foundClassCards) {
      console.log('⚠️ Could not find class cards with standard selectors, proceeding anyway...')
    }

    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log(`✅ Successfully navigated to YMCA schedule for ${targetDate} at ${branch}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to navigate to YMCA schedule',
    }
  }
}

/**
 * Result type for YMCA class search
 */
type YMCAClassSearchResult = {
  found: boolean
  status?: 'available' | 'waitlist' | 'full' | 'cancelled' | 'not_reservable'
  registerUrl?: string
  errorMessage?: string
}

/**
 * Find a class on the YMCA schedule page and extract its status
 *
 * Detection order:
 * 1. Find class by matching name/time/location
 * 2. Check if class name starts with "CANCELED: " → STOP (do NOT click CTA)
 * 3. Check CTA state: Register / Waitlist Only / Full / No CTA
 *
 * @param page Puppeteer page instance
 * @param classType Class name to search for (e.g., "BODYPUMP")
 * @param classTime Class time in HH:MM format (e.g., "15:00")
 * @param branch Branch name for additional matching
 * @returns Search result with status and register URL
 */
async function findClassOnYMCA(
  page: Page,
  classType: string,
  classTime: string,
  branch: string
): Promise<YMCAClassSearchResult> {
  try {
    console.log(`🔍 Searching for class: ${classType} at ${classTime} (${branch})`)

    // Convert time to 12-hour format for matching
    const [hours, minutes] = classTime.split(':').map(Number)
    const hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours)
    const ampm = hours >= 12 ? 'pm' : 'am'
    const targetTime12 = `${hour12}:${minutes.toString().padStart(2, '0')}${ampm}`
    const targetTime12WithSpace = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`

    console.log(`   Looking for time: ${targetTime12} or ${targetTime12WithSpace}`)

    // Function to search current page content
    const searchPage = async (): Promise<YMCAClassSearchResult> => {
      // Get all page content to search
      const pageContent = await page.content()
      const pageContentLower = pageContent.toLowerCase()

      // Try to find the class by evaluating the DOM
      const classInfo = await page.evaluate((params) => {
        const { classType, targetTime12, targetTime12WithSpace, branch } = params
        const classTypeLower = classType.toLowerCase()

        // Find all potential class containers
        // YMCA uses .schedules-data__row for each individual class card
        // (.schedules-data is the parent container with ALL classes - don't use it)
        const containersList = document.querySelectorAll(
          '.schedules-data__row, .class-card, .event-card, .schedule-item, .card, div[data-class], div[data-event]'
        )
        const containers = Array.from(containersList)

        for (const container of containers) {
          const text = container.textContent?.toLowerCase() || ''
          const html = container.outerHTML.toLowerCase()

          // Check for class name match (fuzzy)
          const matchesClass = text.includes(classTypeLower) ||
            // Handle variations
            text.includes(classTypeLower.replace(/\s+/g, ''))

          // Check for time match using word boundaries to prevent "12:00pm" matching "2:00pm"
          // Use regex with \b word boundary - time strings only contain safe chars (digits, colon, letters)
          const time1 = targetTime12.toLowerCase()
          const time2 = targetTime12WithSpace.toLowerCase()
          const time3 = targetTime12.replace(':', '').toLowerCase()
          const matchesTime =
            new RegExp('\\b' + time1 + '\\b').test(text) ||
            new RegExp('\\b' + time2 + '\\b').test(text) ||
            new RegExp('\\b' + time3 + '\\b').test(text)

          if (matchesClass && matchesTime) {
            // Found the class! Now check status

            // CRITICAL: Check for "CANCELED" + class name (fuzzy match)
            // YMCA staff manually type cancellations, so format varies:
            // "CANCELED: Cycle", "CANCELED Cycle", "CANCELED - Cycle", "Cancelled: Cycle"
            // Use regex to match "cancel" followed by optional punctuation then class name
            const cancelPattern = new RegExp(
              `cancel[led]*[:\\s\\-]*${classTypeLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
              'i'
            )
            const isCancelled = cancelPattern.test(text)

            // Find CTA/Register link - look for btn-primary (YMCA style) or any groupexpro link
            const registerLink = container.querySelector('a.btn-primary[href*="groupexpro"], a.btn[href*="groupexpro"], a[href*="groupexpro.com/gxp/reservations"]')
            const ctaText = registerLink?.textContent?.toLowerCase() || ''
            const registerHref = registerLink?.getAttribute('href') || ''

            // Check CTA states
            const hasRegisterCTA = ctaText.includes('register')
            const hasWaitlistCTA = ctaText.includes('waitlist')
            const hasFullIndicator = text.includes('full') && !hasRegisterCTA && !hasWaitlistCTA

            return {
              found: true,
              isCancelled,
              hasRegisterCTA,
              hasWaitlistCTA,
              hasFullIndicator,
              registerHref,
              text: text.substring(0, 500),
            }
          }
        }

        return { found: false }
      }, { classType, targetTime12, targetTime12WithSpace, branch })

      if (!classInfo.found) {
        return { found: false }
      }

      console.log(`✅ Found class matching criteria`)
      console.log(`   Preview: ${classInfo.text?.substring(0, 200)}...`)

      // CRITICAL: Check for cancelled class FIRST
      if (classInfo.isCancelled) {
        console.log(`⚠️ Class is CANCELLED - not proceeding with booking`)
        return {
          found: true,
          status: 'cancelled',
          errorMessage: 'This class has been cancelled by the gym.',
        }
      }

      // Determine status based on CTA
      if (classInfo.hasRegisterCTA && classInfo.registerHref) {
        console.log(`✅ Class is available for registration`)
        console.log(`   Register URL: ${classInfo.registerHref}`)
        return {
          found: true,
          status: 'available',
          registerUrl: classInfo.registerHref,
        }
      }

      if (classInfo.hasWaitlistCTA && classInfo.registerHref) {
        console.log(`⚠️ Class is full - waitlist only`)
        return {
          found: true,
          status: 'waitlist',
          registerUrl: classInfo.registerHref,
        }
      }

      if (classInfo.hasFullIndicator) {
        console.log(`⚠️ Class is full - no booking available`)
        return {
          found: true,
          status: 'full',
          errorMessage: 'Class is full with no waitlist available.',
        }
      }

      // No CTA found - not reservable
      console.log(`⚠️ No booking CTA found - class may not be reservable`)
      return {
        found: true,
        status: 'not_reservable',
        errorMessage: 'Class does not have a booking option.',
      }
    }

    // First attempt: search current page
    let result = await searchPage()

    // If not found, try page-based pagination (YMCA uses "Page X of Y" with chevron buttons)
    if (!result.found) {
      console.log('Class not found in initial results, checking for pagination...')
      let paginationAttempts = 0
      const maxPaginationAttempts = 10

      while (paginationAttempts < maxPaginationAttempts && !result.found) {
        // Check current page info and find next page button
        const paginationInfo = await page.evaluate(() => {
          // Look for "Page X of Y" text
          const pageText = document.body.innerText.match(/Page (\d+) of (\d+)/i)
          const currentPage = pageText ? parseInt(pageText[1]) : 1
          const totalPages = pageText ? parseInt(pageText[2]) : 1

          // Find next page button (chevron_right or > symbol)
          const nextButtons = Array.from(document.querySelectorAll('a, button'))
          const nextButton = nextButtons.find(el => {
            const text = el.textContent?.trim() || ''
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || ''
            return (
              text === '>' ||
              text === 'chevron_right' ||
              text.includes('next') ||
              ariaLabel.includes('next')
            )
          })

          return {
            currentPage,
            totalPages,
            hasNextPage: currentPage < totalPages,
            nextButtonExists: !!nextButton,
          }
        })

        console.log(`   Page ${paginationInfo.currentPage} of ${paginationInfo.totalPages}`)

        if (!paginationInfo.hasNextPage || !paginationInfo.nextButtonExists) {
          console.log('No more pages to check - reached end of pagination')
          break
        }

        // Click next page button
        console.log(`Clicking next page (going to page ${paginationInfo.currentPage + 1})...`)
        // Note: Use evaluate() for complex selectors since Puppeteer uses standard CSS (not Playwright selectors)
        const nextButton = null // Skip page.$() - use evaluate fallback below

        if (!nextButton) {
          // Click the BOTTOM pagination (class list), NOT the TOP date navigation
          // YMCA uses different classes:
          //   - TOP (date nav): .schedule-dashboard__arrow with aria-label="next date"
          //   - BOTTOM (pagination): .schedule-dashboard__pager--next
          const clicked = await page.evaluate(() => {
            // First try: specific YMCA pagination class (most reliable)
            const pagerNext = document.querySelector('.schedule-dashboard__pager--next') as HTMLElement
            if (pagerNext) {
              pagerNext.click()
              return true
            }
            // Fallback: find chevron_right that's NOT the date navigation
            const buttons = Array.from(document.querySelectorAll('a, button'))
            const next = buttons.find(el => {
              const text = el.textContent?.trim() || ''
              const ariaLabel = el.getAttribute('aria-label') || ''
              // Skip date navigation arrows
              if (ariaLabel.includes('date')) return false
              return text === 'chevron_right' && !el.classList.contains('schedule-dashboard__arrow')
            })
            if (next) {
              (next as HTMLElement).click()
              return true
            }
            return false
          })

          if (!clicked) {
            console.log('Could not find next page button')
            break
          }
        } else {
          await nextButton.click()
        }

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000))

        // IMPORTANT: Scroll to top of page after pagination
        // YMCA site does NOT auto-scroll after pagination click
        // Without this, we'd miss classes at the top of the next page
        await page.evaluate(() => {
          window.scrollTo(0, 0)
        })
        await new Promise(resolve => setTimeout(resolve, 500))

        // Search again on new page
        result = await searchPage()
        paginationAttempts++
      }
    }

    if (!result.found) {
      return {
        found: false,
        errorMessage: `Class "${classType}" at ${classTime} not found on YMCA schedule.`,
      }
    }

    return result
  } catch (error) {
    return {
      found: false,
      errorMessage: error instanceof Error ? error.message : 'Error searching for class on YMCA',
    }
  }
}

/**
 * Perform GroupExPro single-step login
 *
 * Unlike Daxko's 2-step login (email → password), GroupExPro has both fields
 * on the same form. After successful login, the user is redirected to Daxko
 * for the actual booking.
 *
 * @param page Puppeteer page instance
 * @param registerUrl The GroupExPro registration URL to navigate to
 * @param username User's email address
 * @param password User's password
 * @returns Success with Daxko redirect URL, or failure with error
 */
async function performGroupExProLogin(
  page: Page,
  registerUrl: string,
  username: string,
  password: string
): Promise<{ success: boolean; daxkoUrl?: string; error?: string }> {
  try {
    // STEP 1: Navigate to GroupExPro login page
    console.log(`🔐 Navigating to GroupExPro login: ${registerUrl}`)
    await page.goto(registerUrl, { waitUntil: 'networkidle2' })
    await takeScreenshot(page, '03-groupexpro-login')

    // STEP 2: Click Login button WITHOUT entering credentials
    // This redirects to Daxko login where we'll enter credentials
    console.log('📝 Clicking Login to redirect to Daxko...')

    const loginButton = await page.$('button[type="submit"], input[type="submit"], input[value="Login"]')
    if (!loginButton) {
      return { success: false, error: 'Could not find Login button on GroupExPro page' }
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      loginButton.click(),
    ])

    // STEP 3: Should now be on Daxko login page
    const daxkoLoginUrl = page.url()
    console.log(`   Redirected to: ${daxkoLoginUrl}`)

    if (!daxkoLoginUrl.includes('operations.daxko.com')) {
      await takeScreenshot(page, '03-redirect-failed')
      return { success: false, error: `Expected redirect to Daxko, but got: ${daxkoLoginUrl}` }
    }

    await takeScreenshot(page, '03a-daxko-login')

    // STEP 4: Complete Daxko 2-step login
    // Step 4a: Enter email and click Submit
    console.log('📝 Completing Daxko login...')
    console.log('   Step 1: Entering email...')

    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 })
    const emailField = await page.$('input[type="text"], input[type="email"]')
    if (!emailField) {
      return { success: false, error: 'Could not find email field on Daxko login page' }
    }

    await emailField.type(username, { delay: 50 })
    console.log(`   Entered email: ${username}`)

    // Find and click Submit button
    const submitButton = await page.$('button[type="submit"], input[type="submit"]')
    if (!submitButton) {
      return { success: false, error: 'Could not find Submit button on Daxko login page' }
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      submitButton.click(),
    ])

    await takeScreenshot(page, '03b-daxko-password')

    // Step 4b: Enter password and click Login (DON'T check "Keep me logged in")
    console.log('   Step 2: Entering password...')

    await page.waitForSelector('input[type="password"]', { timeout: 10000 })
    const passwordField = await page.$('input[type="password"]')
    if (!passwordField) {
      return { success: false, error: 'Could not find password field on Daxko password page' }
    }

    await passwordField.type(password, { delay: 50 })
    console.log('   Entered password successfully')

    // Make sure "Keep me logged in" is NOT checked
    const keepLoggedInCheckbox = await page.$('input[type="checkbox"]')
    if (keepLoggedInCheckbox) {
      const isChecked = await page.evaluate((el) => (el as HTMLInputElement).checked, keepLoggedInCheckbox)
      if (isChecked) {
        console.log('   Unchecking "Keep me logged in"')
        await keepLoggedInCheckbox.click()
      }
    }

    // Find and click Login button
    const loginBtn = await page.$('button[type="submit"], input[type="submit"]')
    if (!loginBtn) {
      return { success: false, error: 'Could not find Login button on Daxko password page' }
    }

    console.log('   Clicking Login...')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      loginBtn.click(),
    ])

    // STEP 5: Verify we're on ChooseMembers page
    const finalUrl = page.url()
    const finalUrlPath = finalUrl.split('?')[0]
    console.log(`   Final URL: ${finalUrl}`)

    if (finalUrl.includes('operations.daxko.com') && finalUrlPath.includes('ChooseMembers.mvc')) {
      console.log('✅ Successfully logged in and reached ChooseMembers page')
      await takeScreenshot(page, '04-daxko-choosemembers')
      return { success: true, daxkoUrl: finalUrl }
    }

    // Check for login errors
    const pageContent = (await page.content()).toLowerCase()
    if (pageContent.includes('invalid') || pageContent.includes('incorrect') || pageContent.includes('error')) {
      await takeScreenshot(page, '03-login-failed')
      return {
        success: false,
        error: 'Daxko login failed - credentials may be incorrect.',
      }
    }

    await takeScreenshot(page, '03-unexpected')
    return {
      success: false,
      error: `Unexpected page after login. URL: ${finalUrl}`,
    }
  } catch (error) {
    await takeScreenshot(page, '03-error')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login error',
    }
  }
}

/**
 * Complete booking on Daxko ChooseMembers page
 *
 * This function is used by both:
 * 1. YMCA Hybrid flow (after GroupExPro login redirects to Daxko)
 * 2. Pure Daxko flow (after Daxko login navigates to class)
 *
 * The page should already be on the Daxko ChooseMembers.mvc page with:
 * - Class info displayed
 * - Member selection checkbox(es) visible
 * - RESERVE or WAITLIST button present
 *
 * @param page Puppeteer page on Daxko ChooseMembers page
 * @param branchUsed Branch name for result reporting
 * @returns Booking result with status and any error message
 */
async function completeDaxkoBooking(
  page: Page,
  branchUsed: string
): Promise<{
  status: 'confirmed' | 'waitlisted' | 'failed'
  errorMessage?: string
  selectedBranch: string
}> {
  try {
    console.log('📋 Completing Daxko booking on ChooseMembers page...')

    // Verify we're on the right page
    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    if (!currentUrl.includes('ChooseMembers') && !currentUrl.includes('choosemembers')) {
      console.log('⚠️ Warning: May not be on ChooseMembers page, proceeding anyway...')
    }

    // STEP 1: Select checkbox for user in "Active Members" section
    console.log('Looking for user checkbox in "Active Members" section...')

    const checkboxSelectors = [
      'input[type="checkbox"]',
      'input[type="checkbox"][name*="member"]',
      'input[type="checkbox"][value*="member"]',
    ]

    let userCheckbox = null

    for (const selector of checkboxSelectors) {
      try {
        const checkboxes = await page.$$(selector)
        for (const checkbox of checkboxes) {
          // Check if this checkbox is unchecked (it should be for user selection)
          const isChecked = await page.evaluate((el) => (el as HTMLInputElement).checked, checkbox)

          if (!isChecked) {
            // This is likely our user's checkbox
            userCheckbox = checkbox
            break
          }
        }
        if (userCheckbox) break
      } catch {
        continue
      }
    }

    if (!userCheckbox) {
      console.log('Warning: Could not find user checkbox, may already be selected or page structure different')
      // Don't fail here - might already be selected or not needed in some cases
    } else {
      console.log('Found user checkbox, clicking to select member...')
      await userCheckbox.click()
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for selection to register
      console.log('User checkbox selected')
    }

    // STEP 2: Check if class is full (user will be added to waitlist)
    // Note: YMCA shows "Active Members (Accepting Spot in WaitList)" when full
    // The button still says "RESERVE" even when joining waitlist!
    const descriptionContent = await page.content()
    const descriptionContentLower = descriptionContent.toLowerCase()

    const isFullWaitlist =
      descriptionContentLower.includes('accepting spot in waitlist') ||
      descriptionContentLower.includes('reservation spots are full') ||
      descriptionContentLower.includes('any one active member can join waitlist')

    if (isFullWaitlist) {
      console.log('⚠️  Class is FULL - user will be added to WAITLIST')
    } else {
      console.log('✓ Class has available spots - user will be BOOKED')
    }

    // STEP 3: Find RESERVE button
    // Note: Button text is ALWAYS "RESERVE" regardless of booking vs waitlist
    console.log('Looking for RESERVE button...')

    const reserveButtonSelectors = [
      'button:has-text("RESERVE")',
      'button:has-text("Reserve")',
      'a:has-text("RESERVE")',
      'a.btn:has-text("RESERVE")',
      'input[type="submit"][value="RESERVE"]',
      'input[type="button"][value="RESERVE"]',
      // Also check for WAITLIST button
      'button:has-text("WAITLIST")',
      'a:has-text("WAITLIST")',
    ]

    let reserveButton = null

    // Try standard selectors first
    for (const selector of reserveButtonSelectors) {
      try {
        const buttons = await page.$$(selector)
        for (const btn of buttons) {
          const btnText = await page.evaluate(
            (el) => (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value?.trim() || '',
            btn
          )
          console.log(`   Found button: "${btnText}"`)

          if (btnText && (btnText.toUpperCase().includes('RESERVE') || btnText.toUpperCase().includes('WAITLIST'))) {
            reserveButton = btn
            break
          }
        }
        if (reserveButton) break
      } catch {
        continue
      }
    }

    // Fallback: search all buttons/links on page
    if (!reserveButton) {
      console.log('Trying fallback button search...')
      const allButtons = await page.$$('button, a, input[type="submit"], input[type="button"]')
      for (const btn of allButtons) {
        const btnText = await page.evaluate(
          (el) => (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value?.trim() || '',
          btn
        )
        if (btnText && (btnText.toUpperCase() === 'RESERVE' || btnText.toUpperCase() === 'WAITLIST')) {
          reserveButton = btn
          console.log(`   Found via fallback: "${btnText}"`)
          break
        }
      }
    }

    if (!reserveButton) {
      return {
        status: 'failed',
        errorMessage:
          'No RESERVE button found on Daxko booking page.\n\nWhy this happens: Class may not allow online reservations, website changed, or wrong class selected.\n\nWhat to do: Try booking manually through gym website to verify. Check screenshot in booking history to see what page we landed on.',
        selectedBranch: branchUsed,
      }
    }

    // STEP 4: Click RESERVE button and wait for navigation to confirmation page
    console.log('Clicking RESERVE button...')
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        reserveButton.click(),
      ])
      console.log('Navigation to confirmation page complete')
    } catch {
      // If navigation times out, wait a bit and continue anyway (page might have loaded)
      console.log('Navigation wait timed out or failed, continuing anyway...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Take screenshot of confirmation
    await takeScreenshot(page, '05-booking-result')

    // STEP 5: Check confirmation page with actual YMCA Daxko keywords
    const finalUrl = page.url()
    const finalContent = (await page.content()).toLowerCase()

    console.log(`Final URL: ${finalUrl}`)
    console.log('Checking for confirmation keywords...')

    // Check for concurrent booking conflict (user already has a class at this time)
    const hasConcurrentConflict =
      finalContent.includes('already have an existing reservation during this time') ||
      finalContent.includes('already have a reservation during this time') ||
      (finalContent.includes('could not be completed') && finalContent.includes('existing reservation'))

    if (hasConcurrentConflict) {
      console.log('⚠️  Concurrent booking conflict detected - user already has a class at this time')
      return {
        status: 'failed',
        errorMessage:
          "You already have another class booked at this time.\n\nWhat to do:\n1. Log into your gym account and find your existing reservation\n2. Cancel it if you prefer this class instead\n3. Or adjust your schedule to avoid the conflict (Dashboard → Schedule)\n\nGyms don't allow double-booking the same time slot.",
        selectedBranch: branchUsed,
      }
    }

    // Check for cancelled class error
    // Message: "Cannot add exercisers to BODYPUMP as the class has been cancelled."
    const hasClassCancelledError =
      finalContent.includes('class has been cancelled') ||
      finalContent.includes('class has been canceled') ||
      finalContent.includes('cannot add exercisers')

    if (hasClassCancelledError) {
      console.log('⚠️  Class has been cancelled - cannot book')
      return {
        status: 'failed',
        errorMessage:
          "This class has been cancelled by the gym.\n\nWhy this happens: Instructor unavailable, low attendance, or schedule changes.\n\nWhat to do: Remove this class from your schedule (Dashboard → Schedule → Delete). Check your gym's website for the class status or alternative times.",
        selectedBranch: branchUsed,
      }
    }

    // Detect waitlist vs booking using ACTUAL YMCA confirmation page text
    // Waitlist: "Awesome! ... Now that you are in waitlist, you can..."
    // Booking: "Awesome! ... Now that reservation is complete, you can..."
    const isWaitlisted =
      finalContent.includes('now that you are in waitlist') ||
      finalContent.includes('you are in waitlist') ||
      finalContent.includes('added to waitlist') ||
      finalContent.includes('joined the waitlist') ||
      finalContent.includes('on the waitlist')

    const isConfirmed =
      finalContent.includes('now that reservation is complete') ||
      finalContent.includes('reservation is complete') ||
      (finalContent.includes('awesome!') && !isWaitlisted) ||
      finalUrl.includes('confirmation') ||
      finalUrl.includes('success')

    if (isWaitlisted) {
      console.log('✅ Successfully added to WAITLIST')
      return {
        status: 'waitlisted',
        selectedBranch: branchUsed,
      }
    }

    if (isConfirmed) {
      console.log('✅ Successfully BOOKED class')
      return {
        status: 'confirmed',
        selectedBranch: branchUsed,
      }
    }

    console.log('⚠️  Booking result unclear')
    return {
      status: 'failed',
      errorMessage:
        "Booking result unclear after clicking RESERVE button.\n\nWhat to do RIGHT NOW:\n1. Check your gym account to see if the class was booked\n2. Check the screenshots in booking history to see what happened\n3. If booked: Great! You're all set (ignore this error)\n4. If not booked: Try booking manually or check the error in screenshots",
      selectedBranch: branchUsed,
    }
  } catch (error) {
    return {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Daxko booking error',
      selectedBranch: branchUsed,
    }
  }
}

// =============================================================================
// YMCA Hybrid Booking Flow (Main Orchestrator)
// =============================================================================

/**
 * Book a class using the YMCA Hybrid flow
 *
 * Flow:
 * 1. Calculate target date in gym timezone
 * 2. Navigate to YMCA schedule (with date + branch filter)
 * 3. Find class by name/time
 * 4. Check class state (available, waitlist, full, cancelled)
 * 5. Click Register → GroupExPro login
 * 6. Wait for Daxko redirect
 * 7. Complete booking on Daxko ChooseMembers page
 *
 * @param page Puppeteer page instance
 * @param params Booking parameters
 * @returns Booking result
 */
async function bookClassYMCAHybrid(
  page: Page,
  params: BookingParams
): Promise<BookingResult> {
  const { username, password, branch, dayOfWeek, classTime, classType } = params

  let screenshotPath: string | undefined

  try {
    console.log('\n' + '='.repeat(60))
    console.log('🏋️ YMCA Hybrid Booking Flow')
    console.log('='.repeat(60))
    console.log(`   Class: ${classType}`)
    console.log(`   Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}`)
    console.log(`   Time: ${classTime}`)
    console.log(`   Branch: ${branch}`)
    console.log('='.repeat(60) + '\n')

    // STEP 1: Calculate target date in gym timezone
    console.log('📅 Step 1: Calculating target date...')
    const targetDate = calculateTargetDateYYYYMMDD(dayOfWeek, classTime)
    console.log(`   Target date: ${targetDate}`)

    // STEP 2: Navigate to YMCA schedule with date + branch filter
    console.log('\n📅 Step 2: Navigating to YMCA schedule...')
    const navResult = await navigateToYMCASchedule(page, targetDate, branch)
    if (!navResult.success) {
      screenshotPath = await takeScreenshot(page, '01-ymca-schedule-failed')
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage: `Failed to navigate to YMCA schedule: ${navResult.error}`,
        screenshotPath,
      }
    }

    screenshotPath = await takeScreenshot(page, '01-ymca-schedule')

    // STEP 3: Find class on YMCA schedule
    console.log('\n🔍 Step 3: Finding class on schedule...')
    const searchResult = await findClassOnYMCA(page, classType, classTime, branch)

    screenshotPath = await takeScreenshot(page, '02-class-found')

    if (!searchResult.found) {
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage:
          searchResult.errorMessage ||
          `Class "${classType}" at ${classTime} not found on YMCA schedule.\n\nWhy this happens:\n• Class name doesn't match exactly (check for typos)\n• Wrong time, day, or branch selected\n• Gym no longer offers this class\n\nWhat to do:\n1. Go to your gym's website and find the exact class listing\n2. Update your class settings to match EXACTLY\n3. Check the screenshot in booking history to see what classes were found`,
        screenshotPath,
      }
    }

    // STEP 4: Check class state
    console.log('\n📋 Step 4: Checking class state...')
    console.log(`   Status: ${searchResult.status}`)

    // Handle non-bookable states
    if (searchResult.status === 'cancelled') {
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage:
          "This class has been cancelled by the gym and cannot be booked.\n\nWhy this happens: Instructor unavailable, low attendance, or schedule changes.\n\nWhat to do: Remove this class from your schedule (Dashboard → Schedule → Delete). Check your gym's website for the class status or alternative times.",
        screenshotPath,
      }
    }

    if (searchResult.status === 'full') {
      // IMPORTANT: Error message MUST contain "full" to trigger Inngest retry logic
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage:
          "Class is currently full, but don't worry - we've got you covered!\n\nWe'll automatically keep trying every 15 minutes until the class starts. If someone cancels, we'll grab that spot for you. No action needed - just sit back and relax!",
        screenshotPath,
      }
    }

    if (searchResult.status === 'not_reservable') {
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage:
          "This class cannot be reserved online.\n\nWhy this happens: May require special registration, restricted membership level, or in-person booking only.\n\nWhat to do: Contact your gym to ask about booking requirements. Remove from automated schedule if it can't be booked online.",
        screenshotPath,
      }
    }

    // Class is available or waitlist - proceed with booking
    if (!searchResult.registerUrl) {
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage:
          'Could not find Register link for this class.\n\nThe class appears to be available but we could not locate the registration button. Try booking manually through the gym website.',
        screenshotPath,
      }
    }

    // STEP 5: GroupExPro login
    console.log('\n🔐 Step 5: Logging into GroupExPro...')
    const loginResult = await performGroupExProLogin(page, searchResult.registerUrl, username, password)

    if (!loginResult.success) {
      screenshotPath = await takeScreenshot(page, '03-groupexpro-login-failed')
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage: `Login failed: ${loginResult.error}\n\nWhat to do: Try logging into your gym website manually. If successful, update your credentials in Dashboard → Gym Credentials. If you can't log in, reset your password on the gym website first.`,
        screenshotPath,
      }
    }

    // STEP 6: Complete booking on Daxko
    console.log('\n📋 Step 6: Completing booking on Daxko...')
    const bookingResult = await completeDaxkoBooking(page, branch)

    screenshotPath = await takeScreenshot(page, '05-booking-result')

    return {
      status: bookingResult.status,
      branchUsed: bookingResult.selectedBranch,
      errorMessage: bookingResult.errorMessage || null,
      screenshotPath,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Booking error:', errorMessage)

    screenshotPath = await takeScreenshot(page, '99-error')

    return {
      status: 'failed',
      branchUsed: branch,
      errorMessage: `Something unexpected went wrong: ${errorMessage}\n\nThis might be a one-time glitch. The system will try again at the next scheduled time.\n\nIf this happens repeatedly (3+ times), please check the error details in booking history and report the issue with screenshots.`,
      screenshotPath,
    }
  }
}

export type BookingResult = {
  status: 'confirmed' | 'waitlisted' | 'failed' | 'skipped'
  branchUsed: string | null
  errorMessage: string | null
  screenshotPath?: string
}

export type BookingParams = {
  gymUrl: string
  username: string
  password: string
  branch: string
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  classTime: string // Format: "HH:MM" or "HH:MM:SS"
  classType: string // Class name/type to match
  timezone: string // Gym's timezone (e.g., "America/New_York")
  // Note: Skip logic handled by Inngest (not Puppeteer)
}

/**
 * Main booking function
 *
 * For MVP: Uses YMCA Hybrid flow (YMCA schedule → GroupExPro login → Daxko booking)
 * The pure Daxko flow code is preserved below as bookClassDaxko() for potential future revert.
 */
export async function bookClass(params: BookingParams): Promise<BookingResult> {
  // Note: Skip logic is handled by Inngest before calling this function
  // Puppeteer just executes bookings - no business logic checks here

  let browser: Browser | null = null

  try {
    // Launch browser
    // Allow headless mode to be overridden via environment variable (for testing)
    const headlessMode = process.env.PUPPETEER_HEADLESS !== 'false'
    browser = await puppeteer.launch({
      headless: headlessMode,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()
    // Use mobile viewport for faster rendering (all elements still accessible)
    await page.setViewport({ width: 375, height: 667 })

    // Set a reasonable timeout
    page.setDefaultTimeout(30000) // 30 seconds

    // MVP: Use YMCA Hybrid flow for all bookings
    // This navigates YMCA schedule → GroupExPro login → Daxko ChooseMembers
    const result = await bookClassYMCAHybrid(page, params)

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Booking error:', errorMessage)

    return {
      status: 'failed',
      branchUsed: null,
      errorMessage: `Something unexpected went wrong: ${errorMessage}\n\nThis might be a one-time glitch. The system will try again at the next scheduled time.\n\nIf this happens repeatedly (3+ times), please check the error details in booking history and report the issue with screenshots.`,
    }
  } finally {
    // Keep browser open if KEEP_BROWSER_OPEN env var is set (for debugging)
    if (browser && process.env.KEEP_BROWSER_OPEN !== 'true') {
      await browser.close()
    } else if (browser) {
      console.log('\n🔍 Browser kept open for inspection (set KEEP_BROWSER_OPEN=true to enable)')
      console.log('   Close the browser manually when done.')
    }
  }
}

// =============================================================================
// PRESERVED: Pure Daxko Booking Flow (for potential future revert)
// =============================================================================
// If YMCA reverts to pure Daxko login/schedule, uncomment this function
// and modify bookClass() to call it instead of bookClassYMCAHybrid()

/**
 * Book a class using the pure Daxko flow (PRESERVED - NOT CURRENTLY USED)
 *
 * This flow was used before the YMCA hybrid flow was implemented.
 * It goes directly to Daxko login page, then navigates the schedule.
 *
 * @deprecated Use bookClassYMCAHybrid for MVP
 */
async function bookClassDaxko(
  page: Page,
  params: BookingParams
): Promise<BookingResult> {
  const {
    gymUrl,
    username,
    password,
    branch,
    dayOfWeek,
    classTime,
    classType,
    timezone,
  } = params

  let screenshotPath: string | undefined

  try {
    // Navigate to login page first (YMCA Daxko requires separate login page)
    // Extract base URL and construct login URL
    const urlObj = new URL(gymUrl)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`
    const loginUrl = `${baseUrl}/online/4032/Security/login.mvc`

    console.log(`[Daxko Flow] Navigating to login page: ${loginUrl}...`)
    await page.goto(loginUrl, { waitUntil: 'networkidle2' })

    // Take screenshot for debugging
    screenshotPath = await takeScreenshot(page, '01-login-page')

    // Step 1: Login
    console.log('[Daxko Flow] Attempting login...')
    const loginResult = await performLogin(page, username, password)
    if (!loginResult.success) {
      screenshotPath = await takeScreenshot(page, '02-login-failed')
      return {
        status: 'failed',
        branchUsed: null,
        errorMessage: `Login failed: ${loginResult.error}\n\nWhat to do: Try logging into your gym website manually. If successful, update your credentials in Dashboard → Gym Credentials. If you can't log in, reset your password on the gym website first.`,
        screenshotPath,
      }
    }

    screenshotPath = await takeScreenshot(page, '03-after-login')

    // Note: performLogin now handles navigating to class schedule via "Group Ex" link
    // If that didn't work, try navigating directly
    const currentUrl = page.url()
    if (!currentUrl.includes('ClassSchedule') && !currentUrl.includes('GroupEx')) {
      console.log(`[Daxko Flow] Navigating directly to class schedule: ${gymUrl}...`)
      await page.goto(gymUrl, { waitUntil: 'networkidle2' })
    }
    screenshotPath = await takeScreenshot(page, '04-schedule-page')

    // Step 2: Select branch
    console.log(`[Daxko Flow] Selecting branch: ${branch}...`)
    const branchResult = await selectBranch(page, branch)
    if (!branchResult.success) {
      screenshotPath = await takeScreenshot(page, '04-branch-selection-failed')
      return {
        status: 'failed',
        branchUsed: branchResult.selectedBranch || null,
        errorMessage: `Branch selection failed: ${branchResult.error}\n\nWhat to do: Check your gym's website for the exact branch name. Update your class settings to match EXACTLY (including any prefixes like "Asheville - Downtown").`,
        screenshotPath,
      }
    }

    screenshotPath = await takeScreenshot(page, '04-after-branch-selection')

    // Step 3: Navigate to target day's schedule
    console.log(`Navigating to day ${dayOfWeek} schedule...`)
    const navigationResult = await navigateToDay(page, dayOfWeek, timezone, classTime)
    if (!navigationResult.success) {
      screenshotPath = await takeScreenshot(page, '05-navigation-failed')
      return {
        status: 'failed',
        branchUsed: branchResult.selectedBranch || null,
        errorMessage: `Navigation failed: ${navigationResult.error}`,
        screenshotPath,
      }
    }

    screenshotPath = await takeScreenshot(page, '05-schedule-page')

    // Step 4: Find and book class
    console.log(`Finding class: ${classType} at ${classTime}...`)

    // Call booking function once - fast retry loop inside handles all retry logic
    const branchToUse = branchResult.selectedBranch || branch
    const bookingResult = await findAndBookClass(
      page,
      classType,
      classTime,
      branchToUse,
      dayOfWeek,
      timezone
    )

    screenshotPath = await takeScreenshot(page, '06-after-booking-attempt')

    // Ensure we have a booking result (should always be set)
    if (!bookingResult) {
      return {
        status: 'failed',
        branchUsed: branchResult.selectedBranch || null,
        errorMessage: 'Booking attempt failed - no result returned',
        screenshotPath,
      }
    }

    return {
      status: bookingResult.status,
      branchUsed: (bookingResult.selectedBranch || null) as string | null,
      errorMessage: (bookingResult.errorMessage || null) as string | null,
      screenshotPath,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Booking error:', errorMessage)

    return {
      status: 'failed',
      branchUsed: null,
      errorMessage: `Something unexpected went wrong: ${errorMessage}\n\nThis might be a one-time glitch. The system will try again at the next scheduled time.\n\nIf this happens repeatedly (3+ times), please check the error details in booking history and report the issue with screenshots.`,
      screenshotPath,
    }
  }
  // Note: Browser cleanup is handled by the main bookClass() function
  // This function only operates on a page passed to it
}

/**
 * Perform login on the gym website (two-step process)
 * Step 1: Enter email/phone and click SUBMIT
 * Step 2: Enter password and click LOGIN
 */
async function performLogin(
  page: Page,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Enter email/phone and submit
    console.log('Step 1: Entering email/phone...')
    await page.waitForSelector('input[name="user_name"], input[id="user_name"]', {
      timeout: 10000,
    })

    // Find username/email field
    const usernameField = await page.$('input[name="user_name"], input[id="user_name"]')
    if (!usernameField) {
      return { success: false, error: 'Could not find username/email field' }
    }

    console.log('Found username field, typing email...')
    await usernameField.type(username, { delay: 50 })

    // Find and click SUBMIT button
    console.log('Looking for SUBMIT button...')
    const submitButtonSelectors = [
      'button:has-text("SUBMIT")',
      'button:has-text("Submit")',
      'input[type="submit"]',
      'button[type="submit"]',
      'button',
      'input[value*="SUBMIT" i]',
      'input[value*="Submit" i]',
    ]

    let submitButton = null
    for (const selector of submitButtonSelectors) {
      try {
        const buttons = await page.$$(selector)
        for (const btn of buttons) {
          const buttonText = await page.evaluate((el) => (el as HTMLElement).textContent?.toUpperCase() || '', btn)
          const buttonValue = await page.evaluate((el) => (el as HTMLInputElement).value?.toUpperCase() || '', btn)
          if (buttonText.includes('SUBMIT') || buttonValue.includes('SUBMIT')) {
            submitButton = btn
            console.log(`Found SUBMIT button with selector: ${selector}`)
            break
          }
        }
        if (submitButton) break
      } catch {
        continue
      }
    }

    if (!submitButton) {
      return { success: false, error: 'Could not find SUBMIT button' }
    }

    await submitButton.click()
    console.log('Clicked SUBMIT button, waiting for password page...')

    // Wait for navigation to password page
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })

    // Step 2: Enter password and login
    console.log('Step 2: Entering password...')
    await page.waitForSelector('input[type="password"]', {
      timeout: 10000,
    })

    // Find password field
    const passwordField = await page.$('input[type="password"]')
    if (!passwordField) {
      // Try alternative selectors
      const passwordSelectors = [
        'input[name="password"]',
        'input[id*="password"]',
        'input[id*="pass"]',
        '#password',
        '#pass',
      ]

      let foundPasswordField = null
      for (const selector of passwordSelectors) {
        try {
          foundPasswordField = await page.$(selector)
          if (foundPasswordField) {
            console.log(`Found password field with selector: ${selector}`)
            break
          }
        } catch {
          continue
        }
      }

      if (!foundPasswordField) {
        return { success: false, error: 'Could not find password field on password page' }
      }

      await foundPasswordField.type(password, { delay: 50 })
    } else {
      await passwordField.type(password, { delay: 50 })
    }

    // Check "Keep me logged in" checkbox if it exists
    console.log('Checking for "Keep me logged in" checkbox...')
    const keepLoggedInSelectors = [
      'input[type="checkbox"][id*="remember"]',
      'input[type="checkbox"][name*="remember"]',
      'input[type="checkbox"][id*="keep"]',
      'input[type="checkbox"][name*="keep"]',
      'input[type="checkbox"]',
    ]

    for (const selector of keepLoggedInSelectors) {
      try {
        const checkbox = await page.$(selector)
        if (checkbox) {
          const label = await page.evaluate((el) => {
            const parent = el.parentElement
            return parent?.textContent?.toLowerCase() || ''
          }, checkbox)
          
          if (label.includes('keep') || label.includes('remember') || label.includes('logged')) {
            const isChecked = await page.evaluate((el) => (el as HTMLInputElement).checked, checkbox)
            if (!isChecked) {
              await checkbox.click()
              console.log('Checked "Keep me logged in" checkbox')
            }
            break
          }
        }
      } catch {
        continue
      }
    }

    // Find and click LOGIN button
    console.log('Looking for LOGIN button...')
    const loginButtonSelectors = [
      'button:has-text("LOGIN")',
      'button:has-text("Login")',
      'input[type="submit"]',
      'button[type="submit"]',
      'button',
      'input[value*="LOGIN" i]',
      'input[value*="Login" i]',
    ]

    let loginButton = null
    for (const selector of loginButtonSelectors) {
      try {
        const buttons = await page.$$(selector)
        for (const btn of buttons) {
          const buttonText = await page.evaluate((el) => (el as HTMLElement).textContent?.toUpperCase() || '', btn)
          const buttonValue = await page.evaluate((el) => (el as HTMLInputElement).value?.toUpperCase() || '', btn)
          if (buttonText.includes('LOGIN') || buttonValue.includes('LOGIN')) {
            loginButton = btn
            console.log(`Found LOGIN button with selector: ${selector}`)
            break
          }
        }
        if (loginButton) break
      } catch {
        continue
      }
    }

    if (!loginButton) {
      return { success: false, error: 'Could not find LOGIN button' }
    }

    await loginButton.click()
    console.log('Clicked LOGIN button, waiting for navigation...')

    // Wait for navigation after login (either success or error)
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })

    // Check if login was successful
    const currentUrl = page.url()
    const pageContent = (await page.content()).toLowerCase()

    // Check for error indicators
    if (
      pageContent.includes('invalid') ||
      pageContent.includes('incorrect') ||
      pageContent.includes('wrong password') ||
      pageContent.includes('authentication failed') ||
      (currentUrl.includes('login') && !currentUrl.includes('dashboard') && !currentUrl.includes('classschedule'))
    ) {
      return { success: false, error: 'Login credentials appear to be invalid or login failed' }
    }

    // If we're still on login page, it failed
    if (currentUrl.includes('login') && !currentUrl.includes('dashboard')) {
      return { success: false, error: 'Still on login page after login attempt' }
    }

    console.log('Login successful! Navigating to class schedule...')
    
    // Click "Group Ex" in header nav to get to class schedule
    const groupExSelectors = [
      'a:has-text("Group Ex")',
      'a:has-text("Group EX")',
      'a:has-text("group ex")',
      'a[href*="GroupEx"]',
      'a[href*="groupex"]',
      'nav a:has-text("Group")',
    ]

    let groupExLink = null
    for (const selector of groupExSelectors) {
      try {
        const links = await page.$$(selector)
        for (const link of links) {
          const linkText = await page.evaluate((el) => (el as HTMLElement).textContent?.toUpperCase() || '', link)
          if (linkText.includes('GROUP EX') || linkText.includes('GROUPEX')) {
            groupExLink = link
            console.log(`Found "Group Ex" link with selector: ${selector}`)
            break
          }
        }
        if (groupExLink) break
      } catch {
        continue
      }
    }

    if (groupExLink) {
      await groupExLink.click()
      console.log('Clicked "Group Ex" link, waiting for class schedule page...')
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
    } else {
      console.log('Could not find "Group Ex" link, trying to navigate directly to class schedule URL...')
      // Try navigating directly to the class schedule URL
      // The gymUrl should be the class schedule page
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login timeout or error',
    }
  }
}

/**
 * Select branch from dropdown or button list
 */
async function selectBranch(
  page: Page,
  targetBranch: string
): Promise<{
  success: boolean
  selectedBranch?: string
  error?: string
}> {
  try {
    console.log(`Looking for branch selector for: ${targetBranch}...`)
    
    // Wait a bit for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Try to find a select dropdown first
    const selectSelectors = [
      'select[name*="branch"]',
      'select[id*="branch"]',
      'select[name*="location"]',
      'select[id*="location"]',
      'select',
    ]

    let branchSelect = null
    let foundSelector = null
    for (const selector of selectSelectors) {
      try {
        branchSelect = await page.$(selector)
        if (branchSelect) {
          foundSelector = selector
          console.log(`Found select element with selector: ${selector}`)
          break
        }
      } catch {
        continue
      }
    }

    if (branchSelect && foundSelector) {
      // Handle select dropdown
      const options = await page.evaluate((select) => {
        const selectElement = select as HTMLSelectElement
        return Array.from(selectElement.options).map((opt) => ({
          value: opt.value,
          text: opt.text.trim(),
        }))
      }, branchSelect)

      console.log(`Found ${options.length} branch options in select`)

      // Find matching branch (case-insensitive, partial match)
      const matchingOption = options.find(
        (opt) =>
          opt.text.toLowerCase().includes(targetBranch.toLowerCase()) ||
          targetBranch.toLowerCase().includes(opt.text.toLowerCase())
      )

      if (!matchingOption) {
        return {
          success: false,
          error: `Branch "${targetBranch}" not found. Available: ${options.map((o) => o.text).join(', ')}`,
        }
      }

      // Select the branch using the selector we found
      console.log(`Selecting branch using selector: ${foundSelector}, value: ${matchingOption.value}`)
      await page.select(foundSelector, matchingOption.value)

      // Wait for page to update after branch selection
      await new Promise(resolve => setTimeout(resolve, 2000))

      return { success: true, selectedBranch: matchingOption.text }
    }

    // If no select found, try to find buttons/links for branches
    console.log('No select element found, looking for branch buttons/links...')
    
    // Try to find all clickable elements that might be branch selectors
    const allClickable = await page.$$('button, a, [role="button"], [onclick*="branch"], [onclick*="location"]')
    console.log(`Found ${allClickable.length} potential clickable elements`)

    // Look for elements containing branch names
    const branchTexts: Array<{ element: any; text: string }> = []
    for (const element of allClickable) {
      const text = await page.evaluate((el) => (el as HTMLElement).textContent?.trim() || '', element)
      if (text) {
        branchTexts.push({ element, text })
      }
    }

    // Find matching branch
    const matchingBranch = branchTexts.find(
      (bt) =>
        bt.text.toLowerCase().includes(targetBranch.toLowerCase()) ||
        targetBranch.toLowerCase().includes(bt.text.toLowerCase())
    )

    if (matchingBranch) {
      console.log(`Found branch button/link: ${matchingBranch.text}`)
      await matchingBranch.element.click()
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { success: true, selectedBranch: matchingBranch.text }
    }

    // If still not found, list all available branch options for debugging
    const availableBranches = branchTexts.map(bt => bt.text).filter(t => t.length > 0 && t.length < 50)
    if (availableBranches.length > 0) {
      return {
        success: false,
        error: `Branch "${targetBranch}" not found. Available options: ${availableBranches.join(', ')}`,
      }
    }

    return { success: false, error: 'Could not find branch selector or branch options on page' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Branch selection error',
    }
  }
}

/**
 * Calculate fuzzy string similarity (0-1 scale)
 * Uses Levenshtein distance to handle minor spelling differences
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  // Exact match
  if (s1 === s2) return 1.0
  
  // Substring match (very common case)
  if (s1.includes(s2) || s2.includes(s1)) return 0.95
  
  // Calculate Levenshtein distance
  const matrix: number[][] = []
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  const distance = matrix[s1.length][s2.length]
  const maxLength = Math.max(s1.length, s2.length)
  
  // Convert distance to similarity (0-1 scale)
  return 1 - (distance / maxLength)
}

/**
 * Check if two strings match with fuzzy logic
 * Returns true if similarity is above threshold (default 0.8 = 80% similar)
 */
function fuzzyMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
  const similarity = calculateSimilarity(str1, str2)
  return similarity >= threshold
}

/**
 * Navigate to the schedule for a specific day of week
 * Looks for date tabs like "Mon 10" and clicks the appropriate one
 * Uses gym's timezone for accurate date calculations
 */
async function navigateToDay(
  page: Page,
  dayOfWeek: number,
  timezone: string,
  classTime: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Calculate "today" in the gym's timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short', // Get day of week directly from formatter
    })

    const parts = formatter.formatToParts(now)
    const gymDate = {
      year: parseInt(parts.find(p => p.type === 'year')!.value),
      month: parseInt(parts.find(p => p.type === 'month')!.value),
      day: parseInt(parts.find(p => p.type === 'day')!.value),
      hour: parseInt(parts.find(p => p.type === 'hour')!.value),
      minute: parseInt(parts.find(p => p.type === 'minute')!.value),
    }

    // Get day of week directly from the timezone-aware formatter
    // This avoids the bug where new Date() constructor uses local timezone
    const weekdayPart = parts.find(p => p.type === 'weekday')?.value || ''
    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    const currentDayOfWeek = weekdayMap[weekdayPart] ?? 0 // 0 = Sunday, 6 = Saturday

    // Create a date object for calculating the target date
    // Note: This uses local timezone but we only use it for date arithmetic, not getDay()
    const todayInGymTz = new Date(gymDate.year, gymDate.month - 1, gymDate.day, gymDate.hour, gymDate.minute)
    
    let daysUntilTarget = dayOfWeek - currentDayOfWeek
    
    // Handle same-day classes: check if class time has passed
    if (daysUntilTarget === 0) {
      // Same day - check if class time has passed
      const [classHour, classMinute] = classTime.split(':').map(Number)
      const currentTimeMinutes = gymDate.hour * 60 + gymDate.minute
      const classTimeMinutes = classHour * 60 + classMinute
      
      if (currentTimeMinutes >= classTimeMinutes) {
        // Class time has passed today, look for next week
        daysUntilTarget = 7
        console.log(`Class time (${classTime}) has passed today, looking for next week's occurrence`)
      } else {
        // Class time hasn't passed, use today
        daysUntilTarget = 0
        console.log(`Class time (${classTime}) hasn't passed yet, using today`)
      }
    } else if (daysUntilTarget < 0) {
      // Past day this week, look for next week
      daysUntilTarget += 7
      console.log(`Target day is in the past this week, looking for next week's occurrence`)
    }

    // Calculate target date
    const targetDate = new Date(todayInGymTz)
    targetDate.setDate(todayInGymTz.getDate() + daysUntilTarget)
    const dayOfMonth = targetDate.getDate()
    
    console.log(`Today in ${timezone}: ${weekdayPart} ${gymDate.month}/${gymDate.day}/${gymDate.year}, Current day: ${currentDayOfWeek}`)
    console.log(`Target day: ${dayOfWeek}, Days until target: ${daysUntilTarget}`)
    console.log(`Target date: ${targetDate.toLocaleDateString('en-US', { timeZone: timezone })}`)

    // Day name abbreviations (Mon, Tue, Wed, etc.)
    const dayAbbrevs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const targetDayAbbrev = dayAbbrevs[dayOfWeek]

    // Look for date tab in format "Mon 10" or "Mon, 10" or similar
    console.log(`Looking for date tab: ${targetDayAbbrev} ${dayOfMonth}...`)
    
    // Try to find tabs/buttons with the date
    const allClickable = await page.$$('button, a, [role="tab"], [role="button"], .tab, [class*="tab"]')
    console.log(`Found ${allClickable.length} potential tab elements`)

    let dateTab = null
    for (const element of allClickable) {
      const text = await page.evaluate((el) => (el as HTMLElement).textContent?.trim() || '', element)
      // Check if text matches pattern like "Mon 10", "Mon, 10", "Mon10", etc.
      const normalizedText = text.replace(/[,\s]/g, '').toUpperCase()
      const targetPattern = `${targetDayAbbrev.toUpperCase()}${dayOfMonth}`
      
      if (normalizedText.includes(targetPattern) || text.includes(`${targetDayAbbrev} ${dayOfMonth}`)) {
        dateTab = element
        console.log(`Found date tab: "${text}"`)
        break
      }
    }

    if (dateTab) {
      await dateTab.click()
      console.log(`Clicked date tab, waiting for schedule to load...`)
      await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for schedule to load
    } else {
      console.log(`Could not find date tab for ${targetDayAbbrev} ${dayOfMonth}, will search all visible classes`)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Day navigation error',
    }
  }
}

/**
 * Attempt to click the booking button for a class
 * Returns success status
 */
async function attemptBookingButtonClick(
  page: Page,
  classType: string,
  targetTime12: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find and click the button - search for all buttons and match by parent row
    const allButtons = await page.$$('a.btn.btn-primary, a[role="button"], button.btn-primary, button[class*="btn"], a[class*="btn"]')

    for (const button of allButtons) {
      const buttonText = await page.evaluate((el) => (el as HTMLElement).textContent?.trim() || '', button)
      const buttonTextLower = buttonText.toLowerCase()

      // Check if this is a booking button
      if (buttonTextLower.includes('reserve') ||
          buttonTextLower.includes('book') ||
          buttonTextLower.includes('waitlist') ||
          buttonTextLower.includes('add to waitlist')) {

        // Extract row text for fuzzy matching in Node.js context
        // Try to find a suitable container (div.row, tr, or any ancestor with content)
        const rowText = await page.evaluate((el) => {
          let current: HTMLElement | null = el.parentElement
          let depth = 0
          let fallbackText = ''

          while (current && depth < 6) {
            const currentText = (current.textContent || '').toLowerCase()

            // Save first parent with substantial content as fallback
            if (!fallbackText && currentText.length > 20) {
              fallbackText = currentText
            }

            // Prefer specific containers: div.row, tr, or divs with class/schedule keywords
            if (
              (current.tagName === 'DIV' && current.className.includes('row')) ||
              current.tagName === 'TR' ||
              (current.tagName === 'DIV' && (current.className.includes('class') || current.className.includes('schedule') || current.className.includes('item')))
            ) {
              return currentText
            }

            current = current.parentElement
            depth++
          }

          // Return fallback text if we found any
          return fallbackText
        }, button)

        if (!rowText) {
          continue
        }

        // Check if row matches using fuzzy matching (handles typos like "Raquetball" vs "Racquetball")
        const rowWords = rowText.split(/\s+/)
        const classTypeLower = classType.toLowerCase()

        // Use same fuzzy matching logic as class finding
        const matchesClass =
          rowText.includes(classTypeLower) || // Exact match (fast path)
          fuzzyMatch(rowText, classType, 0.75) || // Fuzzy match on full text
          rowWords.some(word => fuzzyMatch(word, classType, 0.8)) || // Fuzzy match on individual words
          // Check word prefixes (handles concatenated words like "RacquetballAsheville")
          rowWords.some(word => {
            const minLength = Math.max(3, classTypeLower.length - 2)
            const maxLength = classTypeLower.length + 3
            for (let len = minLength; len <= maxLength && len <= word.length; len++) {
              const wordPrefix = word.substring(0, len)
              if (fuzzyMatch(wordPrefix, classType, 0.8)) {
                return true
              }
            }
            return false
          })

        const matchesTime =
          rowText.includes(targetTime12.toLowerCase()) ||
          rowText.includes(targetTime12.replace(' ', '').toLowerCase())

        if (matchesClass && matchesTime) {
          console.log(`Found booking button: "${buttonText}" (fuzzy matched class type)`)

          // Scroll button into view before clicking (important for dynamically loaded classes)
          await page.evaluate((el) => {
            (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, button)
          await new Promise(resolve => setTimeout(resolve, 500)) // Wait for scroll animation
          console.log('Scrolled button into view')

          try {
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
              button.click()
            ])
            console.log('Successfully navigated to class description page')
          } catch (navError) {
            console.log('Navigation timeout in helper, but continuing...')
          }
          return { success: true }
        }
      }
    }

    return { success: false, error: 'Could not find booking button' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Find and book a class matching the criteria
 * Handles "Load more results" button to search through all classes
 */
async function findAndBookClass(
  page: Page,
  classType: string,
  classTime: string,
  branchUsed: string,
  dayOfWeek: number,
  timezone: string
): Promise<{
  status: 'confirmed' | 'waitlisted' | 'failed'
  errorMessage?: string
  selectedBranch: string
}> {
  try {
    console.log(`\n🎯 Starting booking attempt for: ${classType} at ${classTime}`)
    console.log(`📍 Current page: ${page.url()}`)

    // Parse class time
    const [hours, minutes] = classTime.split(':').map(Number)
    const targetTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    // Also try 12-hour format (e.g., "4:15 PM")
    const hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const targetTime12 = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`


    // Function to search for class in currently loaded classes
    const searchForClass = async (): Promise<{
      found: boolean
      classElement?: any
      buttonElement?: any
      status?: 'reserved' | 'available' | 'full'
      debugInfo?: any
      windowNotOpenMessage?: string
    }> => {
      console.log(`📍 Searching on page: ${page.url()}`)

      // Get all class rows/cards from the page with more detailed structure
      const classes = await page.evaluate(() => {
        // Try to find the actual class list container first
        const possibleContainers = [
          'table tbody tr',
          '[class*="schedule"] [class*="item"]',
          '[class*="class"] [class*="item"]',
          '[class*="row"]',
          'tr',
          '[data-class-id]',
          '[data-schedule-id]',
        ]

        let allContainers: Element[] = []
        
        for (const selector of possibleContainers) {
          try {
            const found = document.querySelectorAll(selector)
            if (found.length > 0) {
              allContainers = Array.from(found)
              break
            }
          } catch (e) {
            continue
          }
        }

        // If no specific containers found, get all potential containers
        if (allContainers.length === 0) {
          allContainers = Array.from(document.querySelectorAll(
            'tr, .class-item, .schedule-item, [class*="class"], [class*="schedule"], [class*="row"], div[class*="card"]'
          ))
        }

        return Array.from(allContainers).map((container, index) => {
          const text = container.textContent || ''
          const innerHTML = container.innerHTML
          const buttons = Array.from(container.querySelectorAll('button, a, input[type="button"], [role="button"]'))
          const buttonTexts = buttons.map((btn) => (btn as HTMLElement).textContent?.trim() || '')
          const buttonIds = buttons.map((btn) => (btn as HTMLElement).id || '')
          const buttonClasses = buttons.map((btn) => (btn as HTMLElement).className || '')
          const buttonDisabledStates = buttons.map((btn) => {
            const element = btn as HTMLButtonElement
            return element.disabled ||
                   element.getAttribute('disabled') !== null ||
                   element.classList.contains('disabled')
          })
          const buttonTooltips = buttons.map((btn) => {
            return (btn as HTMLElement).getAttribute('title') ||
                   (btn as HTMLElement).getAttribute('data-tooltip') ||
                   (btn as HTMLElement).getAttribute('aria-label') ||
                   ''
          })

          // Extract time patterns from text
          const timePatterns = text.match(/\d{1,2}:\d{2}\s*(AM|PM)?/gi) || []

          // Extract class name patterns (look for common class name indicators)
          const classNameMatch = text.match(/([A-Z][A-Z\s]+(?:PUMP|YOGA|CYCLE|CARDIO|STRENGTH|CORE|FITNESS|TRAINING|DANCE|AQUA|SWIM|PILATES|BARRE|ZUMBA|KICKBOXING|BOXING|MARTIAL|ARTS|SPIN|RIDE|WALK|RUN|JOG|STRETCH|FLEX|BALANCE|MEDITATION|MINDFUL|STRESS|RELAX|RESTORE|RENEW|REVIVE|REVITALIZE|REJUVENATE|REFRESH|REBOOT|RESET|REVAMP|REVIVE|REVITALIZE|REJUVENATE|REFRESH|REBOOT|RESET|REVAMP)[A-Z\s]*)/i)

          return {
            index,
            tagName: container.tagName,
            className: container.className || '',
            id: (container as HTMLElement).id || '',
            html: container.outerHTML.substring(0, 1000),
            text: text.substring(0, 2000),
            innerHTML: innerHTML.substring(0, 1000),
            buttonTexts,
            buttonIds,
            buttonClasses,
            buttonDisabledStates,
            buttonTooltips,
            timePatterns,
            classNameMatch: classNameMatch ? classNameMatch[0] : null,
          }
        })
      })

      // Save debug info to file for inspection
      const debugDir = path.join(process.cwd(), 'debug')
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true })
      }
      
      // Save debug files only in development
      if (!IS_PRODUCTION) {
        const debugFile = path.join(debugDir, `class-list-debug-${Date.now()}.json`)
        fs.writeFileSync(debugFile, JSON.stringify({
          searchFor: {
            classType,
            classTime,
            targetTime,
            targetTime12,
          },
          foundClasses: classes,
          totalClasses: classes.length,
        }, null, 2))
        console.log(`💾 Saved class list debug info to: ${debugFile}`)

        // Also save a sample of the HTML
        const htmlSample = await page.evaluate(() => {
          // Try to find the main schedule container
          const scheduleContainer = document.querySelector('[class*="schedule"], [id*="schedule"], table, [class*="class-list"]') || document.body
          return scheduleContainer.outerHTML.substring(0, 50000) // First 50KB
        })
        const htmlFile = path.join(debugDir, `page-html-sample-${Date.now()}.html`)
        fs.writeFileSync(htmlFile, htmlSample)
        console.log(`💾 Saved HTML sample to: ${htmlFile}`)

        // Log summary of found classes
        console.log(`\n📋 Found ${classes.length} potential class containers`)
        if (classes.length > 0) {
          console.log('Sample classes found:')
          classes.slice(0, 5).forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.tagName}${c.className ? '.' + c.className.split(' ')[0] : ''}${c.id ? '#' + c.id : ''}`)
            console.log(`     Text preview: ${c.text.substring(0, 100).replace(/\n/g, ' ')}...`)
            if (c.timePatterns.length > 0) {
              console.log(`     Times found: ${c.timePatterns.join(', ')}`)
            }
            if (c.classNameMatch) {
              console.log(`     Class name match: ${c.classNameMatch}`)
            }
          })
        }
      }

      // Find class matching type and time
      for (const classItem of classes) {
        const classText = classItem.text.toLowerCase()

        // Use fuzzy matching for class type to handle minor spelling differences
        // Extract potential class names from the text
        const words = classText.split(/\s+/)
        const classTypeLower = classType.toLowerCase()
        const matchesType =
          classText.includes(classTypeLower) || // Exact substring match (fast path)
          fuzzyMatch(classText, classType, 0.75) ||       // Fuzzy match on full text (lower threshold)
          words.some(word => fuzzyMatch(word, classType, 0.8)) || // Fuzzy match on individual words
          (classItem.classNameMatch && fuzzyMatch(classItem.classNameMatch, classType, 0.8)) || // Fuzzy match on extracted class name
          // Check if any word STARTS with a fuzzy match (handles concatenated words like "RacquetballAsheville")
          words.some(word => {
            // For each word, check if the beginning of the word fuzzy matches the class type
            // This handles cases where class names are concatenated with other text without spaces
            // Check multiple prefix lengths to account for spelling differences (e.g., "Raquetball" vs "Racquetball")
            const minLength = Math.max(3, classTypeLower.length - 2) // Allow 2 chars shorter
            const maxLength = classTypeLower.length + 3 // Allow up to 3 chars longer

            for (let len = minLength; len <= maxLength && len <= word.length; len++) {
              const wordPrefix = word.substring(0, len)
              if (fuzzyMatch(wordPrefix, classType, 0.8)) {
                return true
              }
            }
            return false
          })
        
        // Try multiple time formats - check both text content and time patterns
        // The time format on the page is typically "4:15 PM - 5:15 PM" (start - end)
        // We need to match the start time
        const matchesTime = 
          classText.includes(targetTime) ||
          classText.includes(classTime) ||
          classText.includes(targetTime12.toLowerCase()) ||
          classText.includes(targetTime12.replace(' ', '').toLowerCase()) ||
          // Match start time from time patterns (first time in the array is usually start time)
          (classItem.timePatterns.length > 0 && classItem.timePatterns.some(tp => {
            const tpLower = tp.toLowerCase().trim()
            // Match exact time or time with AM/PM
            return tpLower === targetTime || 
                   tpLower === targetTime12.toLowerCase() ||
                   tpLower === targetTime12.replace(' ', '').toLowerCase() ||
                   // Also check if the time pattern starts with our target time
                   tpLower.startsWith(targetTime12.toLowerCase()) ||
                   tpLower.startsWith(targetTime12.replace(' ', '').toLowerCase())
          })) ||
          // Match time range format like "4:15 PM - 5:15 PM" by normalizing and checking includes
          // SECURITY: Using string matching instead of dynamic RegExp to prevent ReDoS
          (() => {
            const normalizedClassText = classText.toLowerCase().replace(/[:\s]/g, '')
            const normalizedTime = targetTime12.toLowerCase().replace(/[:\s]/g, '')
            return normalizedClassText.includes(normalizedTime)
          })()

        if (matchesType && matchesTime) {
          console.log(`✅ Found matching class!`)
          console.log(`   Type match: ${matchesType}`)
          console.log(`   Time match: ${matchesTime}`)
          console.log(`   Text: ${classItem.text.substring(0, 200)}`)
          console.log(`   Time patterns found: ${classItem.timePatterns.join(', ')}`)
          
          // Check status - look for reserved, full, waitlist indicators
          // IMPORTANT: Check for "Class Full" indicator FIRST before checking buttons

          // Check if already reserved
          const isReserved =
            classText.includes('reserved') ||
            classItem.buttonTexts.some((btn) => btn.toUpperCase().includes('RESERVED'))

          // Enhanced status detection with multiple variations (case-insensitive)
          const classTextLower = classText.toLowerCase()
          const htmlLower = classItem.html.toLowerCase()

          // Check for "Class Full" indicators:
          // - "Full", "Class Full", "FULL"
          // - "Spots Full", "No Spots Available", "No Spots"
          // - Pill/badge elements with "full" text
          const isFull =
            classTextLower.includes('full') ||
            classTextLower.includes('class full') ||
            classTextLower.includes('spots full') ||
            classTextLower.includes('no spots available') ||
            classTextLower.includes('no spots') ||
            // Check HTML for pill/badge elements with "full" text
            (htmlLower.includes('class="pill') && htmlLower.includes('full')) ||
            (htmlLower.includes('class="badge') && htmlLower.includes('full')) ||
            // Check for status indicators
            (htmlLower.includes('status') && htmlLower.includes('full'))

          // Check for "Cancelled" class (permanent failure - don't retry)
          const isCancelled =
            classTextLower.includes('cancelled') ||
            classTextLower.includes('class cancelled') ||
            // Check HTML for pill/badge elements with "cancel" text
            (htmlLower.includes('class="pill') && htmlLower.includes('cancel')) ||
            (htmlLower.includes('class="badge') && htmlLower.includes('cancel'))

          // Check for "Not Reservable" class (permanent failure - don't retry)
          const isNotReservable =
            classTextLower.includes('not reservable') ||
            // Check HTML for pill/badge elements with "not reservable" text
            (htmlLower.includes('class="pill') && htmlLower.includes('not reservable')) ||
            (htmlLower.includes('class="badge') && htmlLower.includes('not reservable'))

          // Check for booking buttons (RESERVE, BOOK, WAITLIST)
          // Check independently of isFull (buttons may exist even when full)
          const hasBookingButton = (
            classItem.buttonTexts.some((btn) => {
              const btnUpper = btn.toUpperCase()
              return btnUpper.includes('RESERVE') ||
                     btnUpper.includes('BOOK') ||
                     btnUpper.includes('WAITLIST') ||
                     btnUpper.includes('ADD TO WAITLIST')
            }) ||
            classItem.buttonClasses.some((btnClass) => {
              // btn-primary class typically indicates a booking button
              return btnClass.includes('btn-primary')
            }) ||
            // Also check HTML for button patterns (in case button text wasn't captured)
            (classItem.html.toLowerCase().includes('btn-primary') &&
             (classItem.html.toLowerCase().includes('reserve') ||
              classItem.html.toLowerCase().includes('book') ||
              classItem.html.toLowerCase().includes('waitlist')))
          )

          // Check if booking button is disabled (indicates booking window not open yet)
          const hasDisabledBookingButton = hasBookingButton && classItem.buttonTexts.some((btn, index) => {
            const btnUpper = btn.toUpperCase()
            const isBookingButton = btnUpper.includes('RESERVE') ||
                                   btnUpper.includes('BOOK') ||
                                   btnUpper.includes('WAITLIST') ||
                                   btnUpper.includes('ADD TO WAITLIST')
            return isBookingButton && classItem.buttonDisabledStates[index]
          })

          // Check for booking window tooltip (e.g., "Reservation starts at...")
          const hasBookingWindowTooltip = hasDisabledBookingButton && classItem.buttonTooltips.some((tooltip) => {
            const tooltipLower = tooltip.toLowerCase()
            return tooltipLower.includes('reservation starts') ||
                   tooltipLower.includes('booking opens') ||
                   tooltipLower.includes('reservations open')
          })

          // Determine status with improved logic
          // Priority order: reserved > cancelled > not reservable > booking window not open > full > available
          let status: 'reserved' | 'available' | 'full'
          let windowNotOpenMessage: string | undefined

          if (isReserved) {
            status = 'reserved'
          } else if (hasDisabledBookingButton) {
            // Booking button exists but is disabled = window not open yet
            console.log(`   ⏰ RESERVE button is DISABLED - booking window not open yet`)
            status = 'full' // Return 'full' to trigger retry logic (not permanent failure)

            // Extract tooltip message if available
            const tooltipMessage = classItem.buttonTooltips.find((tooltip) => {
              const tooltipLower = tooltip.toLowerCase()
              return tooltipLower.includes('reservation starts') ||
                     tooltipLower.includes('booking opens') ||
                     tooltipLower.includes('reservations open')
            })

            if (tooltipMessage) {
              windowNotOpenMessage = `Booking window not yet open: ${tooltipMessage}`
            } else {
              windowNotOpenMessage = 'Booking window not yet open - RESERVE button is disabled'
            }
          } else if (isCancelled || isNotReservable) {
            // Cancelled or Not Reservable = permanent failure (don't retry)
            status = 'full'
            if (isCancelled) {
              console.log(`   ⚠️  Class is CANCELLED - booking not possible`)
            }
            if (isNotReservable) {
              console.log(`   ⚠️  Class is NOT RESERVABLE - booking not possible`)
            }
          } else if (isFull && !hasBookingButton) {
            // Class is full and no booking button = truly full
            status = 'full'
          } else if (isFull && hasBookingButton) {
            // Class appears full but has booking button = likely waitlist available
            // Let the booking attempt proceed to handle waitlist
            console.log(`   ⚠️  Class appears FULL but has booking button - may be waitlist available`)
            status = 'available'
          } else if (hasBookingButton) {
            // Has booking button and not marked as full = available
            status = 'available'
          } else {
            // No booking button and not explicitly marked as full = assume full
            status = 'full'
          }

          console.log(`   Status check: isReserved=${isReserved}, isFull=${isFull}, isCancelled=${isCancelled}, isNotReservable=${isNotReservable}, hasBookingButton=${hasBookingButton}, hasDisabledBookingButton=${hasDisabledBookingButton}`)
          console.log(`   Determined status: ${status}`)
          console.log(`   Button texts: ${classItem.buttonTexts.join(', ')}`)
          if (windowNotOpenMessage) {
            console.log(`   Window message: ${windowNotOpenMessage}`)
          }

          return {
            found: true,
            status,
            debugInfo: classItem,
            windowNotOpenMessage,
          }
        }
      }

      // If not found, log what we were looking for vs what we found
      console.log(`\n❌ Class not found in current results`)
      console.log(`   Looking for: "${classType}" at ${targetTime} (${targetTime12})`)
      console.log(`   Searched ${classes.length} containers`)
      
      // Show classes that partially match
      const typeMatches = classes.filter(c => c.text.toLowerCase().includes(classType.toLowerCase()))
      const timeMatches = classes.filter(c => 
        c.text.includes(targetTime) || 
        c.text.includes(targetTime12) ||
        c.timePatterns.some(tp => tp.includes(targetTime) || tp.includes(targetTime12))
      )
      
      if (typeMatches.length > 0) {
        console.log(`   Found ${typeMatches.length} containers with matching class type:`)
        typeMatches.slice(0, 3).forEach(c => {
          console.log(`     - ${c.text.substring(0, 150).replace(/\n/g, ' ')}`)
        })
      }
      
      if (timeMatches.length > 0) {
        console.log(`   Found ${timeMatches.length} containers with matching time:`)
        timeMatches.slice(0, 3).forEach(c => {
          console.log(`     - ${c.text.substring(0, 150).replace(/\n/g, ' ')}`)
        })
      }

      return { found: false, debugInfo: { classes, typeMatches, timeMatches } }
    }

    // First, search in currently loaded classes
    console.log('Searching for class in loaded results...')
    let searchResult = await searchForClass()

    // If not found, click "Load more results" repeatedly until found or button disappears
    if (!searchResult.found) {
      console.log('Class not found in initial results, looking for "Load more results" button...')
      let loadMoreAttempts = 0
      const maxLoadMoreAttempts = 20 // Safety limit

      while (loadMoreAttempts < maxLoadMoreAttempts) {
        // Find "Load more results" button - try ID first (YMCA Daxko specific)
        let loadMoreButton = null
        
        // Try ID selector first (most reliable)
        try {
          loadMoreButton = await page.$('#load-more')
          if (loadMoreButton) {
            console.log('Found "Load more results" button by ID (#load-more)')
          }
        } catch {
          // Continue to other selectors
        }

        // If not found by ID, try other selectors
        if (!loadMoreButton) {
          const loadMoreSelectors = [
            'button[id="load-more"]',
            'button:has-text("Load more results")',
            'button:has-text("LOAD MORE RESULTS")',
            'button:has-text("Load More")',
            'button:has-text("load more")',
            'a:has-text("Load more")',
            'button[aria-label*="load more" i]',
            'button[class*="load-more" i]',
          ]

          for (const selector of loadMoreSelectors) {
            try {
              const buttons = await page.$$(selector)
              for (const btn of buttons) {
                const buttonText = await page.evaluate((el) => (el as HTMLElement).textContent?.trim() || '', btn)
                const buttonId = await page.evaluate((el) => (el as HTMLElement).id || '', btn)
                if (buttonText.toLowerCase().includes('load more') || buttonId === 'load-more') {
                  loadMoreButton = btn
                  console.log(`Found "Load more results" button: "${buttonText}" (id: ${buttonId})`)
                  break
                }
              }
              if (loadMoreButton) break
            } catch {
              continue
            }
          }
        }

        if (!loadMoreButton) {
          console.log('No "Load more results" button found - reached end of list')
          break
        }

        console.log(`Clicking "Load more results" (attempt ${loadMoreAttempts + 1})...`)
        await loadMoreButton.click()
        await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for new results to load

        // Search again
        searchResult = await searchForClass()
        if (searchResult.found) {
          console.log('Class found after loading more results!')
          break
        }

        loadMoreAttempts++
      }
    }

    // Check search result
    if (!searchResult.found) {
      return {
        status: 'failed',
        errorMessage: `Class "${classType}" at ${targetTime} not found on schedule.\n\nWhy this happens:\n• Class name doesn't match exactly (check for typos)\n• Wrong time, day, or branch selected\n• Gym no longer offers this class\n\nWhat to do:\n1. Go to your gym's website and find the exact class listing\n2. Update your class settings to match EXACTLY\n3. Check the screenshot in booking history to see what classes were found`,
        selectedBranch: branchUsed,
      }
    }

    // Handle different statuses
    if (searchResult.status === 'reserved') {
      return {
        status: 'confirmed',
        errorMessage: '✅ Great news! This class is already booked. Nothing to do - you\'re all set!',
        selectedBranch: branchUsed,
      }
    }

    if (searchResult.status === 'full') {
      // Check if booking window hasn't opened yet (disabled button)
      // Fast retry loop: 9 attempts × 5s = 45s to catch window opening
      // Optimized timing: Check immediately, then wait only if still disabled
      if (searchResult.windowNotOpenMessage) {
        console.log(`⏰ Booking window not open yet - starting fast retry loop`)
        console.log(`   ${searchResult.windowNotOpenMessage}`)

        const maxQuickRetries = 9
        const quickRetryDelay = 5000 // 5 seconds

        for (let retry = 0; retry < maxQuickRetries; retry++) {
          console.log(`🔄 Refreshing page and re-checking booking window (attempt ${retry + 1}/${maxQuickRetries})...`)
          console.log(`📍 Current page: ${page.url()}`)
          await page.reload({ waitUntil: 'networkidle2' })

          // Re-navigate to the correct day (page reload resets to default day)
          console.log(`📅 Re-navigating to day ${dayOfWeek} after reload...`)
          const renavResult = await navigateToDay(page, dayOfWeek, timezone, classTime)
          if (!renavResult.success) {
            console.log(`⚠️  Failed to navigate to correct day after reload: ${renavResult.error}`)
            // Continue anyway - class might still be found
          } else {
            console.log(`✅ Successfully navigated to day ${dayOfWeek}`)
          }

          // Wait for schedule to load - ensure class containers appear
          try {
            await page.waitForSelector('tr, .class-item, .schedule-item, [class*="class"]', {
              visible: true,
              timeout: 10000
            })
            console.log(`✅ Schedule reloaded successfully`)
          } catch (e) {
            console.log(`⚠️  Schedule did not fully load after page reload (timeout)`)
          }

          // Re-search for class to check if button is now enabled
          searchResult = await searchForClass()

          if (!searchResult.found) {
            console.log(`⚠️  Class not found after reload - may have been removed`)
            break
          }

          if (searchResult.status === 'available') {
            console.log(`✅ Booking window opened! Proceeding with booking...`)
            // Break out of retry loop and continue with normal booking flow below
            break
          }

          if (searchResult.status === 'reserved') {
            console.log(`✅ Class already reserved (booked by someone else or another process)`)
            return {
              status: 'confirmed',
              errorMessage: '✅ Great news! This class is already booked. Nothing to do - you\'re all set!',
              selectedBranch: branchUsed,
            }
          }

          // Still disabled - wait before next retry (unless this is the last attempt)
          if (retry < maxQuickRetries - 1) {
            if (searchResult.windowNotOpenMessage) {
              console.log(`   ⏰ Still disabled: ${searchResult.windowNotOpenMessage}`)
            }
            console.log(`   ⏰ Waiting 5s before next attempt...`)
            await new Promise(resolve => setTimeout(resolve, quickRetryDelay))
          } else {
            // Last attempt failed
            console.log(`⏰ Booking window did not open after ${maxQuickRetries} retries`)
            return {
              status: 'failed',
              errorMessage: `Booking window not yet open. We tried ${maxQuickRetries} times over ${maxQuickRetries * 5} seconds to catch the window.\n\n${searchResult.windowNotOpenMessage}\n\nIf this keeps happening, the booking window time may be set incorrectly. Check your class settings and verify the "booking window" time (e.g., "26 hours before class").`,
              selectedBranch: branchUsed,
            }
          }
        }

        // If we broke out of the loop because class not found after reload
        if (!searchResult.found) {
          return {
            status: 'failed',
            errorMessage: `Class disappeared from schedule after page reload. This usually means the gym cancelled or removed the class.\n\nWhat to do: Check your gym's website to verify the class status. If cancelled, remove it from your schedule.`,
            selectedBranch: branchUsed,
          }
        }

        // If we broke out of the loop because status became 'available', continue below
        // If status is still not 'available', return error
        if (searchResult.status !== 'available') {
          return {
            status: 'failed',
            errorMessage: `Booking window not yet open - ${searchResult.windowNotOpenMessage || 'RESERVE button still disabled after retries'}\n\nThe system tried ${maxQuickRetries} times but the booking window hasn't opened yet. This may mean the booking window time is configured incorrectly in your settings.`,
            selectedBranch: branchUsed,
          }
        }
      }

      // Check if it's a permanent failure (cancelled or not reservable)
      // These should NOT trigger retry logic (no "full" in error message)
      const debugText = searchResult.debugInfo?.text?.toLowerCase() || ''

      if (debugText.includes('cancelled')) {
        return {
          status: 'failed',
          errorMessage: 'This class has been cancelled by the gym and cannot be booked.\n\nWhy this happens: Instructor unavailable, low attendance, or schedule changes.\n\nWhat to do: Remove this class from your schedule (Dashboard → Schedule → Delete). Check your gym\'s website for the class status or alternative times.',
          selectedBranch: branchUsed,
        }
      }

      if (debugText.includes('not reservable')) {
        return {
          status: 'failed',
          errorMessage: 'This class cannot be reserved online.\n\nWhy this happens: May require special registration, restricted membership level, or in-person booking only.\n\nWhat to do: Contact your gym to ask about booking requirements. Remove from automated schedule if it can\'t be booked online.',
          selectedBranch: branchUsed,
        }
      }

      // Class is full (temporary) - this should trigger the 15-minute retry logic in Inngest
      // IMPORTANT: Error message MUST contain "full" to trigger retry logic
      return {
        status: 'failed',
        errorMessage: 'Class is currently full, but don\'t worry - we\'ve got you covered!\n\nWe\'ll automatically keep trying every 15 minutes until the class starts. If someone cancels, we\'ll grab that spot for you. No action needed - just sit back and relax!',
        selectedBranch: branchUsed,
      }
    }

    // Class found and available - now find and click the booking button
    console.log('Class found! Looking for booking button...')

    // DEFENSIVE CHECK: Re-check for "Class Full" indicators on the page before clicking
    // This catches cases where the class becomes full between initial detection and button click
    const pageContent = await page.content()
    const pageContentLower = pageContent.toLowerCase()
    const hasFullIndicatorOnPage =
      pageContentLower.includes('class full') ||
      pageContentLower.includes('spots full') ||
      pageContentLower.includes('no spots available') ||
      // Check for pill/badge with "full"
      (pageContentLower.includes('class="pill') && pageContentLower.includes('full')) ||
      (pageContentLower.includes('class="badge') && pageContentLower.includes('full'))

    if (hasFullIndicatorOnPage) {
      console.log('⚠️  DEFENSIVE CHECK: Detected "Class Full" indicator on page before clicking RESERVE button')
      console.log('   This may indicate the class is full. Proceeding with caution - may end up on waitlist.')
    }

    // Use the helper function to attempt booking
    const bookingResult = await attemptBookingButtonClick(page, classType, targetTime12)
    let clicked = bookingResult.success

    // Fallback: Get all buttons and find the one in the class row
    if (!clicked) {
      const allButtons = await page.$$('button, a[role="button"], a.btn, input[type="button"]')
      
      for (const button of allButtons) {
        const buttonText = await page.evaluate((el) => (el as HTMLElement).textContent?.trim() || '', button)
        const buttonClass = await page.evaluate((el) => (el as HTMLElement).className || '', button)
        const parentText = await page.evaluate(
          (el) => {
            // Get text from parent and all ancestors up to class container
            let text = ''
            let current: HTMLElement | null = el.parentElement
            let depth = 0
            while (current && depth < 6) {
              text += (current.textContent || '').toLowerCase()
              current = current.parentElement
              depth++
            }
            return text
          },
          button
        )
        
        const buttonTextLower = buttonText.toLowerCase()
        const isBookingButton =
          buttonTextLower.includes('reserve') ||
          buttonTextLower.includes('book') ||
          buttonTextLower.includes('waitlist') ||
          buttonTextLower.includes('add to waitlist') ||
          (buttonClass.includes('btn-primary') && (buttonTextLower.includes('reserve') || buttonTextLower === ''))

        // Check if this button is in the matching class row using fuzzy matching
        const parentWords = parentText.split(/\s+/)
        const classTypeLower = classType.toLowerCase()

        // Use same fuzzy matching logic as class finding
        const matchesClassType =
          parentText.includes(classTypeLower) || // Exact match (fast path)
          fuzzyMatch(parentText, classType, 0.75) || // Fuzzy match on full text
          parentWords.some(word => fuzzyMatch(word, classType, 0.8)) || // Fuzzy match on individual words
          // Check word prefixes (handles concatenated words like "RacquetballAsheville")
          parentWords.some(word => {
            const minLength = Math.max(3, classTypeLower.length - 2)
            const maxLength = classTypeLower.length + 3
            for (let len = minLength; len <= maxLength && len <= word.length; len++) {
              const wordPrefix = word.substring(0, len)
              if (fuzzyMatch(wordPrefix, classType, 0.8)) {
                return true
              }
            }
            return false
          })

        const matchesTime =
          parentText.includes(targetTime) ||
          parentText.includes(classTime) ||
          parentText.includes(targetTime12.toLowerCase()) ||
          parentText.includes(targetTime12.replace(' ', '').toLowerCase())

        const matchesClass = matchesClassType && matchesTime

        if (isBookingButton && matchesClass) {
          console.log(`Found booking button: "${buttonText}" (class: ${buttonClass})`)
          
          // Check if button is disabled (indicates booking window not open)
          const isDisabled = await page.evaluate((el) => {
            return (el as HTMLButtonElement).disabled || 
                   (el as HTMLElement).getAttribute('disabled') !== null ||
                   (el as HTMLElement).classList.contains('disabled')
          }, button)
          
          // Check for tooltip indicating booking window not open
          const buttonTooltip = await page.evaluate((el) => {
            return (el as HTMLElement).getAttribute('title') || 
                   (el as HTMLElement).getAttribute('data-tooltip') ||
                   (el as HTMLElement).getAttribute('aria-label') || ''
          }, button)
          
          const tooltipLower = buttonTooltip.toLowerCase()
          const hasBookingWindowTooltip = 
            tooltipLower.includes('reservation starts at') ||
            tooltipLower.includes('reservations open') ||
            tooltipLower.includes('booking opens')
          
          if (isDisabled || hasBookingWindowTooltip) {
            console.log(`⚠️  Booking window is NOT yet open for this class`)
            if (isDisabled) {
              console.log(`   Button is disabled`)
            }
            if (hasBookingWindowTooltip) {
              console.log(`   Tooltip: "${buttonTooltip}"`)
            }
            // Set clicked to false and break - we'll handle the error after the loop
            clicked = false
            break
          }

          // Scroll button into view before clicking (important for dynamically loaded classes)
          await page.evaluate((el) => {
            (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, button)
          await new Promise(resolve => setTimeout(resolve, 500)) // Wait for scroll animation
          console.log('Scrolled button into view')

          // Click button and wait for navigation to class description page
          try {
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
              button.click()
            ])
            console.log('Successfully navigated to class description page')
          } catch (navError) {
            console.log('Navigation timeout, but continuing to check if page loaded...')
          }
          clicked = true
          break
        }
      }
    }

    if (!clicked) {
      // Check if we failed due to booking window or just couldn't find button
      const pageContent = await page.content()
      const pageContentLower = pageContent.toLowerCase()
      const hasBookingWindowText =
        pageContentLower.includes('reservation starts at') ||
        pageContentLower.includes('reservations open') ||
        pageContentLower.includes('booking opens')

      if (hasBookingWindowText) {
        return {
          status: 'failed',
          errorMessage: 'Booking window not yet open - class reservation starts at a future time',
          selectedBranch: branchUsed,
        }
      }

      return {
        status: 'failed',
        errorMessage: 'Found your class but couldn\'t click the booking button.\n\nWhy this happens: Website layout changed, button has different ID, or network slowness.\n\nWhat to do: Try manually booking to verify button exists. Check screenshot in booking history. If this persists, report the issue.',
        selectedBranch: branchUsed,
      }
    }

    // STEP 2: Handle class description page (two-step booking process)
    console.log('Checking class description page...')

    // Verify we're on class description page and take screenshot
    const descriptionUrl = page.url()
    console.log(`Current URL after first click: ${descriptionUrl}`)
    await takeScreenshot(page, '05a-class-description-page')

    // STEP 3: Select checkbox for user in "Active Members" section
    console.log('Looking for user checkbox in "Active Members" section...')
    
    const checkboxSelectors = [
      'input[type="checkbox"]',
      'input[type="checkbox"][name*="member"]',
      'input[type="checkbox"][value*="member"]',
    ]

    let userCheckbox = null

    for (const selector of checkboxSelectors) {
      try {
        const checkboxes = await page.$$(selector)
        for (const checkbox of checkboxes) {
          // Check if this checkbox is unchecked (it should be for user selection)
          const isChecked = await page.evaluate((el) => (el as HTMLInputElement).checked, checkbox)
          
          if (!isChecked) {
            // This is likely our user's checkbox
            userCheckbox = checkbox
            break
          }
        }
        if (userCheckbox) break
      } catch (e) {
        continue
      }
    }

    if (!userCheckbox) {
      console.log('Warning: Could not find user checkbox, may already be selected or page structure different')
      // Don't fail here - might already be selected or not needed in some cases
    } else {
      console.log('Found user checkbox, clicking to select member...')
      await userCheckbox.click()
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for selection to register
      console.log('User checkbox selected')
    }

    // STEP 4: Check if class is full (user will be added to waitlist)
    // Note: YMCA shows "Active Members (Accepting Spot in WaitList)" when full
    // The button still says "RESERVE" even when joining waitlist!
    const descriptionContent = await page.content()
    const descriptionContentLower = descriptionContent.toLowerCase()
    
    const isFullWaitlist = 
      descriptionContentLower.includes('accepting spot in waitlist') ||
      descriptionContentLower.includes('reservation spots are full') ||
      descriptionContentLower.includes('any one active member can join waitlist')
    
    if (isFullWaitlist) {
      console.log('⚠️  Class is FULL - user will be added to WAITLIST')
    } else {
      console.log('✓ Class has available spots - user will be BOOKED')
    }

    // STEP 5: Find RESERVE button on description page
    // Note: Button text is ALWAYS "RESERVE" regardless of booking vs waitlist
    console.log('Looking for RESERVE button on class description page...')

    const secondButtonSelectors = [
      'button:has-text("RESERVE")',
      'button:has-text("Reserve")',  
      'a:has-text("RESERVE")',
      'a.btn:has-text("RESERVE")',
      'input[type="submit"][value="RESERVE"]',
      'input[type="button"][value="RESERVE"]',
    ]

    let secondButton = null

    // Try standard selectors first
    for (const selector of secondButtonSelectors) {
      try {
        const buttons = await page.$$(selector)
        for (const btn of buttons) {
          const btnText = await page.evaluate((el) => (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value?.trim() || '', btn)
          console.log(`Found button on description page: "${btnText}"`)
          
          if (btnText && btnText.toUpperCase().includes('RESERVE')) {
            secondButton = btn
            break
          }
        }
        if (secondButton) break
      } catch (e) {
        continue
      }
    }

    // Fallback: search all buttons/links on page
    if (!secondButton) {
      console.log('Trying fallback button search...')
      const allButtons = await page.$$('button, a, input[type="submit"], input[type="button"]')
      for (const btn of allButtons) {
        const btnText = await page.evaluate((el) => (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value?.trim() || '', btn)
        if (btnText && btnText.toUpperCase() === 'RESERVE') {
          secondButton = btn
          console.log(`Found via fallback: "${btnText}"`)
          break
        }
      }
    }

    if (!secondButton) {
      return {
        status: 'failed',
        errorMessage: 'No RESERVE button found on class description page.\n\nWhy this happens: Class may not allow online reservations, website changed, or wrong class selected.\n\nWhat to do: Try booking manually through gym website to verify. Check screenshot in booking history to see what page we landed on.',
        selectedBranch: branchUsed,
      }
    }

    // STEP 6: Click RESERVE button and wait for navigation to confirmation page
    console.log('Clicking RESERVE button on class description page...')
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        secondButton.click()
      ])
      console.log('Navigation to confirmation page complete')
    } catch (navError) {
      // If navigation times out, wait a bit and continue anyway (page might have loaded)
      console.log('Navigation wait timed out or failed, continuing anyway...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Take screenshot of confirmation
    await takeScreenshot(page, '06-final-confirmation')

    // STEP 8: Check confirmation page with actual YMCA Daxko keywords
    const finalUrl = page.url()
    const finalContent = (await page.content()).toLowerCase()

    console.log(`Final URL: ${finalUrl}`)
    console.log(`Checking for confirmation keywords...`)

    // Check for concurrent booking conflict (user already has a class at this time)
    // Message: "Reservation for [user name] could not be completed, as they already have an existing reservation during this time."
    const hasConcurrentConflict =
      finalContent.includes('already have an existing reservation during this time') ||
      finalContent.includes('already have a reservation during this time') ||
      (finalContent.includes('could not be completed') && finalContent.includes('existing reservation'))

    if (hasConcurrentConflict) {
      console.log('⚠️  Concurrent booking conflict detected - user already has a class at this time')
      return {
        status: 'failed',
        errorMessage: 'You already have another class booked at this time.\n\nWhat to do:\n1. Log into your gym account and find your existing reservation\n2. Cancel it if you prefer this class instead\n3. Or adjust your schedule to avoid the conflict (Dashboard → Schedule)\n\nGyms don\'t allow double-booking the same time slot.',
        selectedBranch: branchUsed,
      }
    }

    // Detect waitlist vs booking using ACTUAL YMCA confirmation page text
    // Waitlist: "Awesome! ... Now that you are in waitlist, you can..."
    // Booking: "Awesome! ... Now that reservation is complete, you can..."
    const isWaitlisted = 
      finalContent.includes('now that you are in waitlist') ||
      finalContent.includes('you are in waitlist') ||
      finalContent.includes('added to waitlist') ||
      finalContent.includes('joined the waitlist') ||
      finalContent.includes('on the waitlist')

    const isConfirmed = 
      finalContent.includes('now that reservation is complete') ||
      finalContent.includes('reservation is complete') ||
      (finalContent.includes('awesome!') && !isWaitlisted) ||
      finalUrl.includes('confirmation') ||
      finalUrl.includes('success')

    if (isWaitlisted) {
      console.log('✅ Successfully added to WAITLIST')
      return {
        status: 'waitlisted',
        selectedBranch: branchUsed,
      }
    }

    if (isConfirmed) {
      console.log('✅ Successfully BOOKED class')
      return {
        status: 'confirmed',
        selectedBranch: branchUsed,
      }
    }

    console.log('⚠️  Booking result unclear')
    return {
      status: 'failed',
      errorMessage: 'Booking result unclear after clicking RESERVE button.\n\nWhat to do RIGHT NOW:\n1. Check your gym account to see if the class was booked\n2. Check the screenshots in booking history to see what happened\n3. If booked: Great! You\'re all set (ignore this error)\n4. If not booked: Try booking manually or check the error in screenshots',
      selectedBranch: branchUsed,
    }
  } catch (error) {
    return {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Booking error',
      selectedBranch: branchUsed,
    }
  }
}

/**
 * Take a screenshot for debugging
 */
async function takeScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `screenshot-${name}-${timestamp}.png`
  const filepath = path.join(process.cwd(), 'screenshots', filename)

  // Ensure screenshots directory exists
  const screenshotsDir = path.join(process.cwd(), 'screenshots')
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true })
  }

  await page.screenshot({ path: filepath as `${string}.png`, fullPage: true })
  return filepath
}

