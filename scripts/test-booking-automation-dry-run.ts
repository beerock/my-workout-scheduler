/**
 * Dry-run test for booking automation
 * Tests the full flow without actually booking classes
 * Run with: npx tsx scripts/test-booking-automation-dry-run.ts
 */

import * as dotenv from 'dotenv'
import {
  getClassesNeedingBooking,
  type ClassNeedingBooking,
} from './database-helpers'
import { decryptPassword } from '../lib/encryption'

dotenv.config({ path: '.env.local' })

async function testDryRun() {
  console.log('🧪 Booking Automation Dry-Run Test\n')
  console.log('='.repeat(60))
  console.log('⚠️  This is a DRY RUN - no actual bookings will be made\n')

  try {
    // Get classes needing booking
    console.log('📋 Step 1: Querying database...')
    const classes = await getClassesNeedingBooking()
    console.log(`✅ Found ${classes.length} classes needing booking\n`)

    if (classes.length === 0) {
      console.log('✨ No classes to process.')
      return
    }

    // Group by user
    const classesByUser = groupClassesByUser(classes)
    console.log(`👥 Step 2: Grouped into ${classesByUser.size} user(s)\n`)

    // Process each user
    for (const [userId, userClasses] of classesByUser.entries()) {
      console.log(`\n${'─'.repeat(60)}`)
      console.log(`👤 User: ${userId}`)
      console.log(`   Classes: ${userClasses.length}`)
      console.log('─'.repeat(60))

      // Test password decryption
      const firstClass = userClasses[0]
      try {
        console.log(`\n🔐 Testing password decryption...`)
        const password = decryptPassword(firstClass.encrypted_password)
        console.log(`✅ Password decrypted successfully (length: ${password.length} chars)`)
        console.log(`   Username: ${firstClass.username}`)
        console.log(`   Gym URL: ${firstClass.gym_url}`)
      } catch (error) {
        console.error(`❌ Password decryption failed:`, error)
        continue
      }

      // Simulate booking process for each class
      for (const classItem of userClasses) {
        console.log(`\n📅 Class: ${classItem.class_type}`)
        console.log(`   Day: ${getDayName(classItem.day_of_week)}, Time: ${classItem.class_time}`)
        console.log(`   Branch: ${classItem.branch}`)
        console.log(`   Skip Next: ${classItem.skip_next_occurrence ? 'YES' : 'No'}`)
        console.log(`   Skip Target: ${classItem.skip_target_datetime || 'None'}`)

        // Check skip flag (handled by Inngest in production)
        if (classItem.skip_next_occurrence === true) {
          console.log(`   ⏭️  Would SKIP (skip_next_occurrence = true)`)
          console.log(`   ✅ Inngest would clear skip flag after skip`)
          continue
        }

        // Simulate booking attempt
        console.log(`   🔄 Would attempt booking:`)
        console.log(`      - Navigate to: ${classItem.gym_url}`)
        console.log(`      - Login as: ${classItem.username}`)
        console.log(`      - Select branch: ${classItem.branch}`)
        console.log(`      - Find class: ${classItem.class_type} at ${classItem.class_time}`)
        console.log(`      - Click booking button`)
        console.log(`      - Record result in database`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Dry-run complete!')
    console.log('\nNext steps:')
    console.log('1. Review the classes above')
    console.log('2. Verify credentials are correct')
    console.log('3. Test with real booking: npx tsx scripts/run-booking-automation.ts')
    console.log('   (Make sure to test with a class you can safely book/cancel)')
  } catch (error) {
    console.error('\n❌ Dry-run failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

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

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || `Day ${dayOfWeek}`
}

testDryRun()

