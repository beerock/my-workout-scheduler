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

dotenv.config({ path: '.env.local' })

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
  console.log('🧪 Testing Single Class Booking\n')
  console.log('='.repeat(60))
  console.log(`Class ID: ${classId}`)
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no actual booking)' : 'LIVE (will make real booking)'}`)
  console.log(`Headless: ${headless ? 'Yes' : 'No (browser visible)'}`)
  console.log('='.repeat(60) + '\n')

  try {
    // Fetch the class
    console.log('📋 Fetching class from database...')
    const { data: classData, error: classError } = await supabase
      .from('recurring_classes')
      .select('*')
      .eq('id', classId!)
      .single() as { data: Database['public']['Tables']['recurring_classes']['Row'] | null, error: any }

    if (classError || !classData) {
      console.error('❌ Class not found:', classError?.message || 'No data')
      process.exit(1)
    }

    console.log(`✅ Found class: ${classData.class_type}`)
    console.log(`   Day: ${getDayName(classData.day_of_week)}, Time: ${classData.class_time}`)
    console.log(`   Branch: ${classData.branch}`)
    console.log(`   Active: ${classData.active}`)
    console.log(`   Skip Date: ${classData.next_skip_date || 'None'}\n`)

    if (!classData.active) {
      console.error('❌ Class is not active. Enable it in the dashboard first.')
      process.exit(1)
    }

    // Check user settings
    console.log('👤 Checking user settings...')
    const { data: settings } = await supabase
      .from('user_settings')
      .select('schedule_paused')
      .eq('user_id', classData.user_id)
      .single() as { data: {schedule_paused: boolean} | null, error: any }

    if (settings?.schedule_paused) {
      console.error('❌ User schedule is paused. Unpause in the dashboard first.')
      process.exit(1)
    }

    // Get gym credentials
    console.log('🔐 Fetching gym credentials...')
    const { data: credentials, error: credsError } = await supabase
      .from('gym_credentials')
      .select('gym_url, username, encrypted_password, default_branch')
      .eq('user_id', classData.user_id)
      .single() as { data: {gym_url: string, username: string, encrypted_password: string, default_branch: string | null} | null, error: any }

    if (credsError || !credentials) {
      console.error('❌ Credentials not found:', credsError?.message || 'No data')
      process.exit(1)
    }

    console.log(`✅ Found credentials for: ${credentials.username}`)
    console.log(`   Gym URL: ${credentials.gym_url}\n`)

    // Decrypt password
    let password: string
    try {
      password = decryptPassword(credentials.encrypted_password)
      console.log('✅ Password decrypted successfully\n')
    } catch (error) {
      console.error('❌ Password decryption failed:', error)
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
      console.log('⚠️  DRY RUN MODE - No actual booking will be made\n')
      console.log('Would attempt to:')
      console.log(`  1. Navigate to: ${bookingParams.gymUrl}`)
      console.log(`  2. Login as: ${bookingParams.username}`)
      console.log(`  3. Select branch: ${bookingParams.branch}`)
      console.log(`  4. Find class: ${bookingParams.classType} at ${bookingParams.classTime}`)
      console.log(`  5. Click booking button`)
      console.log('\n✅ Dry-run complete!')
      console.log('\nTo make a real booking, run without --dry-run flag:')
      console.log(`  npx tsx scripts/test-single-booking.ts ${classId}`)
      return
    }

    // Create booking attempt record
    console.log('📝 Creating booking attempt record...')
    let attemptId: string
    try {
      attemptId = await createBookingAttempt(classId!, 'pending', classData.branch)
      console.log(`✅ Created attempt record: ${attemptId}\n`)
    } catch (error) {
      console.error('❌ Failed to create attempt record:', error)
      process.exit(1)
    }

    // Modify booking function to use non-headless if requested
    if (!headless) {
      console.log('👀 Running in non-headless mode (browser will be visible)\n')
      // We'll need to modify the bookClass function call
      // For now, we'll create a wrapper that modifies the launch options
    }

    // Execute booking
    console.log('🚀 Starting booking process...\n')
    console.log('⚠️  WARNING: This will make a REAL booking on the gym website!\n')

    // Set environment variable to control headless mode
    if (!headless) {
      process.env.PUPPETEER_HEADLESS = 'false'
    } else {
      delete process.env.PUPPETEER_HEADLESS
    }

    // Keep browser open for inspection
    process.env.KEEP_BROWSER_OPEN = 'true'

    const bookingResult = await bookClass(bookingParams)

    // Update attempt record
    console.log('\n📝 Updating booking attempt record...')
    await updateBookingAttempt(attemptId, {
      status: bookingResult.status,
      branch_used: bookingResult.branchUsed,
      error_message: bookingResult.errorMessage,
    })

    // Display results
    console.log('\n' + '='.repeat(60))
    console.log('📊 Booking Result')
    console.log('='.repeat(60))
    console.log(`Status: ${bookingResult.status.toUpperCase()}`)
    console.log(`Branch Used: ${bookingResult.branchUsed || 'N/A'}`)
    if (bookingResult.errorMessage) {
      console.log(`Error: ${bookingResult.errorMessage}`)
    }
    if (bookingResult.screenshotPath) {
      console.log(`Screenshot: ${bookingResult.screenshotPath}`)
    }
    console.log('='.repeat(60))

    if (bookingResult.status === 'confirmed') {
      console.log('\n✅ Booking confirmed! Check the gym website to verify.')
    } else if (bookingResult.status === 'waitlisted') {
      console.log('\n⏳ Added to waitlist. You\'ll be notified if a spot opens.')
    } else if (bookingResult.status === 'failed') {
      console.log('\n❌ Booking failed. Check the error message and screenshot above.')
      console.log('   Review the screenshot to see what went wrong.')
    }

    console.log('\n💡 Tip: Check the booking_attempts table in Supabase to see the full record.')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || `Day ${dayOfWeek}`
}

testSingleBooking()

