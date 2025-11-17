/**
 * Test script for booking a single class
 * Useful for testing and debugging before running full automation
 * 
 * Usage:
 *   npx tsx scripts/test-single-booking.ts <class-id>
 *   npx tsx scripts/test-single-booking.ts <class-id> --dry-run
 *   npx tsx scripts/test-single-booking.ts <class-id> --headless=false
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'
import { decryptPassword } from '../lib/encryption'
import { bookClass, type BookingParams } from './booking-automation'
import { createBookingAttempt, updateBookingAttempt } from './database-helpers'
import { inngest } from '../lib/inngest/client'

dotenv.config({ path: '.env.local' })

// Detect production environment (GitHub Actions)
const IS_PRODUCTION = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

// Logging utility - verbose in dev, concise in production
const log = {
  // Always shown (errors and critical info)
  error: (...args: any[]) => console.error(...args),
  success: (...args: any[]) => console.log(...args),

  // Only shown in development
  info: (...args: any[]) => !IS_PRODUCTION && console.log(...args),
  debug: (...args: any[]) => !IS_PRODUCTION && console.log(...args),
}

// Parse command line arguments
const args = process.argv.slice(2)
const classId = args.find(arg => !arg.startsWith('--'))
const isDryRun = args.includes('--dry-run')
const headlessArg = args.find(arg => arg.startsWith('--headless='))
const headless = headlessArg ? headlessArg.split('=')[1] !== 'false' : true

if (!classId) {
  console.error('❌ Error: Class ID is required')
  console.error('\nUsage:')
  console.error('  npx tsx scripts/test-single-booking.ts <class-id>')
  console.error('  npx tsx scripts/test-single-booking.ts <class-id> --dry-run')
  console.error('  npx tsx scripts/test-single-booking.ts <class-id> --headless=false')
  console.error('\nTo find a class ID, check your database or run:')
  console.error('  npm run test:database-helpers')
  process.exit(1)
}

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function testSingleBooking() {
  log.info('🧪 Testing Single Class Booking\n')
  log.info('='.repeat(60))
  log.info(`Class ID: ${classId}`)
  log.info(`Mode: ${isDryRun ? 'DRY RUN (no actual booking)' : 'LIVE (will make real booking)'}`)
  log.info(`Headless: ${headless ? 'Yes' : 'No (browser visible)'}`)
  log.info('='.repeat(60) + '\n')

  let attemptId: string | undefined

  try {
    // Fetch the class
    log.debug('📋 Fetching class from database...')
    const { data: classData, error: classError } = await supabase
      .from('recurring_classes')
      .select('*')
      .eq('id', classId!)
      .single() as { data: Database['public']['Tables']['recurring_classes']['Row'] | null, error: any }

    if (classError || !classData) {
      log.error('❌ Class not found:', classError?.message || 'No data')
      process.exit(1)
    }

    log.success(`✅ Booking: ${classData.class_type} - ${getDayName(classData.day_of_week)} ${classData.class_time} @ ${classData.branch}`)
    log.debug(`   Active: ${classData.active}`)
    log.debug(`   Skip Date: ${classData.next_skip_date || 'None'}\n`)

    if (!classData.active) {
      log.error('❌ Class is not active. Enable it in the dashboard first.')
      process.exit(1)
    }

    // Check user settings
    log.debug('👤 Checking user settings...')
    const { data: settings } = await supabase
      .from('user_settings')
      .select('schedule_paused')
      .eq('user_id', classData.user_id)
      .single() as { data: {schedule_paused: boolean} | null, error: any }

    if (settings?.schedule_paused) {
      log.error('❌ User schedule is paused. Unpause in the dashboard first.')
      process.exit(1)
    }

    // Get gym credentials
    log.debug('🔐 Fetching gym credentials...')
    const { data: credentials, error: credsError } = await supabase
      .from('gym_credentials')
      .select('gym_url, username, encrypted_password, default_branch')
      .eq('user_id', classData.user_id)
      .single() as { data: {gym_url: string, username: string, encrypted_password: string, default_branch: string | null} | null, error: any }

    if (credsError || !credentials) {
      log.error('❌ Credentials not found:', credsError?.message || 'No data')
      process.exit(1)
    }

    log.debug(`✅ Found credentials for: ${credentials.username}`)
    log.debug(`   Gym URL: ${credentials.gym_url}\n`)

    // Decrypt password
    let password: string
    try {
      password = decryptPassword(credentials.encrypted_password)
      log.debug('✅ Password decrypted successfully\n')
    } catch (error) {
      log.error('❌ Password decryption failed:', error)
      process.exit(1)
    }

    // Prepare booking parameters
    const bookingParams: BookingParams = {
      gymUrl: credentials.gym_url,
      username: credentials.username,
      password,
      branch: classData.branch,
      dayOfWeek: classData.day_of_week,
      classTime: classData.class_time,
      classType: classData.class_type,
      timezone: classData.timezone,
      nextSkipDate: classData.next_skip_date,
    }

    if (isDryRun) {
      log.info('⚠️  DRY RUN MODE - No actual booking will be made\n')
      log.info('Would attempt to:')
      log.info(`  1. Navigate to: ${bookingParams.gymUrl}`)
      log.info(`  2. Login as: ${bookingParams.username}`)
      log.info(`  3. Select branch: ${bookingParams.branch}`)
      log.info(`  4. Find class: ${bookingParams.classType} at ${bookingParams.classTime}`)
      log.info(`  5. Click booking button`)
      log.success('\n✅ Dry-run complete!')
      log.info('\nTo make a real booking, run without --dry-run flag:')
      log.info(`  npx tsx scripts/test-single-booking.ts ${classId}`)
      return
    }

    // Create booking attempt record
    log.debug('📝 Creating booking attempt record...')
    try {
      attemptId = await createBookingAttempt(classId!, 'pending', classData.branch)
      log.debug(`✅ Created attempt record: ${attemptId}\n`)
    } catch (error) {
      log.error('❌ Failed to create attempt record:', error)
      process.exit(1)
    }

    // Modify booking function to use non-headless if requested
    if (!headless) {
      log.info('👀 Running in non-headless mode (browser will be visible)\n')
    }

    // Execute booking
    log.debug('🚀 Starting booking process...\n')
    log.debug('⚠️  WARNING: This will make a REAL booking on the gym website!\n')

    // Set environment variable to control headless mode
    if (!headless) {
      process.env.PUPPETEER_HEADLESS = 'false'
    } else {
      delete process.env.PUPPETEER_HEADLESS
    }

    // Keep browser open for inspection (only in local development, not in CI)
    if (!IS_PRODUCTION && !headless) {
      process.env.KEEP_BROWSER_OPEN = 'true'
      log.info('🔍 Browser will remain open for inspection after booking\n')
    }

    const bookingResult = await bookClass(bookingParams)

    // Update attempt record
    log.debug('\n📝 Updating booking attempt record...')
    await updateBookingAttempt(attemptId, {
      status: bookingResult.status,
      branch_used: bookingResult.branchUsed,
      error_message: bookingResult.errorMessage,
    })

    // Send result event back to Inngest (for retry orchestration)
    if (process.env.INNGEST_EVENT_KEY) {
      log.success('📤 Sending result event to Inngest...')
      try {
        await inngest.send({
          name: 'booking/result',
          data: {
            attemptId,
            classId: classId!,
            status: bookingResult.status,
            branchUsed: bookingResult.branchUsed,
            errorMessage: bookingResult.errorMessage,
          },
        })
        log.success('✅ Result event sent to Inngest')
      } catch (error) {
        log.error('⚠️  Failed to send result event to Inngest:', error)
        // Don't fail the entire booking if event sending fails
      }
    } else {
      log.error('⚠️  INNGEST_EVENT_KEY not set - cannot send result to Inngest')
    }

    // Display results (always show in production)
    log.success('\n' + '='.repeat(60))
    log.success('📊 Booking Result')
    log.success('='.repeat(60))
    log.success(`Status: ${bookingResult.status.toUpperCase()}`)
    log.success(`Branch: ${bookingResult.branchUsed || 'N/A'}`)
    if (bookingResult.errorMessage) {
      log.error(`Error: ${bookingResult.errorMessage}`)
    }
    if (bookingResult.screenshotPath) {
      log.info(`Screenshot: ${bookingResult.screenshotPath}`)
    }
    log.success('='.repeat(60))

    if (bookingResult.status === 'confirmed') {
      log.success('\n✅ Booking confirmed!')
    } else if (bookingResult.status === 'waitlisted') {
      log.success('\n⏳ Added to waitlist.')
    } else if (bookingResult.status === 'failed') {
      log.error('\n❌ Booking failed.')
      if (bookingResult.screenshotPath) {
        log.error(`   Screenshot saved: ${bookingResult.screenshotPath}`)
      }
    }

    log.info('\n💡 Tip: Check the booking_attempts table in Supabase to see the full record.')

    // Exit cleanly in production to avoid waiting for connection pools to drain
    if (IS_PRODUCTION) {
      process.exit(0)
    }
  } catch (error) {
    log.error('\n❌ Test failed:', error)
    if (error instanceof Error) {
      log.error('Error message:', error.message)
      log.debug('Stack:', error.stack)
    }

    // Send failure event to Inngest if we have the attempt ID
    if (process.env.INNGEST_EVENT_KEY && typeof attemptId !== 'undefined') {
      try {
        await inngest.send({
          name: 'booking/result',
          data: {
            attemptId,
            classId: classId!,
            status: 'failed' as const,
            branchUsed: null,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        })
      } catch (inngestError) {
        log.error('⚠️  Failed to send failure event to Inngest:', inngestError)
      }
    }

    process.exit(1)
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || `Day ${dayOfWeek}`
}

testSingleBooking()

