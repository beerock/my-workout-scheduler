/**
 * Test script for database-helpers.ts functions
 * Run with: npx tsx scripts/test-database-helpers.ts
 */

import * as dotenv from 'dotenv'
import { getClassesNeedingBooking } from './database-helpers'

dotenv.config({ path: '.env.local' })

async function testDatabaseHelpers() {
  console.log('🧪 Testing Database Helpers\n')
  console.log('='.repeat(60))

  try {
    console.log('📋 Testing getClassesNeedingBooking()...\n')
    const classes = await getClassesNeedingBooking()

    console.log(`✅ Found ${classes.length} classes needing booking\n`)

    if (classes.length === 0) {
      console.log('ℹ️  No classes need booking at this time.')
      console.log('   This could mean:')
      console.log('   - No active classes')
      console.log('   - All users are paused')
      console.log('   - Booking windows are not yet open')
      console.log('   - All classes have skip dates set for today')
    } else {
      console.log('Classes needing booking:')
      classes.forEach((c, i) => {
        console.log(`\n${i + 1}. ${c.class_type}`)
        console.log(`   Class ID: ${c.id}  ← Use this for testing!`)
        console.log(`   User ID: ${c.user_id}`)
        console.log(`   Day: ${getDayName(c.day_of_week)}, Time: ${c.class_time}`)
        console.log(`   Branch: ${c.branch}`)
        console.log(`   Booking Window: ${c.booking_window_hours} hours`)
        console.log(`   Timezone: ${c.timezone}`)
        console.log(`   Skip Date: ${c.next_skip_date || 'None'}`)
        console.log(`   Gym URL: ${c.gym_url}`)
        console.log(`   Username: ${c.username}`)
        console.log(`   Has Encrypted Password: ${c.encrypted_password ? 'Yes' : 'No'}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Test complete!')
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

testDatabaseHelpers()

