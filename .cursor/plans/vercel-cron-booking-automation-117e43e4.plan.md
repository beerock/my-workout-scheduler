<!-- 117e43e4-44af-4fb3-a427-fbce609d505f ee00e8e3-0b85-4e66-b70d-70cb61569b79 -->
# Trigger-Based Parallel Booking Architecture Implementation

## Overview

Replace the current 15-minute polling approach with an event-driven trigger system that:

- Uses Supabase pg_cron to schedule triggers at exact booking window open times
- Triggers GitHub Actions workflows via webhook only when needed
- Processes multiple users in parallel within the same workflow
- Stays within GitHub Actions free tier (2,000 minutes/month)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Supabase Database (pg_cron)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Scheduled Jobs (pg_cron)                                │
│  ├─ One job per unique booking window time              │
│  ├─ Calculates: class_datetime - booking_window_hours   │
│  └─ Calls webhook when booking window opens             │
│                                                          │
└─────────────────────────────────────────────────────────┘
                        ↓ (webhook)
┌─────────────────────────────────────────────────────────┐
│              GitHub Actions Workflow                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Triggered by Webhook                                    │
│  ├─ Queries Supabase: "All classes with booking        │
│  │   window open NOW"                                    │
│  ├─ Groups classes by user                               │
│  └─ Processes users in PARALLEL:                         │
│      ├─ User 1: Puppeteer → Book class                 │
│      ├─ User 2: Puppeteer → Book class                 │
│      └─ (Both run simultaneously)                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Database Functions & Scheduling Logic

**1.1 Create Function to Calculate Next Booking Window Times**

- File: `supabase/migrations/002_booking_window_scheduler.sql`
- Function: `calculate_next_booking_window(class_id)`
- Returns: Next booking window open datetime for a class
- Uses existing `getNextClassDate()` logic from `scripts/database-helpers.ts`

**1.2 Create Function to Schedule Booking Triggers**

- File: `supabase/migrations/002_booking_window_scheduler.sql`
- Function: `schedule_booking_trigger(class_id)`
- Uses pg_cron to schedule webhook call at booking window open time
- Job name format: `booking_trigger_{class_id}_{timestamp}`

**1.3 Create Function to Unschedule Triggers**

- File: `supabase/migrations/002_booking_window_scheduler.sql`
- Function: `unschedule_booking_trigger(class_id)`
- Removes pg_cron job when class is deleted or deactivated

**1.4 Create Webhook Endpoint Function**

- File: `supabase/migrations/002_booking_window_scheduler.sql`
- Function: `trigger_github_actions_webhook()`
- Calls GitHub Actions API to trigger workflow
- Uses GitHub Personal Access Token (stored in Supabase secrets)

### Phase 2: Update Application Code

**2.1 Add Function to Calculate Next Booking Window**

- File: `lib/date-utils.ts`
- Function: `calculateNextBookingWindowOpen(dayOfWeek, classTime, bookingWindowHours, timezone)`
- Returns: Date object for next booking window open time
- Reuses logic from `scripts/database-helpers.ts`

**2.2 Update Class Creation/Update Logic**

- Files: `app/actions/recurring-classes.ts` or relevant form handler
- On class create/update:
  - Calculate next booking window open time
  - Call Supabase function to schedule trigger
- On class delete/deactivate:
  - Call Supabase function to unschedule trigger

**2.3 Implement Parallel Processing**

- File: `scripts/run-booking-automation.ts`
- Replace sequential `for` loop with `Promise.all()`
- Process all users simultaneously
- Maintain error handling per user

**2.4 Update GitHub Actions Workflow**

- File: `.github/workflows/booking-automation.yml`
- Add `repository_dispatch` trigger for webhook calls
- Keep `workflow_dispatch` for manual testing
- Remove or comment out `schedule` cron (no longer needed)

### Phase 3: Webhook Integration

**3.1 Create GitHub Personal Access Token**

- Token with `workflow` scope
- Store in Supabase secrets (via Supabase dashboard)
- Used by pg_cron to trigger GitHub Actions

**3.2 Create GitHub Actions Webhook Endpoint**

