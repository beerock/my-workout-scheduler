/**
 * Create Test Class
 *
 * Creates a test class in the database with a booking window that opens immediately,
 * then attempts to trigger the booking.
 *
 * Usage:
 *   npx tsx scripts/create-test-class.ts
 *
 * What it does:
 *   1. Creates a "Test Booking" class for tomorrow with booking window open NOW
 *   2. Attempts to trigger booking via localhost:3000 (will fail if server not running)
 *   3. Outputs the class ID for use with trigger-test-booking.ts
 *
 * After running:
 *   - Check Inngest dashboard for the booking run
 *   - Use trigger-test-booking.ts if localhost trigger failed
 *   - DELETE the test class after testing to avoid real booking attempts!
 *
 * Configuration:
 *   - Uses userId: a02ef692-1933-46b0-a77c-7258a577a5b5
 *   - Edit the userId below to test with a different user
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function main() {
  // Get current time in Eastern
  const now = new Date()
  const eastern = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'long',
  }).format(now)
  console.log(`Current time in Eastern: ${eastern}`)

  // Use specific test user
  const userId = 'a02ef692-1933-46b0-a77c-7258a577a5b5'

  // Get user's gym credentials
  const { data: credentials, error: credError } = await supabase
    .from('gym_credentials')
    .select('user_id, default_branch')
    .eq('user_id', userId)
    .single()

  if (credError || !credentials) {
    console.error('No gym credentials found for user:', credError)
    process.exit(1)
  }

  console.log(`Using user_id: ${userId}`)
  console.log(`Branch: ${credentials.default_branch}`)

  // Calculate class time that will trigger booking NOW
  // For a 26-hour window, we need class_time to be ~26 hours from now
  // Current: ~1:40 AM Monday → Class should be ~3:40 AM Tuesday
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  })
  const parts = formatter.formatToParts(now)
  const weekdayPart = parts.find(p => p.type === 'weekday')?.value || ''
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const todayDow = weekdayMap[weekdayPart] ?? 0

  // Target tomorrow
  const tomorrowDow = (todayDow + 1) % 7

  // Get current hour/minute in Eastern and add 26 hours
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const timeParts = timeFormatter.formatToParts(now)
  const hour = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0')

  // Class time = current time + 26 hours = current time + 2 hours (tomorrow)
  const classHour = (hour + 2) % 24
  const classTime = `${classHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

  console.log(`Creating test class for day ${tomorrowDow} at ${classTime}`)
  console.log(`Booking window (26h) should be open NOW`)

  // Create the test class
  const { data: newClass, error: insertError } = await supabase
    .from('recurring_classes')
    .insert({
      user_id: userId,
      day_of_week: tomorrowDow,
      class_time: classTime,
      class_type: 'Test Booking',
      branch: credentials.default_branch || 'Test Branch',
      booking_window_hours: 26,
      timezone: 'America/New_York',
      active: true,
    })
    .select()
    .single()

  if (insertError || !newClass) {
    console.error('Failed to create test class:', insertError)
    process.exit(1)
  }

  console.log(`\n✅ Created test class:`)
  console.log(`   ID: ${newClass.id}`)
  console.log(`   Day: ${tomorrowDow} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][tomorrowDow]})`)
  console.log(`   Time: ${classTime}`)
  console.log(`   Type: ${newClass.class_type}`)

  // Trigger booking via API
  const triggerUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  console.log(`\nTriggering booking via: ${triggerUrl}/api/trigger-booking`)

  const response = await fetch(`${triggerUrl}/api/trigger-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classId: newClass.id }),
  })

  const result = await response.json()
  console.log(`\nAPI Response:`, JSON.stringify(result, null, 2))

  if (response.ok) {
    console.log(`\n✅ Booking triggered! Check Inngest dashboard for the run.`)
  } else {
    console.log(`\n❌ Failed to trigger booking`)
  }

  console.log(`\nClass ID for cleanup: ${newClass.id}`)
}

main().catch(console.error)
