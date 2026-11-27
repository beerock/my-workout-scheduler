/**
 * Class booking automation: GroupExPro schedule feed lookup + Puppeteer for Daxko login/booking
 * Handles login, branch selection, class finding, and booking
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
// Detect production environment (GitHub Actions)
const IS_PRODUCTION = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

/**
 * Format HH:MM or HH:MM:SS 24-hour time to user-friendly 12-hour format.
 *
 * Used only for building user-facing error messages that surface in failure
 * emails — `Class "X" at 19:55:00 not found` is confusing; `at 7:55 PM` isn't.
 * Kept inline here (not imported from `lib/date-utils`) because this script
 * runs under GitHub Actions via tsx without the Next.js `@/*` path-alias
 * resolution.
 */
function formatClassTime12Hour(time: string): string {
  if (!time || typeof time !== 'string' || !time.includes(':')) return time
  const [hStr, mStr] = time.split(':')
  const h24 = Number(hStr)
  const m = Number(mStr)
  if (isNaN(h24) || isNaN(m)) return time
  const period = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`
}

// =============================================================================
// YMCA Constants (MVP: Single gym - YMCA of Western North Carolina)
// =============================================================================

/**
 * GroupExPro public schedule feed - the same JSON the ymcawnc.org schedule
 * embed (iframe.ymcawnc-gx-schedule) loads. Replaced DOM scraping of
 * ymcawnc.org/schedules after the Nov 2026 site redesign.
 */
const GROUPEX_FEED_URL = 'https://groupexpro.com/schedule/embed/json_schedule.php'
const GROUPEX_ACCOUNT = '89'
const GROUPEX_FEED_TIMEOUT_MS = 20000

/**
 * GroupExPro location IDs for YMCA of WNC branches. Keys must match
 * YMCA_BRANCHES in lib/constants/ymca.ts (inlined: scripts/ can't use @/*).
 * Source: LOCATION_ID_BY_NAME in the ymcawnc.org schedule embed.
 */
const GROUPEX_LOCATION_IDS: Record<string, string> = {
  'Asheville YMCA': '470',
  'Black Mountain YMCA': '3316',
  'Corpening Memorial YMCA': '473',
  'Ferguson Family YMCA': '2858',
  'Hendersonville Family YMCA': '472',
  'Reuter Family YMCA': '461',
  'Woodfin YMCA': '471',
}

/** Sign-up URL shape from the feed (it redirects to Daxko login, then the class page) */
const GROUPEX_RESERVATION_URL_PATTERN =
  /^https:\/\/(?:www\.)?groupexpro\.com\/gxp\/reservations\/schedule\/index\/\d+\/\d{1,2}\/\d{1,2}\/\d{4}\/?$/i

/**
 * YMCA timezone - used for date calculations in schedule URLs
 * IANA timezone that auto-handles DST
 */
const YMCA_TIMEZONE = 'America/New_York'

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
 * Result type for YMCA class search
 *
 * The feed only decides `cancelled` (title prefixed "CANCELED:") and
 * `no_registration` (no sign-up link). Everything else is `available` with a
 * register URL - full/waitlist state is read from the live Daxko class
 * page after login, because the feed can lag behind it.
 */
export type YMCAClassSearchResult = {
  found: boolean
  status?: 'available' | 'cancelled' | 'no_registration'
  registerUrl?: string
  errorMessage?: string
}

/**
 * Decode the handful of HTML entities GroupExPro emits, and strip tags.
 * Tags are stripped again after decoding because some attributes carry
 * entity-escaped markup (e.g. data-details="&lt;span class=...&gt;0 of 1 open&lt;/span&gt;").
 */
function stripHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Read one attribute from an HTML tag string (attribute names are case-insensitive) */
function readAttr(tag: string, name: string): string {
  const match = new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)
  return match ? stripHtml(match[1]) : ''
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

/** "Friday, November 27, 2026" -> "2026-11-27" (null if unparseable) */
function feedDateToYYYYMMDD(value: string): string | null {
  const match = /([a-z]+)\s+(\d{1,2}),\s*(\d{4})/i.exec(value)
  if (!match) return null
  const monthIndex = MONTH_NAMES.indexOf(match[1].toLowerCase())
  if (monthIndex === -1) return null
  return `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${match[2].padStart(2, '0')}`
}

/** "15:00" -> "3:00pm" (feed time format, no space) */
function toFeedTime(classTime: string): string {
  const [hours, minutes] = classTime.split(':').map(Number)
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  const ampm = hours >= 12 ? 'pm' : 'am'
  return `${hour12}:${String(minutes).padStart(2, '0')}${ampm}`
}

function normalizeClassName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

const CANCELLED_TITLE_PATTERN = /^cancel+ed\s*[:\-]?\s*/i

/**
 * Fetch the raw schedule rows for one branch around the target date.
 *
 * Queries target date +/- 1 day (UTC-noon anchored) so no timezone math is
 * needed to hit the right window; rows are filtered by their own date column.
 * One retry on network error / timeout / non-200.
 */
async function fetchGroupExRows(locationId: string, targetDate: string): Promise<unknown[][]> {
  const [year, month, day] = targetDate.split('-').map(Number)
  const noonUtcSeconds = Date.UTC(year, month - 1, day, 12) / 1000
  const params = new URLSearchParams({
    schedule: '',
    instructor_id: 'true',
    format: 'jsonp',
    a: GROUPEX_ACCOUNT,
    location: locationId,
    start: String(noonUtcSeconds - 86400),
    end: String(noonUtcSeconds + 86400),
  })
  const url = `${GROUPEX_FEED_URL}?${params.toString()}`

  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(GROUPEX_FEED_TIMEOUT_MS) })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const body = (await response.json()) as { aaData?: unknown }
      if (!Array.isArray(body.aaData)) {
        throw new Error('Response has no aaData array')
      }
      return body.aaData.filter((row): row is unknown[] => Array.isArray(row))
    } catch (error) {
      lastError = error
      console.error(`[groupex-feed] Attempt ${attempt}/2 failed for location ${locationId} (${targetDate}):`, error)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Schedule feed request failed')
}

/**
 * Find a class in the GroupExPro schedule feed and get its sign-up URL.
 *
 * Row columns (verified Nov 2026): [0] "Friday, November 27, 2026",
 * [1] "6:00am-6:55am", [2] title, [9] description + sign-up HTML.
 *
 * @param targetDate YYYY-MM-DD in gym timezone
 * @param classType Class name (e.g. "BODYPUMP")
 * @param classTime HH:MM 24-hour
 * @param branch Branch name from YMCA_BRANCHES
 */
export async function findClassInGroupExFeed(
  targetDate: string,
  classType: string,
  classTime: string,
  branch: string
): Promise<YMCAClassSearchResult> {
  const notFoundMessage = `Class "${classType}" at ${formatClassTime12Hour(classTime)} not found on YMCA schedule.`

  const locationId = GROUPEX_LOCATION_IDS[branch]
  if (!locationId) {
    console.error(`[groupex-feed] Unknown branch "${branch}" - no GroupExPro location ID`)
    return { found: false, errorMessage: notFoundMessage }
  }

  const targetTime = toFeedTime(classTime)
  console.log(`🔍 Searching feed: ${classType} at ${targetTime} on ${targetDate} (${branch}, location ${locationId})`)

  let rows: unknown[][]
  try {
    rows = await fetchGroupExRows(locationId, targetDate)
  } catch (error) {
    return {
      found: false,
      errorMessage: `Couldn't load the YMCA class schedule (${error instanceof Error ? error.message : 'unknown error'}). This is usually temporary on the YMCA's side.`,
    }
  }

  const candidates = rows
    .map(row => {
      const rawTitle = stripHtml(row[2])
      const cancelled = CANCELLED_TITLE_PATTERN.test(rawTitle)
      return {
        row,
        date: feedDateToYYYYMMDD(stripHtml(row[0])),
        startTime: stripHtml(row[1]).split('-')[0].trim().toLowerCase(),
        title: cancelled ? rawTitle.replace(CANCELLED_TITLE_PATTERN, '').trim() : rawTitle,
        cancelled,
      }
    })
    .filter(c => c.date === targetDate && c.startTime === targetTime)

  // Exact (normalized) name match only. A "contains" fallback would let
  // "BODYPUMP" grab "BODYPUMP HEAVY" at the same time slot.
  const wanted = normalizeClassName(classType)
  const match = candidates.find(c => normalizeClassName(c.title) === wanted)

  console.log(`   Feed returned ${rows.length} rows, ${candidates.length} at ${targetTime} on ${targetDate}`)

  if (!match) {
    if (candidates.length > 0) {
      console.log(`   Classes at that time: ${candidates.map(c => c.title).join(', ')}`)
    }
    return { found: false, errorMessage: notFoundMessage }
  }

  const signupCell = String(match.row[9] ?? '')
  const signupTag = /<a\b[^>]*class="[^"]*signUpGXP[^"]*"[^>]*>/i.exec(signupCell)?.[0] ?? ''

  console.log(`✅ Found in feed: ${match.title} ${stripHtml(match.row[1])}`)
  if (signupTag) {
    console.log(
      `   Feed state (informational - class page decides): ${readAttr(signupTag, 'textmsg') || '-'}` +
      ` | ${readAttr(signupTag, 'data-details') || '-'}` +
      (readAttr(signupTag, 'start-info') ? ` | window opens ${readAttr(signupTag, 'start-info')}` : '')
    )
  }

  if (match.cancelled) {
    console.log('⚠️ Class is CANCELLED in feed - not proceeding with booking')
    return { found: true, status: 'cancelled', errorMessage: 'This class has been cancelled by the gym.' }
  }

  if (!signupTag) {
    console.log('ℹ️ No sign-up link in feed - class does not offer online registration')
    return { found: true, status: 'no_registration' }
  }

  let registerUrl = readAttr(signupTag, 'href')
  if (!GROUPEX_RESERVATION_URL_PATTERN.test(registerUrl)) {
    const classId = readAttr(signupTag, 'alt')
    if (!/^\d+$/.test(classId)) {
      console.error(`[groupex-feed] Sign-up link has unexpected href "${registerUrl}" and no class id`)
      return { found: true, status: 'available' }
    }
    const [year, month, day] = targetDate.split('-').map(Number)
    registerUrl = `https://groupexpro.com/gxp/reservations/schedule/index/${classId}/${month}/${day}/${year}`
    console.log(`   Built sign-up URL from class id ${classId}`)
  }

  console.log(`   Register URL: ${registerUrl}`)
  return { found: true, status: 'available', registerUrl }
}

