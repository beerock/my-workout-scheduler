/**
 * Puppeteer script to automate class bookings via YMCA/GroupExPro
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
    hourCycle: 'h23',
    weekday: 'short',
  })

  const parts = formatter.formatToParts(now)
  const gymDate = {
    year: parseInt(parts.find(p => p.type === 'year')!.value),
    month: parseInt(parts.find(p => p.type === 'month')!.value),
    day: parseInt(parts.find(p => p.type === 'day')!.value),
    hour: parseInt(parts.find(p => p.type === 'hour')!.value) % 24, // Safety: hour 24 → 0
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
 * Perform GroupExPro login
 *
 * GroupExPro handles auth directly (email + password on same form).
 * After successful login, redirects to the class details page where
 * the user can reserve a spot or join the waitlist.
 *
 * @param page Puppeteer page instance
 * @param registerUrl The GroupExPro registration URL to navigate to
 * @param username User's email address
 * @param password User's password
 * @returns Success with class details URL, or failure with error
 */
async function performGroupExProLogin(
  page: Page,
  registerUrl: string,
  username: string,
  password: string
): Promise<{ success: boolean; classDetailsUrl?: string; error?: string }> {
  try {
    // STEP 1: Validate and navigate to GroupExPro registration URL
    try {
      const parsed = new URL(registerUrl)
      if (parsed.hostname !== 'www.groupexpro.com' && parsed.hostname !== 'groupexpro.com') {
        return { success: false, error: `Registration URL is not on groupexpro.com: ${parsed.hostname}` }
      }
    } catch {
      return { success: false, error: `Invalid registration URL: ${registerUrl}` }
    }

    console.log(`🔐 Navigating to GroupExPro: ${registerUrl}`)
    await page.goto(registerUrl, { waitUntil: 'networkidle2' })
    await takeScreenshot(page, '03-groupexpro-login')

    // STEP 2: Enter credentials on GroupExPro login form
    console.log('📝 Entering credentials on GroupExPro login...')

    // Find email field
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 })
    const emailField = await page.$('input[type="text"], input[type="email"]')
    if (!emailField) {
      return { success: false, error: 'Could not find email field on GroupExPro login page' }
    }

    await emailField.type(username, { delay: 50 })
    console.log(`   Entered email: ${username}`)

    // Find password field
    const passwordField = await page.$('input[type="password"]')
    if (!passwordField) {
      return { success: false, error: 'Could not find password field on GroupExPro login page' }
    }

    await passwordField.type(password, { delay: 50 })
    console.log('   Entered password')

    // STEP 3: Click Login button
    const loginButton = await page.$('button[type="submit"], input[type="submit"], input[value="Login"]')
    if (!loginButton) {
      return { success: false, error: 'Could not find Login button on GroupExPro page' }
    }

    console.log('   Clicking Login...')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      loginButton.click(),
    ])

    // STEP 4: Verify we reached the class details page
    const finalUrl = page.url()
    console.log(`   Final URL: ${finalUrl}`)

    // Success: redirected to class details page
    if (finalUrl.includes('/gxp/reservations/start/index/')) {
      console.log('✅ Successfully logged in and reached class details page')
      await takeScreenshot(page, '04-class-details')
      return { success: true, classDetailsUrl: finalUrl }
    }

    // Still on login page - check for specific error messages
    const pageContent = (await page.content()).toLowerCase()

    if (pageContent.includes('incorrect login') || pageContent.includes('incorrect password') || pageContent.includes('field is required')) {
      // Clear password field before taking screenshot
      const pwField = await page.$('input[type="password"]')
      if (pwField) {
        await pwField.evaluate((el: HTMLInputElement) => { el.value = '' })
      }
      await takeScreenshot(page, '03-login-failed')
      return {
        success: false,
        error: 'Login failed: Email or password is incorrect.',
      }
    }

    // Generic login failure
    if (finalUrl.includes('/gxp/auth/login/')) {
      await takeScreenshot(page, '03-login-failed')
      return {
        success: false,
        error: 'Login failed: Still on login page after submitting credentials.',
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
 * Complete booking on GroupExPro class details page
 *
 * After login, GroupExPro shows a class details page with either:
 * - "Reserve a Spot" button (spots available, checkbox next to user name)
 * - "Join the Waitlist" button (0 spots available, no checkbox)
 *
 * @param page Puppeteer page on GroupExPro class details page
 * @param branchUsed Branch name for result reporting
 * @returns Booking result with status and any error message
 */
async function completeGroupExProBooking(
  page: Page,
  branchUsed: string
): Promise<{
  status: 'confirmed' | 'waitlisted' | 'failed'
  errorMessage?: string
  selectedBranch: string
}> {
  try {
    console.log('📋 Completing booking on GroupExPro class details page...')

    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    const pageContent = await page.content()
    const pageContentLower = pageContent.toLowerCase()

    // Wait for action button to render (may be dynamically loaded after login redirect)
    try {
      await page.waitForFunction(
        () => {
          const text = document.body.innerHTML
          return text.includes('Reserve a Spot') ||
                 text.includes('Join the Waitlist') ||
                 text.includes('Cancel Reservation') ||
                 text.includes('Cancel Waitlist')
        },
        { timeout: 10000 }
      )
    } catch {
      console.log('⚠️  Timed out waiting for action button to render, proceeding anyway...')
    }

    // STEP 1: Detect available vs waitlist by looking for action buttons
    const allButtons = await page.$$('button, a, input[type="submit"], input[type="button"]')
    let actionButton = null
    let isWaitlistAction = false

    for (const btn of allButtons) {
      const btnText = await page.evaluate(
        (el) => (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value?.trim() || '',
        btn
      )

      if (btnText && btnText.toLowerCase().includes('join the waitlist')) {
        actionButton = btn
        isWaitlistAction = true
        console.log(`   Found button: "${btnText}" (waitlist)`)
        break
      }

      if (btnText && btnText.toLowerCase().includes('reserve a spot')) {
        actionButton = btn
        isWaitlistAction = false
        console.log(`   Found button: "${btnText}" (reserve)`)
        break
      }
    }

    if (!actionButton) {
      // Check if already reserved/waitlisted (page shows confirmation already)
      if (pageContentLower.includes('you have reserved') || pageContentLower.includes('cancel reservation')) {
        console.log('✅ Class already reserved')
        return { status: 'confirmed', selectedBranch: branchUsed }
      }
      if (pageContentLower.includes('you are on the waitlist') || pageContentLower.includes('cancel waitlist')) {
        console.log('✅ Already on waitlist')
        return { status: 'waitlisted', selectedBranch: branchUsed }
      }

      return {
        status: 'failed',
        errorMessage:
          'No "Reserve a Spot" or "Join the Waitlist" button found on class details page.\n\nWhat to do: Try booking manually through the gym website. Check the screenshot in booking history to see what page we landed on.',
        selectedBranch: branchUsed,
      }
    }

    // STEP 2: For reservation (not waitlist), ensure checkbox is checked
    if (!isWaitlistAction) {
      console.log('Checking user checkbox for reservation...')
      const checkboxes = await page.$$('input[type="checkbox"]')

      for (const checkbox of checkboxes) {
        const isChecked = await page.evaluate((el) => (el as HTMLInputElement).checked, checkbox)
        if (!isChecked) {
          console.log('   Checkbox not checked, clicking to select...')
          await checkbox.click()
          await new Promise(resolve => setTimeout(resolve, 500))
          console.log('   Checkbox selected')
          break
        } else {
          console.log('   Checkbox already checked')
        }
      }

      // Set up alert handler in case checkbox wasn't properly selected
      page.once('dialog', async (dialog) => {
        console.log(`   Alert detected: "${dialog.message()}"`)
        await dialog.dismiss()
      })
    }

    // STEP 3: Click the action button
    console.log(`Clicking "${isWaitlistAction ? 'Join the Waitlist' : 'Reserve a Spot'}" button...`)
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
        actionButton.click(),
      ])
      // Wait for page content to update (confirmation may appear without navigation)
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch {
      console.log('Navigation wait timed out, continuing...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    await takeScreenshot(page, '05-booking-result')

    // STEP 4: Check for confirmation
    const finalContent = (await page.content()).toLowerCase()

    // Check for reservation confirmation
    // From screenshots: "You have reserved 1 spot for this class."
    const isConfirmed =
      finalContent.includes('you have reserved') ||
      finalContent.includes('reserved 1 spot') ||
      finalContent.includes('reservation is complete')

    // Check for waitlist confirmation
    // From screenshots: "You are now on the waitlist." / "You are on the waitlist for this class."
    const isWaitlisted =
      finalContent.includes('you are now on the waitlist') ||
      finalContent.includes('you are on the waitlist') ||
      finalContent.includes('added to waitlist') ||
      finalContent.includes('joined the waitlist')

    // Check for the checkbox alert (means we failed to check it)
    if (finalContent.includes('please select') && finalContent.includes('user for reservation')) {
      console.log('⚠️  Checkbox selection failed - "Please select atleast one user" error')
      return {
        status: 'failed',
        errorMessage:
          'Failed to select user checkbox before reserving.\n\nWhat to do: Try booking manually through the gym website.',
        selectedBranch: branchUsed,
      }
    }

    // Check for concurrent booking conflict
    const hasConcurrentConflict =
      finalContent.includes('already have an existing reservation') ||
      finalContent.includes('already have a reservation during this time') ||
      finalContent.includes('already booked for these timings') ||
      finalContent.includes('already booked for this time')

    if (hasConcurrentConflict) {
      console.log('⚠️  Concurrent booking conflict')
      return {
        status: 'failed',
        errorMessage:
          "You already have another class booked at this time.\n\nWhat to do:\n1. Log into your gym account and find your existing reservation\n2. Cancel it if you prefer this class instead\n3. Or adjust your schedule to avoid the conflict (Dashboard -> Schedule)\n\nGyms don't allow double-booking the same time slot.",
        selectedBranch: branchUsed,
      }
    }

    // Check for cancelled class
    const hasClassCancelledError =
      finalContent.includes('class has been cancelled') ||
      finalContent.includes('class has been canceled') ||
      finalContent.includes('cannot add exercisers')

    if (hasClassCancelledError) {
      console.log('⚠️  Class has been cancelled')
      return {
        status: 'failed',
        errorMessage:
          "This class has been cancelled by the gym.\n\nWhat to do: Remove this class from your schedule (Dashboard -> Schedule -> Delete). Check your gym's website for the class status or alternative times.",
        selectedBranch: branchUsed,
      }
    }

    if (isConfirmed) {
      console.log('✅ Successfully BOOKED class')
      return { status: 'confirmed', selectedBranch: branchUsed }
    }

    if (isWaitlisted) {
      console.log('✅ Successfully added to WAITLIST')
      return { status: 'waitlisted', selectedBranch: branchUsed }
    }

    console.log('⚠️  Booking result unclear')
    return {
      status: 'failed',
      errorMessage:
        "Booking result unclear after clicking button.\n\nWhat to do RIGHT NOW:\n1. Check your gym account to see if the class was booked\n2. Check the screenshots in booking history\n3. If booked: Great! You're all set (ignore this error)\n4. If not booked: Try booking manually",
      selectedBranch: branchUsed,
    }
  } catch (error) {
    return {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'GroupExPro booking error',
      selectedBranch: branchUsed,
    }
  }
}

// =============================================================================
// YMCA Hybrid Booking Flow (Main Orchestrator)
// =============================================================================

/**
 * Book a class using the YMCA/GroupExPro flow
 *
 * Flow:
 * 1. Calculate target date in gym timezone
 * 2. Navigate to YMCA schedule (with date + branch filter)
 * 3. Find class by name/time
 * 4. Check class state (available, waitlist, full, cancelled)
 * 5. Click Register → GroupExPro login (enter credentials)
 * 6. Complete booking on GroupExPro class details page
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
    console.log('🏋️ YMCA/GroupExPro Booking Flow')
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

    // STEP 6: Complete booking on GroupExPro class details page
    console.log('\n📋 Step 6: Completing booking on GroupExPro...')
    const bookingResult = await completeGroupExProBooking(page, branch)

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
  expectedBookingTime?: number // epoch ms - when booking window actually opens (for early-start optimization)
  // Note: Skip logic handled by Inngest (not Puppeteer)
}

/**
 * Main booking function
 *
 * Uses YMCA/GroupExPro flow (YMCA schedule -> GroupExPro login -> class details -> booking)
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

    // MVP: Use YMCA/GroupExPro flow for all bookings
    // This navigates YMCA schedule → GroupExPro login → class details → booking
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

// Daxko flow removed - see git history (commit b47d8ff) if needed for revert

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

