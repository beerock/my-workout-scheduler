/**
 * Check how the booking automation sees a class in the GroupExPro schedule feed.
 * Read-only: no browser, no login, no booking.
 *
 * The feed only decides `cancelled` and `no_registration`. Classes the feed
 * shows as full / waitlist-only still come back `available` with a sign-up
 * URL - the live GroupExPro class page decides those after login.
 *
 * Usage:
 *   npx tsx scripts/test-class-state-detection.ts <YYYY-MM-DD> <HH:MM> "<Branch>" "<Class name>"
 *   npx tsx scripts/test-class-state-detection.ts 2026-11-27 06:00 "Asheville YMCA" "BODYPUMP"
 */

import { findClassInGroupExFeed } from './booking-automation'

async function main() {
  const [targetDate, classTime, branch, classType] = process.argv.slice(2)

  if (!targetDate || !classTime || !branch || !classType) {
    console.error('Usage: npx tsx scripts/test-class-state-detection.ts <YYYY-MM-DD> <HH:MM> "<Branch>" "<Class name>"')
    process.exit(1)
  }

  const result = await findClassInGroupExFeed(targetDate, classType, classTime, branch)
  console.log('\nResult:', JSON.stringify(result, null, 2))
  process.exit(result.found ? 0 : 2)
}

main().catch(error => {
  console.error('[test-class-state-detection] Unexpected error:', error)
  process.exit(1)
})