/**
 * Log in through Daxko and land on the Daxko class sign-up page.
 *
 * As of Nov 2026 the GroupExPro reservation URL redirects (client-side JS) to
 * Daxko's 2-step login (find_account: email -> password), whose return_url is
 * Daxko's GXP ChooseMembers.mvc page for that class. Same flow the app used
 * before March 2026 (see git 48fb54a^), minus the GroupExPro click-through.
 *
 * @returns Success with the ChooseMembers URL, or failure with error
 */
export async function performDaxkoLogin(
  page: Page,
  registerUrl: string,
  username: string,
  password: string
): Promise<{ success: boolean; classDetailsUrl?: string; error?: string }> {
  try {
    try {
      const parsed = new URL(registerUrl)
      if (parsed.hostname !== 'www.groupexpro.com' && parsed.hostname !== 'groupexpro.com') {
        return { success: false, error: `Registration URL is not on groupexpro.com: ${parsed.hostname}` }
      }
    } catch {
      return { success: false, error: `Invalid registration URL: ${registerUrl}` }
    }

    // STEP 1: Open the sign-up URL and wait for the redirect to Daxko
    console.log(`🔐 Opening sign-up URL: ${registerUrl}`)
    await page.goto(registerUrl, { waitUntil: 'networkidle2' })

    if (!page.url().includes('operations.daxko.com')) {
      await page
        .waitForFunction(() => location.hostname === 'operations.daxko.com', { timeout: 15000 })
        .catch(() => {})
    }

    // Fallback: older GroupExPro page with a Login button that forwards to Daxko
    if (!page.url().includes('operations.daxko.com')) {
      const gxpLoginButton = await page.$('button[type="submit"], input[type="submit"], input[value="Login"]')
      if (gxpLoginButton && !(await page.$('input[type="password"]'))) {
        console.log('   Still on GroupExPro - clicking Login to forward to Daxko')
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
          gxpLoginButton.click(),
        ])
      }
    }

    console.log(`   Login page: ${page.url().split('?')[0]}`)
    if (!page.url().includes('operations.daxko.com')) {
      await takeScreenshot(page, '03-redirect-failed')
      return { success: false, error: `Expected redirect to the YMCA (Daxko) login page, but got: ${page.url().split('?')[0]}` }
    }
    await takeScreenshot(page, '03a-daxko-login')

    // Already signed in (session cookie) - Daxko may skip straight to the class page
    if (page.url().split('?')[0].includes('ChooseMembers.mvc')) {
      console.log('✅ Already on ChooseMembers page')
      return { success: true, classDetailsUrl: page.url() }
    }

    // STEP 2: Email step
    console.log('📝 Daxko login step 1: email')
    await page.waitForSelector('input#user_name, input[name="user_name"], input[type="email"]', { timeout: 10000 })
    const emailField = await page.$('input#user_name, input[name="user_name"], input[type="email"]')
    if (!emailField) {
      return { success: false, error: 'Could not find email field on Daxko login page' }
    }
    await emailField.type(username, { delay: 50 })

    const submitButton = await page.$('#submit_button, button[type="submit"], input[type="submit"]')
    if (!submitButton) {
      return { success: false, error: 'Could not find Submit button on Daxko login page' }
    }
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
      submitButton.click(),
    ])

    // STEP 3: Password step
    console.log('📝 Daxko login step 2: password')
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 10000 })
    } catch {
      await takeScreenshot(page, '03b-no-password-field')
      const content = (await page.content()).toLowerCase()
      if (content.includes('no account') || content.includes("couldn't find") || content.includes('could not find') || content.includes('not found')) {
        return { success: false, error: 'Login failed: No YMCA account found for this email.' }
      }
      return { success: false, error: 'Could not find password field on Daxko login page' }
    }
    await takeScreenshot(page, '03b-daxko-password')

    const passwordField = await page.$('input[type="password"]')
    if (!passwordField) {
      return { success: false, error: 'Could not find password field on Daxko login page' }
    }
    await passwordField.type(password, { delay: 50 })

    // Never tick "Keep me logged in"
    const keepLoggedIn = await page.$('input[type="checkbox"]')
    if (keepLoggedIn && (await page.evaluate(el => (el as HTMLInputElement).checked, keepLoggedIn))) {
      await keepLoggedIn.click()
    }

    const loginButton = await page.$('#submit_button, button[type="submit"], input[type="submit"]')
    if (!loginButton) {
      return { success: false, error: 'Could not find Login button on Daxko password page' }
    }
    console.log('   Clicking Login...')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
      loginButton.click(),
    ])

    // STEP 4: Expect the ChooseMembers page for this class
    const finalUrl = page.url()
    console.log(`   Final URL: ${finalUrl.split('?')[0]}`)
    if (finalUrl.includes('operations.daxko.com') && finalUrl.split('?')[0].includes('ChooseMembers.mvc')) {
      console.log('✅ Logged in and reached Daxko ChooseMembers page')
      await takeScreenshot(page, '04-daxko-choosemembers')
      return { success: true, classDetailsUrl: finalUrl }
    }

    // Still on a login page = bad credentials
    if (await page.$('input[type="password"]')) {
      const pwField = await page.$('input[type="password"]')
      if (pwField) await pwField.evaluate(el => { (el as HTMLInputElement).value = '' })
      await takeScreenshot(page, '03-login-failed')
      return { success: false, error: 'Login failed: Email or password is incorrect.' }
    }

    await takeScreenshot(page, '03-unexpected')
    return { success: false, error: `Unexpected page after login. URL: ${finalUrl.split('?')[0]}` }
  } catch (error) {
    await takeScreenshot(page, '03-error')
    return { success: false, error: error instanceof Error ? error.message : 'Login error' }
  }
}

