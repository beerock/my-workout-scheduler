/**
 * Trigger Test Booking
 *
 * Sends a booking/attempt event directly to Inngest cloud for any class.
 * Works without local server running.
 *
 * Usage:
 *   npx tsx scripts/trigger-test-booking.ts <class-id>
 *
 * Example:
 *   npx tsx scripts/trigger-test-booking.ts b57a4fcd-2afa-4d79-a308-f9019969efae
 *
 * What it does:
 *   1. Fetches class data from database
 *   2. Calculates the classDate (for cancelOn matching)
 *   3. Sends booking/attempt event directly to Inngest cloud
 *
 * After running:
 *   - Check Inngest dashboard for the booking run
 *   - Run should transition from "Queued" to "Running"
 *   - GitHub Actions workflow should be triggered
 *
 * Use cases:
 *   - Test booking flow without waiting for scheduler
 *   - Debug Inngest connectivity issues
 *   - Manually retry a failed booking
 */

import * as dotenv from 'dotenv'
import { Inngest } from 'inngest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'
import { calculateNextClassDate } from '../lib/inngest/scheduler'

dotenv.config({ path: '.env.local' })

const classId = process.argv[2]

if (!classId) {
  console.error('Usage: npx tsx scripts/trigger-test-booking.ts <class-id>')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const inngestEventKey = process.env.INNGEST_EVENT_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
const inngest = new Inngest({
  id: 'my-workout-scheduler',
  eventKey: inngestEventKey,
})

async function main() {
  // Get class data
  const { data: classData, error } = await supabase
    .from('recurring_classes')
    .select('*')
    .eq('id', classId)
    .single()

  if (error || !classData) {
    console.error('Class not found:', error)
    process.exit(1)
  }

  console.log(`Found class:`)
  console.log(`  ID: ${classData.id}`)
  console.log(`  Type: ${classData.class_type}`)
  console.log(`  Day: ${classData.day_of_week}`)
  console.log(`  Time: ${classData.class_time}`)
  console.log(`  Timezone: ${classData.timezone}`)

  // Calculate classDate
  const classDate = calculateNextClassDate(
    classData.day_of_week,
    classData.class_time,
    classData.timezone
  )

  console.log(`  ClassDate: ${classDate}`)

  // Send booking event
  console.log(`\nSending booking/attempt event to Inngest...`)

  const eventId = `test-book-${classId}-${classDate}-${Date.now()}`

  await inngest.send({
    name: 'booking/attempt',
    id: eventId,
    data: {
      classId,
      className: classData.class_type,
      classDate,
      attemptNumber: 1,
    },
  })

  console.log(`✅ Event sent!`)
  console.log(`   Event ID: ${eventId}`)
  console.log(`\nCheck Inngest dashboard for the run.`)
}

main().catch(console.error)
