/**
 * Puppeteer script to automate class bookings on YMCA Daxko platform
 * Handles login, branch selection, class finding, and booking
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

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

    // Navigate to gym URL
    console.log(`Navigating to ${gymUrl}...`)
    await page.goto(gymUrl, { waitUntil: 'networkidle2' })

    // Take screenshot for debugging
    screenshotPath = await takeScreenshot(page, '01-initial-page')

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
    const navigationResult = await navigateToDay(page, dayOfWeek)
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
    const bookingResult = await findAndBookClass(
      page,
      classType,
      classTime,
      branchResult.selectedBranch || branch
    )

    screenshotPath = await takeScreenshot(page, '06-after-booking-attempt')

    // Clean up screenshot after a delay (for debugging)
    // In production, you might want to keep screenshots or upload them to storage
    setTimeout(() => {
      if (screenshotPath && fs.existsSync(screenshotPath)) {
        // Optionally delete screenshot after processing
        // fs.unlinkSync(screenshotPath)
      }
    }, 60000) // Keep for 1 minute

    return {
      status: bookingResult.status,
      branchUsed: (branchResult.selectedBranch || null) as string | null,
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
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Perform login on the gym website
 */
async function performLogin(
  page: Page,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Wait for login form to appear
    // Adjust selectors based on actual YMCA Daxko platform structure
    await page.waitForSelector('input[type="text"], input[name="username"], input[id*="user"], input[id*="email"]', {
      timeout: 10000,
    })

    // Find username field (try multiple possible selectors)
    const usernameSelectors = [
      'input[name="username"]',
      'input[id*="user"]',
      'input[id*="email"]',
      'input[type="text"]',
      '#username',
      '#email',
    ]

    let usernameField = null
    for (const selector of usernameSelectors) {
      try {
        usernameField = await page.$(selector)
        if (usernameField) break
      } catch {
        continue
      }
    }

    if (!usernameField) {
      return { success: false, error: 'Could not find username field' }
    }

    await usernameField.type(username, { delay: 50 })

    // Find password field
    const passwordField = await page.$('input[type="password"]')
    if (!passwordField) {
      return { success: false, error: 'Could not find password field' }
    }

    await passwordField.type(password, { delay: 50 })

    // Find and click login button
    const loginButtonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'a:has-text("Login")',
      'a:has-text("Sign In")',
    ]

    let loginButton = null
    for (const selector of loginButtonSelectors) {
      try {
        loginButton = await page.$(selector)
        if (loginButton) break
      } catch {
        continue
      }
    }

    if (!loginButton) {
      // Try to submit the form directly
      await page.keyboard.press('Enter')
    } else {
      await loginButton.click()
    }

    // Wait for navigation after login (either success or error)
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })

    // Check if login was successful
    // Look for indicators of successful login (adjust based on actual site)
    const currentUrl = page.url()
    const pageContent = await page.content()

    // Common indicators of failed login
    if (
      pageContent.includes('invalid') ||
      pageContent.includes('incorrect') ||
      pageContent.includes('error') ||
      currentUrl.includes('login') ||
      currentUrl.includes('signin')
    ) {
      return { success: false, error: 'Login credentials appear to be invalid' }
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
 * Select branch from dropdown
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
    // Wait for branch selector to appear
    // Common selectors for dropdowns
    const branchSelectors = [
      'select[name*="branch"]',
      'select[id*="branch"]',
      'select[name*="location"]',
      'select[id*="location"]',
      'select',
    ]

    let branchSelect = null
    for (const selector of branchSelectors) {
      try {
        branchSelect = await page.$(selector)
        if (branchSelect) break
      } catch {
        continue
      }
    }

    if (!branchSelect) {
      return { success: false, error: 'Could not find branch selector' }
    }

    // Get all options
    const options = await page.evaluate((select) => {
      const selectElement = select as HTMLSelectElement
      return Array.from(selectElement.options).map((opt) => ({
        value: opt.value,
        text: opt.text.trim(),
      }))
    }, branchSelect)

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

    // Select the branch
    await page.select(
      branchSelectors.find((s) => {
        try {
          return page.$(s)
        } catch {
          return false
        }
      }) || 'select',
      matchingOption.value
    )

    // Wait for page to update after branch selection
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for any dynamic content to load

    return { success: true, selectedBranch: matchingOption.text }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Branch selection error',
    }
  }
}

/**
 * Navigate to the schedule for a specific day of week
 */