- GitHub Actions supports `repository_dispatch` event
- Webhook payload includes booking window timestamp
- Workflow queries database for classes with open windows

**3.3 Test Webhook Trigger**

- Manual test: Call GitHub API to trigger workflow
- Verify workflow receives event and processes bookings

### Phase 4: Migration & Cleanup

**4.1 Database Migration**

- Run migration to create pg_cron functions
- Enable pg_cron extension if not already enabled
- Test functions with sample data

**4.2 Schedule Existing Classes**

- Script: `scripts/schedule-existing-classes.ts`
- One-time script to schedule triggers for all active classes
- Calculates next booking window for each class
- Creates pg_cron jobs

**4.3 Update Documentation**

- Update `docs/ARCHITECTURE_PROPOSAL.md` with new architecture
- Update `docs/My Workout Scheduler PRD.md` with trigger-based approach
- Document how to enable/disable triggers

## Key Files to Modify

1. **New Files:**

   - `supabase/migrations/002_booking_window_scheduler.sql` - Database functions
   - `scripts/schedule-existing-classes.ts` - One-time migration script
   - `lib/booking-window-scheduler.ts` - Helper functions for scheduling

2. **Modified Files:**

   - `scripts/run-booking-automation.ts` - Parallel processing
   - `.github/workflows/booking-automation.yml` - Webhook trigger
   - `app/actions/recurring-classes.ts` - Schedule triggers on create/update
   - `lib/date-utils.ts` - Add booking window calculation function
   - `docs/ARCHITECTURE_PROPOSAL.md` - Update architecture
   - `docs/My Workout Scheduler PRD.md` - Update automation approach

## Cost Analysis

**Monthly Usage (2 users, 6 classes/week):**

- Booking windows: 24/month
- Workflow runs: 24/month (one per booking window)
- Time per run: 2-6 minutes (parallel processing + retries)
- Total minutes: 48-144 minutes/month
- Free tier: 2,000 minutes/month
- **Usage: 2.4% - 7.2% of free tier** ✅

## Testing Strategy

1. **Unit Tests:**

   - Test booking window calculation logic
   - Test parallel processing with mock data

2. **Integration Tests:**

   - Test pg_cron job creation/deletion
   - Test webhook trigger to GitHub Actions
   - Test parallel Puppeteer execution

3. **End-to-End Tests:**

   - Create test class → Verify trigger scheduled
   - Wait for trigger → Verify workflow runs
   - Verify both users booked in parallel

## Rollback Plan

If issues arise:

1. Re-enable cron schedule in GitHub Actions workflow
2. Disable pg_cron jobs (set active = false)
3. System falls back to 15-minute polling

## Success Criteria

- ✅ Triggers fire at exact booking window open times
- ✅ Multiple users processed in parallel
- ✅ Both users can book before classes fill (3-minute window)
- ✅ Stays within GitHub Actions free tier
- ✅ Existing retry logic still works
- ✅ No missed bookings due to timing gaps

### To-dos

- [ ] Create Supabase migration with pg_cron functions: calculate_next_booking_window(), schedule_booking_trigger(), unschedule_booking_trigger(), trigger_github_actions_webhook()
- [ ] Add calculateNextBookingWindowOpen() function to lib/date-utils.ts that calculates next booking window open time for a recurring class
- [ ] Update scripts/run-booking-automation.ts to process users in parallel using Promise.all() instead of sequential for loop
- [ ] Update .github/workflows/booking-automation.yml to accept repository_dispatch event for webhook triggers, remove schedule cron
- [ ] Update class create/update/delete handlers to schedule/unschedule pg_cron triggers via Supabase functions
- [ ] Create scripts/schedule-existing-classes.ts one-time script to schedule triggers for all existing active classes
- [ ] Set up GitHub Personal Access Token with workflow scope and store in Supabase secrets for webhook calls
- [ ] Test webhook trigger manually to verify GitHub Actions workflow receives event and processes bookings
- [ ] Update docs/ARCHITECTURE_PROPOSAL.md and docs/My Workout Scheduler PRD.md to reflect trigger-based architecture with parallel processing