/**
 * Complete booking on the Daxko GXP ChooseMembers page.
 *
 * Page anatomy (verified Nov 2026):
 * - input.member_checkbox per household member, with data-email-id,
 *   data-is-reserved="True|False", data-mem-waitlist-status="True|False";
 *   disabled until the reservation window opens
 * - "The Reservation Window for Active Members will open on ..." notice
 * - "Active Members (Accepting Spot in WaitList)" when the class is full
 * - button#reservation_button "Reserve" (same label for reserve and waitlist)
 * - #submit_error_message for errors after clicking
 *
 * Error message text below is load-bearing for email routing: "full" triggers
 * the Inngest retry loop, "cancelled" routes to the critical email, and
 * "YMCA's booking system" selects the ymca_system_error variant.
 *
 * @param page Puppeteer page on the Daxko ChooseMembers page
 * @param username Logged-in email, used to pick the right household member
 * @param branchUsed Branch name for result reporting
 */
async function completeDaxkoBooking(
  page: Page,
  username: string,
  branchUsed: string
): Promise<{
  status: 'confirmed' | 'waitlisted' | 'failed'
  errorMessage?: string
  selectedBranch: string
  alreadyBooked?: boolean
}> {
  const FULL_MESSAGE =
    "Class is currently full, but don't worry - we've got you covered!\n\nWe'll automatically keep trying every 15 minutes until the class starts. If someone cancels, we'll grab that spot for you. No action needed - just sit back and relax!"
  const CANCELLED_MESSAGE =
    "This class has been cancelled by the gym.\n\nWhat to do: Remove this class from your schedule (Dashboard -> Schedule -> Delete). Check your gym's website for the class status or alternative times."
  const CONFLICT_MESSAGE =
    "You already have another class booked at this time.\n\nWhat to do:\n1. Log into your gym account and find your existing reservation\n2. Cancel it if you prefer this class instead\n3. Or adjust your schedule to avoid the conflict (Dashboard -> Schedule)\n\nGyms don't allow double-booking the same time slot."
  // NOTE: "YMCA's booking system" is a routing marker in lib/email/get-email-template.ts. Do not remove.
  const SYSTEM_ERROR_MESSAGE =
    "The YMCA's booking system is having trouble with this class right now - it looks like an issue on their end. We recommend calling the YMCA to let them know, and you can also try booking directly through the YMCA website or app. We'll pick back up automatically for future classes."

  try {
    console.log('📋 Completing booking on Daxko ChooseMembers page...')
    console.log(`   Current URL: ${page.url().split('?')[0]}`)

    try {
      await page.waitForSelector('#reservation_button, input.member_checkbox', { timeout: 10000 })
    } catch {
      console.log('⚠️  Timed out waiting for Reserve button / member list, proceeding anyway...')
    }

    const pageContentLower = (await page.content()).toLowerCase()

    if (pageContentLower.includes('class has been cancelled') || pageContentLower.includes('class has been canceled')) {
      return { status: 'failed', errorMessage: CANCELLED_MESSAGE, selectedBranch: branchUsed }
    }

    // STEP 1: Find this user's member checkbox (household accounts list several)
    const members = await page.$$eval('input.member_checkbox', els =>
      els.map(el => {
        const input = el as HTMLInputElement
        return {
          email: (input.getAttribute('data-email-id') || '').toLowerCase(),
          reserved: input.getAttribute('data-is-reserved') === 'True',
          waitlisted: input.getAttribute('data-mem-waitlist-status') === 'True',
          disabled: input.disabled,
          checked: input.checked,
        }
      })
    )
    console.log(`   Members on page: ${members.length}`)

    let memberIndex = members.findIndex(m => m.email && m.email === username.toLowerCase())
    if (memberIndex === -1 && members.length > 0) {
      console.log('   No member matched the login email - using the first member')
      memberIndex = 0
    }
    const member = memberIndex >= 0 ? members[memberIndex] : null

    // STEP 2: Already reserved / waitlisted (booked outside this system, or a retry after success)
    if (member?.reserved) {
      console.log('✅ Class already reserved')
      return { status: 'confirmed', alreadyBooked: true, selectedBranch: branchUsed }
    }
    if (member?.waitlisted) {
      console.log('✅ Already on waitlist')
      return { status: 'waitlisted', alreadyBooked: true, selectedBranch: branchUsed }
    }

    const isWaitlistMode =
      pageContentLower.includes('accepting spot in waitlist') ||
      pageContentLower.includes('reservation spots are full') ||
      pageContentLower.includes('can join waitlist')
    const windowNotOpen = /reservation window[^<]*will open/.test(pageContentLower)
    // Only claim "full" when the page says so (drives retries + "Retrying" badge)
    const pageSaysFull =
      pageContentLower.includes('fully booked') ||
      pageContentLower.includes('waitlist is full') ||
      pageContentLower.includes('filled to capacity')
    const reserveButton = await page.$('#reservation_button')
    const reserveDisabled = reserveButton
      ? await page.evaluate(el => (el as HTMLButtonElement).disabled, reserveButton)
      : true

    // STEP 3: Nothing to click. Window still closed, or full with no waitlist
    if (!member || member.disabled || !reserveButton) {
      if (windowNotOpen) {
        return {
          status: 'failed',
          errorMessage:
            "The YMCA hasn't opened sign-ups for this class yet, so it couldn't be booked.\n\nWhat to do: Check the class's booking window in your schedule settings. If it looks right, try booking manually through the YMCA website once sign-ups open.",
          selectedBranch: branchUsed,
        }
      }
      if (!member && !reserveButton) {
        return {
          status: 'failed',
          errorMessage:
            'No Reserve button found on the YMCA booking page.\n\nWhat to do: Try booking manually through the gym website.',
          selectedBranch: branchUsed,
        }
      }
      if (pageSaysFull) {
        console.log('⚠️  Page says the class is fully booked')
        return { status: 'failed', errorMessage: FULL_MESSAGE, selectedBranch: branchUsed }
      }
      const notice = await page
        .$eval('#reservation_details', el => (el.textContent || '').replace(/\s+/g, ' ').trim())
        .catch(() => '')
      // Notice text stays in the log only: page wording in errorMessage could
      // accidentally match email-routing keywords (e.g. "full" -> retry loop).
      console.log(`⚠️  Member selection disabled for an unrecognized reason. Page notice: "${notice}"`)
      return {
        status: 'failed',
        errorMessage:
          "The YMCA booking page didn't allow a reservation for this class.\n\nWhat to do: Try booking manually through the YMCA website or app.",
        selectedBranch: branchUsed,
      }
    }

    console.log(isWaitlistMode ? '⚠️  Class is FULL - joining WAITLIST' : '✓ Spots available - reserving')

    // STEP 4: Select the member and click Reserve
    const checkboxes = await page.$$('input.member_checkbox')
    if (!member.checked) {
      await checkboxes[memberIndex].click()
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (reserveDisabled) {
      // Some pages enable the button only after a member is ticked
      const stillDisabled = await page.evaluate(el => (el as HTMLButtonElement).disabled, reserveButton)
      if (stillDisabled) {
        console.log('⚠️  Reserve button still disabled after selecting member')
        if (pageSaysFull) {
          return { status: 'failed', errorMessage: FULL_MESSAGE, selectedBranch: branchUsed }
        }
        return {
          status: 'failed',
          errorMessage:
            "The YMCA booking page's Reserve button stayed disabled for this class.\n\nWhat to do: Try booking manually through the YMCA website or app.",
          selectedBranch: branchUsed,
        }
      }
    }

    page.once('dialog', async dialog => {
      console.log(`   Dialog: "${dialog.message()}"`)
      await dialog.dismiss()
    })

    console.log('Clicking Reserve...')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      reserveButton.click(),
    ])
    await new Promise(resolve => setTimeout(resolve, 2000))
    await takeScreenshot(page, '05-booking-result')

    // STEP 5: Read the result
    const finalUrl = page.url()
    const finalContent = (await page.content()).toLowerCase()
    const submitError = await page
      .$eval('#submit_error_message', el => ((el as HTMLElement).offsetParent !== null ? el.textContent || '' : ''))
      .catch(() => '')
    if (submitError.trim()) {
      console.log(`   Daxko error message: ${submitError.trim()}`)
    }
    const errorText = (submitError + ' ' + finalContent).toLowerCase()
    console.log(`   Final URL: ${finalUrl.split('?')[0]}`)

    if (
      errorText.includes('already have an existing reservation') ||
      errorText.includes('already have a reservation during this time') ||
      (errorText.includes('could not be completed') && errorText.includes('existing reservation'))
    ) {
      return { status: 'failed', errorMessage: CONFLICT_MESSAGE, selectedBranch: branchUsed }
    }

    if (
      errorText.includes('class has been cancelled') ||
      errorText.includes('class has been canceled') ||
      errorText.includes('cannot add exercisers')
    ) {
      return { status: 'failed', errorMessage: CANCELLED_MESSAGE, selectedBranch: branchUsed }
    }

    const isWaitlisted =
      finalContent.includes('now that you are in waitlist') ||
      finalContent.includes('you are in waitlist') ||
      finalContent.includes('added to waitlist') ||
      finalContent.includes('joined the waitlist')

    const isConfirmed =
      finalContent.includes('now that reservation is complete') ||
      finalContent.includes('reservation is complete') ||
      (finalContent.includes('awesome!') && !isWaitlisted)

    if (isWaitlisted) {
      console.log('✅ Successfully added to WAITLIST')
      return { status: 'waitlisted', selectedBranch: branchUsed }
    }
    if (isConfirmed) {
      console.log('✅ Successfully BOOKED class')
      return { status: 'confirmed', selectedBranch: branchUsed }
    }

    if (submitError.trim()) {
      if (/full|no (spots|capacity)|capacity reached/.test(submitError.toLowerCase())) {
        return { status: 'failed', errorMessage: FULL_MESSAGE, selectedBranch: branchUsed }
      }
      return { status: 'failed', errorMessage: SYSTEM_ERROR_MESSAGE, selectedBranch: branchUsed }
    }

    console.log('⚠️  Booking result unclear')
    return {
      status: 'failed',
      errorMessage:
        "Booking result unclear after clicking Reserve.\n\nWhat to do RIGHT NOW:\n1. Check your gym account to see if the class was booked\n2. If booked: Great! You're all set (ignore this error)\n3. If not booked: Try booking manually",
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
 * Wait for the booking window to open by refreshing the Daxko ChooseMembers page.
 * Called when we arrive early (before the booking window opens).
 * The page shows "The Reservation Window for Active Members will open on ..."
 * (member checkbox + Reserve disabled) until the window opens.
 */
async function waitForBookingWindow(
  page: Page,
  expectedBookingTime: number
): Promise<{ refreshCount: number }> {
  const now = Date.now()
  const msUntilOpen = expectedBookingTime - now

  // If window already passed, skip waiting
  if (msUntilOpen <= 0) {
    console.log('   Booking window already open, proceeding immediately')
    return { refreshCount: 0 }
  }

  console.log(`   Booking window opens in ${Math.round(msUntilOpen / 1000)}s`)

  // Sleep until 2s before the window opens
  const sleepMs = Math.max(0, msUntilOpen - 2000)
  if (sleepMs > 0) {
    console.log(`   Sleeping ${Math.round(sleepMs / 1000)}s until 2s before window...`)
    await new Promise(resolve => setTimeout(resolve, sleepMs))
  }

  // Tight refresh loop: reload every 2s, max 15 attempts
  // Uses domcontentloaded (not networkidle2): the window notice is server-rendered,
  // and completeDaxkoBooking waits for the Reserve button itself.
  const MAX_REFRESHES = 15
  const REFRESH_INTERVAL_MS = 2000

  for (let i = 1; i <= MAX_REFRESHES; i++) {
    console.log(`   Refresh ${i}/${MAX_REFRESHES}...`)
    await page.reload({ waitUntil: 'domcontentloaded' })

    // Check if the "Reservation Window ... will open" notice is gone
    const stillBlocked = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return /reservation window[\s\S]{0,80}will open/.test(text)
    })

    if (!stillBlocked) {
      console.log(`   Booking window is open after ${i} refresh(es)`)
      return { refreshCount: i }
    }

    if (i < MAX_REFRESHES) {
      await new Promise(resolve => setTimeout(resolve, REFRESH_INTERVAL_MS))
    }
  }

  // Exhausted refreshes - proceed anyway, completeDaxkoBooking handles gracefully
  console.log('   Max refreshes reached, proceeding anyway')
  return { refreshCount: MAX_REFRESHES }
}

