/**
 * Puppeteer script to automate class bookings on YMCA Daxko platform
 * Handles login, branch selection, class finding, and booking
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

// Detect production environment (GitHub Actions)
const IS_PRODUCTION = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

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
  nextSkipDate: string | null // If equals today, skip booking
}

/**
 * Main booking function
 */
export async function bookClass(params: BookingParams): Promise<BookingResult> {
  const {
    gymUrl,
    username,
    password,
    branch,
    dayOfWeek,
    classTime,
    classType,
    timezone,
    nextSkipDate,
  } = params

  // Check if we should skip today
  const today = new Date().toISOString().split('T')[0]
  if (nextSkipDate === today) {
    return {
      status: 'skipped',
      branchUsed: null,
      errorMessage: `Skipped: next_skip_date equals today (${today})`,
    }
  }

  let browser: Browser | null = null
  let screenshotPath: string | undefined

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
    await page.setViewport({ width: 1280, height: 720 })

    // Set a reasonable timeout
    page.setDefaultTimeout(30000) // 30 seconds

    // Navigate to login page first (YMCA Daxko requires separate login page)
    // Extract base URL and construct login URL
    const urlObj = new URL(gymUrl)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`
    const loginUrl = `${baseUrl}/online/4032/Security/login.mvc`
    
    console.log(`Navigating to login page: ${loginUrl}...`)
    await page.goto(loginUrl, { waitUntil: 'networkidle2' })

    // Take screenshot for debugging
    screenshotPath = await takeScreenshot(page, '01-login-page')

    // Step 1: Login
    console.log('Attempting login...')
    const loginResult = await performLogin(page, username, password)
    if (!loginResult.success) {
      screenshotPath = await takeScreenshot(page, '02-login-failed')
      return {
        status: 'failed',
        branchUsed: null,
        errorMessage: `Login failed: ${loginResult.error}`,
        screenshotPath,
      }
    }

    screenshotPath = await takeScreenshot(page, '03-after-login')

    // Note: performLogin now handles navigating to class schedule via "Group Ex" link
    // If that didn't work, try navigating directly
    const currentUrl = page.url()
    if (!currentUrl.includes('ClassSchedule') && !currentUrl.includes('GroupEx')) {
      console.log(`Navigating directly to class schedule: ${gymUrl}...`)
      await page.goto(gymUrl, { waitUntil: 'networkidle2' })
    }
    screenshotPath = await takeScreenshot(page, '04-schedule-page')

    // Step 2: Select branch
    console.log(`Selecting branch: ${branch}...`)
    const branchResult = await selectBranch(page, branch)
    if (!branchResult.success) {
      screenshotPath = await takeScreenshot(page, '04-branch-selection-failed')
      return {
        status: 'failed',
        branchUsed: branchResult.selectedBranch || null,
        errorMessage: `Branch selection failed: ${branchResult.error}`,
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

    // Step 4: Find and book class (with retry logic for clock drift)
    console.log(`Finding class: ${classType} at ${classTime}...`)
    
    // Retry logic for clock drift: if booking button not found, retry a few times
    // This handles cases where gym website clock is slightly off from our system clock
    const maxRetries = 12 // 3 minutes of retries (12 × 15 seconds)
    const retryDelay = 15000 // 15 seconds between retries
    let bookingResult: {
      status: 'confirmed' | 'waitlisted' | 'failed'
      errorMessage?: string
      selectedBranch: string
    } | null = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const branchToUse = branchResult.selectedBranch || branch
      bookingResult = await findAndBookClass(
        page,
        classType,
        classTime,
        branchToUse
      )
      
      // If booking succeeded or failed for reasons other than button not found, return
      if (bookingResult.status === 'confirmed' || bookingResult.status === 'waitlisted') {
        break // Success!
      }
      
      // Check if error is due to button not found (clock drift scenario)
      const isButtonNotFound = 
        bookingResult.errorMessage?.includes('Could not find or click booking button') ||
        bookingResult.errorMessage?.includes('not found on schedule')
      
      // If it's not a "button not found" error, return immediately (don't retry)
      if (!isButtonNotFound) {
        break
      }
      
      // If this is the last attempt, return the failure
      if (attempt === maxRetries - 1) {
        console.log(`⚠️  Booking button not found after ${maxRetries} attempts. This may be due to clock drift. Next cron run will retry.`)
        break
      }
      
      // Button not found - retry after delay (clock drift scenario)
      console.log(`⏰ Booking button not found (attempt ${attempt + 1}/${maxRetries}). This may be clock drift. Retrying in ${retryDelay / 1000} seconds...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      
      // Refresh page and re-navigate to get latest state
      console.log('🔄 Refreshing page and re-navigating...')
      await page.reload({ waitUntil: 'networkidle2' })
      
      // Re-select branch (might have been reset)
      const branchResultRetry = await selectBranch(page, branch)
      if (!branchResultRetry.success) {
        console.log(`⚠️  Branch selection failed on retry: ${branchResultRetry.error}, using original branch`)
      }
      
      // Re-navigate to target day
      const navigationResultRetry = await navigateToDay(page, dayOfWeek, timezone, classTime)
      if (!navigationResultRetry.success) {
        console.log(`⚠️  Navigation failed on retry: ${navigationResultRetry.error}`)
        // Continue anyway - might still work
      }
      
      screenshotPath = await takeScreenshot(page, `05-retry-${attempt + 1}`)
      
      // Update branchResult for next iteration (use retry result if successful)
      if (branchResultRetry.success && branchResultRetry.selectedBranch) {
        branchResult.selectedBranch = branchResultRetry.selectedBranch
      }
    }

    screenshotPath = await takeScreenshot(page, '06-after-booking-attempt')

    // Ensure we have a booking result (should always be set by retry loop)
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
      errorMessage: `Unexpected error: ${errorMessage}`,
      screenshotPath,
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
    })
    
    const parts = formatter.formatToParts(now)
    const gymDate = {
      year: parseInt(parts.find(p => p.type === 'year')!.value),
      month: parseInt(parts.find(p => p.type === 'month')!.value),
      day: parseInt(parts.find(p => p.type === 'day')!.value),
      hour: parseInt(parts.find(p => p.type === 'hour')!.value),
      minute: parseInt(parts.find(p => p.type === 'minute')!.value),
    }
    
    // Create a date object representing "today" in gym's timezone
    const todayInGymTz = new Date(gymDate.year, gymDate.month - 1, gymDate.day, gymDate.hour, gymDate.minute)
    const currentDayOfWeek = todayInGymTz.getDay() // 0 = Sunday, 6 = Saturday
    
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
    
    console.log(`Today in ${timezone}: ${gymDate.month}/${gymDate.day}/${gymDate.year}, Current day: ${currentDayOfWeek}`)
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
        
        // Check if button is in the matching class row
        const isInMatchingRow = await page.evaluate((el, classType, targetTime12) => {
          let current: HTMLElement | null = el.parentElement
          let depth = 0
          while (current && depth < 6) {
            // Check if we're in a div.row
            if (current.tagName === 'DIV' && current.className.includes('row')) {
              const rowText = (current.textContent || '').toLowerCase()
              if (rowText.includes(classType.toLowerCase()) && 
                  rowText.includes(targetTime12.toLowerCase())) {
                return true
              }
            }
            current = current.parentElement
            depth++
          }
          return false
        }, button, classType, targetTime12)
        
        if (isInMatchingRow) {
          console.log(`Found booking button: "${buttonText}"`)
          await button.click()
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
  branchUsed: string
): Promise<{
  status: 'confirmed' | 'waitlisted' | 'failed'
  errorMessage?: string
  selectedBranch: string
}> {
  try {
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
    }> => {
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
          // Match time range format like "4:15 PM - 5:15 PM" by checking if it starts with our time
          classText.match(new RegExp(`\\b${targetTime12.toLowerCase().replace(/[:\s]/g, '[:\s]?')}`, 'i')) ||
          classText.match(new RegExp(`\\b${targetTime12.replace(' ', '').toLowerCase().replace(/[:\s]/g, '[:\s]?')}`, 'i'))

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

          // Determine status with improved logic
          // Priority order: reserved > cancelled > not reservable > full > available
          let status: 'reserved' | 'available' | 'full'
          if (isReserved) {
            status = 'reserved'
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

          console.log(`   Status check: isReserved=${isReserved}, isFull=${isFull}, isCancelled=${isCancelled}, isNotReservable=${isNotReservable}, hasBookingButton=${hasBookingButton}`)
          console.log(`   Determined status: ${status}`)
          console.log(`   Button texts: ${classItem.buttonTexts.join(', ')}`)

          return {
            found: true,
            status,
            debugInfo: classItem,
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
        errorMessage: `Class "${classType}" at ${targetTime} not found on schedule (searched all loaded results)`,
        selectedBranch: branchUsed,
      }
    }

    // Handle different statuses
    if (searchResult.status === 'reserved') {
      return {
        status: 'confirmed',
        errorMessage: 'Class already reserved',
        selectedBranch: branchUsed,
      }
    }

    if (searchResult.status === 'full') {
      // Check if it's a permanent failure (cancelled or not reservable)
      // These should NOT trigger retry logic (no "full" in error message)
      const debugText = searchResult.debugInfo?.text?.toLowerCase() || ''

      if (debugText.includes('cancelled')) {
        return {
          status: 'failed',
          errorMessage: 'Class is cancelled - booking not possible',
          selectedBranch: branchUsed,
        }
      }

      if (debugText.includes('not reservable')) {
        return {
          status: 'failed',
          errorMessage: 'Class is not reservable - booking not possible',
          selectedBranch: branchUsed,
        }
      }

      // Class is full (temporary) - this should trigger the 15-minute retry logic in Inngest
      // IMPORTANT: Error message MUST contain "full" to trigger retry logic
      return {
        status: 'failed',
        errorMessage: 'Class is full - no waitlist option available. Will retry in case spots open up.',
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

        // Check if this button is in the matching class row
        const matchesClass = 
          parentText.includes(classType.toLowerCase()) &&
          (parentText.includes(targetTime) ||
           parentText.includes(classTime) ||
           parentText.includes(targetTime12.toLowerCase()) ||
           parentText.includes(targetTime12.replace(' ', '').toLowerCase()))

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
        errorMessage: 'Could not find or click booking button for the class',
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
        errorMessage: 'No RESERVE button found on class description page',
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
        errorMessage: 'Cannot book - you already have a class scheduled at this time (conflicts with existing reservation)',
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
      errorMessage: 'Booking result unclear after clicking RESERVE button - check screenshots',
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

