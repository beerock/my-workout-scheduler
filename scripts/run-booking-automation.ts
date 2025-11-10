/**
 * Main entry point for booking automation
 * Queries database for classes needing booking and executes Puppeteer automation
 * 
 * Run locally: npx tsx scripts/run-booking-automation.ts
 * Or via GitHub Actions workflow
 */

import * as dotenv from 'dotenv'
import {
  getClassesNeedingBooking,
  createBookingAttempt,
  updateBookingAttempt,
  clearSkipDate,
  type ClassNeedingBooking,
} from './database-helpers'
import { bookClass, type BookingParams } from './booking-automation'
import { decryptPassword } from '../lib/encryption'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Also check for direct env vars (for GitHub Actions)
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY environment variable is required')
  process.exit(1)
}

/**
 * Main automation function
 */
async function runBookingAutomation() {
  console.log('🚀 Starting booking automation...\n')
  console.log('='.repeat(60))

  const startTime = Date.now()
  const results = {
    total: 0,
    confirmed: 0,
    waitlisted: 0,
    failed: 0,
    skipped: 0,
    errors: 0,
  }

  try {
    // Get all classes needing booking
    console.log('📋 Querying database for classes needing booking...')
    const classesNeedingBooking = await getClassesNeedingBooking()
    results.total = classesNeedingBooking.length

    console.log(`✅ Found ${results.total} classes needing booking\n`)

    if (classesNeedingBooking.length === 0) {
      console.log('✨ No classes to book at this time.')
      console.log('='.repeat(60))
      console.log('✅ Automation complete (no action needed)')
      return { success: true, results }
    }

    // Group classes by user (to potentially reuse browser sessions)
    const classesByUser = groupClassesByUser(classesNeedingBooking)

    console.log(`👥 Processing ${classesByUser.size} user(s)...\n`)

    // Process each user's classes
    for (const [userId, classes] of classesByUser.entries()) {
      console.log(`\n${'─'.repeat(60)}`)
      console.log(`👤 User: ${userId} (${classes.length} class(es))`)
      console.log('─'.repeat(60))

      // Decrypt credentials once per user
      let decryptedPassword: string
      try {
        const firstClass = classes[0]
        decryptedPassword = decryptPassword(firstClass.encrypted_password)
      } catch (error) {
        console.error(`❌ Failed to decrypt password for user ${userId}:`, error)
        // Create failed attempts for all classes
        for (const classItem of classes) {
          await createBookingAttempt(
            classItem.id,
            'failed',
            null,
            `Password decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
          results.errors++
          results.failed++
        }
        continue
      }

      // Process each class for this user
      for (const classItem of classes) {
        console.log(`\n📅 Processing: ${classItem.class_type}`)
        console.log(`   Day: ${getDayName(classItem.day_of_week)}, Time: ${classItem.class_time}`)
        console.log(`   Branch: ${classItem.branch}`)

        // Check if we should skip today
        const today = new Date().toISOString().split('T')[0]
        if (classItem.next_skip_date === today) {
          console.log(`   ⏭️  Skipping (next_skip_date = today)`)
          
          // Create skipped attempt
          const attemptId = await createBookingAttempt(
            classItem.id,
            'skipped',
            null,
            `Skipped: next_skip_date equals today (${today})`
          )
          results.skipped++

          // Clear the skip date
          try {
            await clearSkipDate(classItem.id)
            console.log(`   ✅ Cleared skip date`)
          } catch (error) {
            console.error(`   ⚠️  Failed to clear skip date:`, error)
          }

          continue
        }

        // Create pending attempt
        let attemptId: string
        try {
          attemptId = await createBookingAttempt(classItem.id, 'pending', classItem.branch)
        } catch (error) {
          console.error(`   ❌ Failed to create booking attempt:`, error)
          results.errors++
          continue
        }

        // Prepare booking parameters
        const bookingParams: BookingParams = {
          gymUrl: classItem.gym_url,
          username: classItem.username,
          password: decryptedPassword,
          branch: classItem.branch,
          dayOfWeek: classItem.day_of_week,
          classTime: classItem.class_time,
          classType: classItem.class_type,
          nextSkipDate: classItem.next_skip_date,
        }

        // Execute booking
        try {
          console.log(`   🔄 Attempting booking...`)
          const bookingResult = await bookClass(bookingParams)

          // Update attempt with result
          await updateBookingAttempt(attemptId, {
            status: bookingResult.status,
            branch_used: bookingResult.branchUsed,
            error_message: bookingResult.errorMessage,
          })

          // Update results
          switch (bookingResult.status) {
            case 'confirmed':
              results.confirmed++
              console.log(`   ✅ Confirmed`)
              break
            case 'waitlisted':
              results.waitlisted++
              console.log(`   ⏳ Waitlisted`)
              break
            case 'failed':
              results.failed++
              console.log(`   ❌ Failed: ${bookingResult.errorMessage}`)
              break
            case 'skipped':
              results.skipped++
              console.log(`   ⏭️  Skipped: ${bookingResult.errorMessage}`)
              break
          }

          if (bookingResult.screenshotPath) {
            console.log(`   📸 Screenshot: ${bookingResult.screenshotPath}`)
          }
        } catch (error) {
          // Update attempt with error
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred'
          await updateBookingAttempt(attemptId, {
            status: 'failed',
            error_message: `Exception: ${errorMessage}`,
          })

          results.failed++
          results.errors++
          console.error(`   ❌ Booking exception:`, errorMessage)
        }

        // Small delay between bookings to avoid rate limiting
        await sleep(2000) // 2 seconds
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log('📊 Automation Summary')
    console.log('='.repeat(60))
    console.log(`Total classes processed: ${results.total}`)
    console.log(`✅ Confirmed: ${results.confirmed}`)
    console.log(`⏳ Waitlisted: ${results.waitlisted}`)
    console.log(`❌ Failed: ${results.failed}`)
    console.log(`⏭️  Skipped: ${results.skipped}`)
    console.log(`⚠️  Errors: ${results.errors}`)
    console.log(`⏱️  Duration: ${duration}s`)
    console.log('='.repeat(60))

    const hasErrors = results.errors > 0 || results.failed > 0
    return { success: !hasErrors, results }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('\n❌ Fatal error in automation:', errorMessage)
    console.error(error)
    return { success: false, results, error: errorMessage }
  }
}

/**
 * Group classes by user ID
 */
function groupClassesByUser(
  classes: ClassNeedingBooking[]
): Map<string, ClassNeedingBooking[]> {
  const grouped = new Map<string, ClassNeedingBooking[]>()

  for (const classItem of classes) {
    if (!grouped.has(classItem.user_id)) {
      grouped.set(classItem.user_id, [])
    }
    grouped.get(classItem.user_id)!.push(classItem)
  }

  return grouped
}

/**
 * Get day name from day of week number
 */
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || `Day ${dayOfWeek}`
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Run automation if executed directly
if (require.main === module) {
  runBookingAutomation()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Automation completed successfully')
        process.exit(0)
      } else {
        console.log('\n⚠️  Automation completed with errors')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error)
      process.exit(1)
    })
}

export { runBookingAutomation }