/**
 * Book a class using the YMCA/GroupExPro flow
 *
 * Flow:
 * 1. Calculate target date in gym timezone
 * 2. Find class by name/time/branch in the GroupExPro schedule feed
 * 4. Stop early only if the feed says cancelled or no online registration.
 *    Full/waitlist are NOT decided here - the live class page decides (step 6).
 * 5. Open sign-up URL → redirects to Daxko 2-step login (email, then password)
 *    → Daxko GXP ChooseMembers page for the class
 * 5.5. Wait for booking window (early-start: sleep then refresh)
 * 6. Complete booking on the ChooseMembers page (select member → Reserve)
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

    // STEP 2-3: Find class in the GroupExPro schedule feed (no browser needed)
    console.log('\n🔍 Step 2: Finding class in schedule feed...')
    const searchResult = await findClassInGroupExFeed(targetDate, classType, classTime, branch)

    if (!searchResult.found) {
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage:
          searchResult.errorMessage ||
          `Class "${classType}" at ${formatClassTime12Hour(classTime)} not found on YMCA schedule.\n\nWhy this happens:\n• Class name doesn't match exactly (check for typos)\n• Wrong time, day, or branch selected\n• Gym no longer offers this class\n\nWhat to do:\n1. Go to your gym's website and find the exact class listing\n2. Update your class settings to match EXACTLY`,
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

    // NOTE: No 'full' early-return here. Even when the feed shows 0 spots or
    // "WAITLIST ONLY", we log in and let completeDaxkoBooking read the
    // live class page (spots / waitlist / full).

    if (searchResult.status === 'no_registration') {
      return {
        status: 'no_registration',
        branchUsed: branch,
        errorMessage: null,
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

    // STEP 5: Daxko login (via the GroupExPro sign-up URL redirect)
    console.log('\n🔐 Step 5: Logging into the YMCA (Daxko)...')
    const loginResult = await performDaxkoLogin(page, searchResult.registerUrl, username, password)

    if (!loginResult.success) {
      screenshotPath = await takeScreenshot(page, '03-daxko-login-failed')
      return {
        status: 'failed',
        branchUsed: branch,
        errorMessage: `Login failed: ${loginResult.error}\n\nWhat to do: Try logging into your gym website manually. If successful, update your credentials in Dashboard → Gym Credentials. If you can't log in, reset your password on the gym website first.`,
        screenshotPath,
      }
    }

    // STEP 5.5: Wait for booking window if we arrived early
    if (params.expectedBookingTime && params.expectedBookingTime > Date.now()) {
      console.log('\n⏳ Step 5.5: Waiting for booking window to open...')
      const waitResult = await waitForBookingWindow(page, params.expectedBookingTime)
      screenshotPath = await takeScreenshot(page, '04-after-wait')
      console.log(`   Total refreshes: ${waitResult.refreshCount}`)
    }

    // STEP 6: Complete booking on the Daxko ChooseMembers page
    console.log('\n📋 Step 6: Completing booking on Daxko...')
    const bookingResult = await completeDaxkoBooking(page, username, branch)

    screenshotPath = await takeScreenshot(page, '05-booking-result')

    return {
      status: bookingResult.status,
      branchUsed: bookingResult.selectedBranch,
      errorMessage: bookingResult.errorMessage || null,
      screenshotPath,
      alreadyBooked: bookingResult.alreadyBooked,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Booking error:', errorMessage)

    screenshotPath = await takeScreenshot(page, '99-error')

    return {
      status: 'failed',
      branchUsed: branch,
      errorMessage: `Something unexpected went wrong: ${errorMessage}\n\nThis might be a one-time glitch. The system will try again at the next scheduled time.\n\nIf this happens repeatedly (3+ times), please report the issue to help@beerock.com with the error details above.`,
      screenshotPath,
    }
  }
}

export type BookingResult = {
  status: 'confirmed' | 'waitlisted' | 'failed' | 'skipped' | 'no_registration'
  branchUsed: string | null
  errorMessage: string | null
  screenshotPath?: string
  alreadyBooked?: boolean
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
 * Flow: GroupExPro schedule feed -> sign-up URL -> Daxko login -> Daxko ChooseMembers -> Reserve
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
    // Schedule feed lookup → Daxko login → ChooseMembers page → Reserve
    const result = await bookClassYMCAHybrid(page, params)

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Booking error:', errorMessage)

    return {
      status: 'failed',
      branchUsed: null,
      errorMessage: `Something unexpected went wrong: ${errorMessage}\n\nThis might be a one-time glitch. The system will try again at the next scheduled time.\n\nIf this happens repeatedly (3+ times), please report the issue to help@beerock.com with the error details above.`,
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