async function navigateToDay(
  page: Page,
  dayOfWeek: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Day names mapping (0 = Sunday, 6 = Saturday)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const targetDayName = dayNames[dayOfWeek]

    // Try to find day navigation (could be tabs, buttons, or calendar)
    const daySelectors = [
      `a:has-text("${targetDayName}")`,
      `button:has-text("${targetDayName}")`,
      `[data-day="${dayOfWeek}"]`,
      `[data-day="${targetDayName}"]`,
      `.day-${dayOfWeek}`,
      `.day-${targetDayName.toLowerCase()}`,
    ]

    let dayElement = null
    for (const selector of daySelectors) {
      try {
        dayElement = await page.$(selector)
        if (dayElement) break
      } catch {
        continue
      }
    }

    if (dayElement) {
      await dayElement.click()
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for schedule to load
    } else {
      // If no day selector found, the page might show all days or default to today
      // This is acceptable - we'll search through all classes
      console.log('No day selector found, will search all visible classes')
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
 * Find and book a class matching the criteria
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

    // Get all class rows/cards from the page
    const classes = await page.evaluate(() => {
      // Common class container selectors
      const containers = document.querySelectorAll(
        'tr, .class-item, .schedule-item, [class*="class"], [class*="schedule"]'
      )

      return Array.from(containers).map((container) => {
        const text = container.textContent || ''
        const buttons = Array.from(container.querySelectorAll('button, a, input[type="button"]'))
        const buttonTexts = buttons.map((btn) => (btn as HTMLElement).textContent?.trim() || '')

        return {
          html: container.outerHTML.substring(0, 500), // First 500 chars for debugging
          text: text.substring(0, 500),
          buttonTexts,
        }
      })
    })

    // Find class matching type and time
    let matchingClass = null
    let matchingButton = null

    for (const classItem of classes) {
      const classText = classItem.text.toLowerCase()
      const matchesType = classText.includes(classType.toLowerCase())
      const matchesTime = classText.includes(targetTime) || classText.includes(classTime)

      if (matchesType && matchesTime) {
        matchingClass = classItem

        // Find the booking button
        const reserveButton = classItem.buttonTexts.find(
          (btn) =>
            btn.toUpperCase().includes('RESERVE') ||
            btn.toUpperCase().includes('BOOK') ||
            btn.toUpperCase().includes('JOIN WAITLIST') ||
            btn.toUpperCase().includes('ADD TO WAITLIST')
        )

        if (reserveButton) {
          matchingButton = reserveButton
        }

        break
      }
    }

    if (!matchingClass) {
      return {
        status: 'failed',
        errorMessage: `Class "${classType}" at ${targetTime} not found on schedule`,
        selectedBranch: branchUsed,
      }
    }

    // Check if already reserved
    if (
      matchingClass.text.toUpperCase().includes('RESERVED') ||
      matchingClass.buttonTexts.some((btn) => btn.toUpperCase().includes('RESERVED'))
    ) {
      return {
        status: 'confirmed',
        errorMessage: 'Class already reserved',
        selectedBranch: branchUsed,
      }
    }

    // Check if full (no waitlist option)
    if (
      matchingClass.text.toUpperCase().includes('FULL') &&
      !matchingClass.buttonTexts.some((btn) =>
        btn.toUpperCase().includes('WAITLIST')
      )
    ) {
      return {
        status: 'failed',
        errorMessage: 'Class is full and no waitlist option available',
        selectedBranch: branchUsed,
      }
    }

    // Find and click the booking button
    // Try multiple approaches to find the button
    let clicked = false
    
    // Approach 1: Find all buttons and filter by text
    const allButtons = await page.$$('button, a, input[type="button"]')
    
    for (const button of allButtons) {
      const buttonText = await page.evaluate((el) => (el as HTMLElement).textContent?.trim() || '', button)
      const parentText = await page.evaluate(
        (el) => (el.parentElement?.textContent || '').toLowerCase(),
        button
      )
      
      const buttonTextLower = buttonText.toLowerCase()
      const isBookingButton = 
        buttonTextLower.includes('reserve') ||
        buttonTextLower.includes('book') ||
        buttonTextLower.includes('waitlist') ||
        buttonTextLower.includes('add to waitlist')

      // Check if this button is in the matching class row
      if (isBookingButton && parentText.includes(classType.toLowerCase()) && parentText.includes(targetTime)) {
        await button.click()
        clicked = true
        break
      }
    }

    if (!clicked) {
      return {
        status: 'failed',
        errorMessage: 'Could not find or click booking button',
        selectedBranch: branchUsed,
      }
    }

    // Wait for confirmation or error message
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check result
    const pageContent = (await page.content()).toLowerCase()
    const isWaitlisted =
      pageContent.includes('waitlist') ||
      pageContent.includes('added to waitlist')

    const isConfirmed =
      pageContent.includes('confirmed') ||
      pageContent.includes('reserved') ||
      pageContent.includes('success') ||
      (!isWaitlisted && !pageContent.includes('error') && !pageContent.includes('failed'))

    if (isWaitlisted) {
      return {
        status: 'waitlisted',
        selectedBranch: branchUsed,
      }
    }

    if (isConfirmed) {
      return {
        status: 'confirmed',
        selectedBranch: branchUsed,
      }
    }

    return {
      status: 'failed',
      errorMessage: 'Booking result unclear - check screenshot',
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

