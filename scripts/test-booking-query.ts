/**
 * Quick test script to verify booking query logic
 * Run with: npx tsx scripts/test-booking-query.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testBookingQuery() {
  console.log('🧪 Testing Booking Query Logic\n')
  console.log('=' .repeat(50))
  
  // Get current date
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  console.log(`Current date: ${today}`)
  console.log(`Current time: ${now.toLocaleTimeString()}\n`)
  
  // Step 1: Get all active classes
  console.log('Step 1: Fetching active classes...')
  const { data: classes, error: classesError } = await supabase
    .from('recurring_classes')
    .select('*')
    .eq('active', true)
  
  if (classesError) {
    console.error('❌ Error fetching classes:', classesError)
    return
  }
  
  console.log(`✅ Found ${classes?.length || 0} active classes\n`)
  
  // Step 2: Get user settings (pause status)
  console.log('Step 2: Checking user pause settings...')
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, schedule_paused')
  
  if (settingsError) {
    console.error('❌ Error fetching settings:', settingsError)
    return
  }
  
  const pausedUsers = new Set(
    settings?.filter(s => s.schedule_paused).map(s => s.user_id) || []
  )
  console.log(`✅ Found ${pausedUsers.size} paused users\n`)
  
  // Step 3: Get gym credentials
  console.log('Step 3: Fetching gym credentials...')
  const { data: credentials, error: credsError } = await supabase
    .from('gym_credentials')
    .select('user_id, gym_url, username')
  
  if (credsError) {
    console.error('❌ Error fetching credentials:', credsError)
    return
  }
  
  const usersWithCreds = new Set(credentials?.map(c => c.user_id) || [])
  console.log(`✅ Found ${usersWithCreds.size} users with credentials\n`)
  
  // Step 4: Filter classes that need booking
  console.log('Step 4: Filtering classes that need booking...\n')
  console.log('Filtering criteria:')
  console.log('  - active = true')
  console.log('  - schedule_paused = false')
  console.log('  - skip_next_occurrence = false (skip logic handled by Inngest)')
  console.log('  - user has gym credentials\n')
  
  const classesNeedingBooking = classes?.filter(c => {
    // Check if user is paused
    if (pausedUsers.has(c.user_id)) {
      return false
    }
    
    // Check if user has credentials
    if (!usersWithCreds.has(c.user_id)) {
      return false
    }

    // Note: Skip logic is handled by Inngest (not here in getClassesNeedingBooking)
    // We don't filter by skip_next_occurrence here

    return true
  }) || []
  
  console.log(`✅ Found ${classesNeedingBooking.length} classes needing booking:\n`)
  
  if (classesNeedingBooking.length === 0) {
    console.log('   (No classes match criteria)')
  } else {
    classesNeedingBooking.forEach((c, i) => {
      const creds = credentials?.find(cred => cred.user_id === c.user_id)
      const skipInfo = c.skip_next_occurrence
        ? ` (skip next: ${c.skip_target_datetime || 'yes'})`
        : ''

      console.log(`   ${i + 1}. ${c.class_type}`)
      console.log(`      Day: ${c.day_of_week}, Time: ${c.class_time}`)
      console.log(`      Branch: ${c.branch}`)
      console.log(`      User: ${creds?.username || 'N/A'}${skipInfo}`)
      console.log()
    })
  }

  // Step 5: Test skip flag logic
  console.log('Step 5: Testing skip flag logic...\n')
  const classesWithSkipActive = classes?.filter(c => c.skip_next_occurrence === true) || []
  console.log(`Classes with skip_next_occurrence = true: ${classesWithSkipActive.length}`)

  if (classesWithSkipActive.length > 0) {
    classesWithSkipActive.forEach(c => {
      console.log(`  - ${c.class_type} (ID: ${c.id})`)
      console.log(`    Skip target: ${c.skip_target_datetime || 'Not set'}`)
    })
    console.log('\n✅ These classes should be SKIPPED by Inngest on next booking attempt')
  } else {
    console.log('  (No classes have skip flag set)')
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ Test complete!')
  console.log('\nIf all checks passed, you\'re ready to build automation.')
}

testBookingQuery().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})

