# CLAUDE.md

**Project Context Guide for Claude Code**

This document provides Claude with essential context about the My Workout Scheduler project to enable effective assistance with development, debugging, and feature implementation.

---

## Project Overview

**My Workout Scheduler** is a web application that automates class reservations for recurring fitness sessions at YMCA gyms. It eliminates manual booking by using browser automation to reserve classes the instant registration opens.

**Primary Use Case:** Users configure their recurring gym classes (e.g., "Monday 4:15 PM BODYPUMP @ Downtown YMCA") and the system automatically books them when the registration window opens (typically 26 hours before class time).

**MVP Scope:** 5 users, 2-5 classes per user, 100% free tier services

**Recent Updates (v2.7):**
- **Enhanced class status detection** (6 states: available, window not open, reserved, full, cancelled, not reservable)
- **Duplicate booking prevention** with idempotency keys and pending attempt checks
- **Smart retry logic**: Only retries temporary failures (class full), not permanent ones (cancelled, not reservable)
- Case-insensitive pill/badge detection for "Class Full", "Cancelled", "Not Reservable"
- Defensive pre-click check for race conditions
- Inngest-level deduplication for retry events (`book-retry-{classId}-{date}-{attempt}`)

**Previous Updates (v2.0):**
- **Migrated to Inngest event-driven architecture** (from GitHub Actions cron)
- Precise timing: triggers at exact booking window times (no polling)
- Intelligent retry logic: clock drift (12×15s) and class full (15min intervals)
- Daily scheduler (midnight UTC) ensures all classes are scheduled
- FREE infrastructure (eliminated $4-8/month GitHub Actions cost)
- Fixed timezone-related bugs in booking window and reset logic
- Centralized all date/time utilities in `lib/date-utils.ts`
- Refactored form submissions to use Next.js Server Actions

---

## Tech Stack

- **Frontend/Backend:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + built-in auth)
- **Automation:** Inngest (event-driven orchestration) + Puppeteer (headless Chrome)
- **Date/Time:** date-fns and date-fns-tz for timezone handling
- **Hosting:** Vercel
- **Notifications:** Resend or SendGrid (planned)

---

## Architecture Overview

### Key Components

1. **Next.js Web Application** (`/app`)
   - Authentication pages (login/signup)
   - Protected dashboard with schedule management
   - Gym credentials storage form
   - Booking history and status views

2. **Supabase Database**
   - `users` - Auth (managed by Supabase Auth)
   - `gym_credentials` - User's gym login info (encrypted)
   - `recurring_classes` - User's class schedule configuration (includes `next_skip_date`)
   - `booking_attempts` - Log of all booking attempts (status: pending, confirmed, waitlisted, failed, skipped)
   - `user_settings` - Global settings (`schedule_paused` toggle)

3. **Inngest Functions** (`/inngest`)
   - `bookClass.ts` - Core booking function with intelligent retry logic
   - `scheduleBookings.ts` - Daily scheduler (midnight UTC) for all active classes
   - Event-driven: triggers at exact booking window times

4. **Legacy Scripts** (`/scripts`)
   - `booking-automation.ts` - Core Puppeteer booking logic (still used by Inngest)
   - `test-*.ts` - Various testing scripts
   - GitHub Actions kept for manual testing via `workflow_dispatch`

### Data Flow

```
User configures schedule
    ↓
Next.js calculates booking window → Sends event to Inngest
    ↓
Inngest waits until exact booking window time
    ↓
Inngest triggers → Calls /api/inngest webhook
    ↓
Booking function → Fetch class data → Launch Puppeteer
    ↓
Puppeteer → Login to gym site → Book class
    ↓
Write result → Supabase (booking_attempts)
    ↓
Email notification → User (planned)
    ↓
User views status → Next.js dashboard
    ↓
Daily scheduler (midnight UTC) → Re-schedules all active classes
```

---

## Project Structure

```
my-workout-scheduler/
├── app/
│   ├── (auth)/              # Auth pages (login, signup)
│   │   ├── login/
│   │   └── signup/
│   ├── actions/             # Server actions for form submissions
│   │   ├── gym-credentials.ts      # Gym credential CRUD operations
│   │   ├── recurring-classes.ts    # Schedule CRUD operations
│   │   └── user-settings.ts        # User settings operations
│   ├── api/
│   │   └── inngest/         # Inngest webhook endpoint
│   ├── dashboard/           # Protected dashboard
│   │   ├── page.tsx         # Main dashboard landing
│   │   ├── credentials/     # Gym credentials management
│   │   └── schedule/        # Schedule management pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/              # Reusable React components
├── lib/
│   ├── supabase/           # Supabase client configuration
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── database.ts     # Database helper functions
│   ├── database.types.ts   # TypeScript types for database
│   ├── encryption.ts       # AES-256-GCM encryption utilities
│   └── date-utils.ts       # Date/time calculation utilities
├── inngest/
│   ├── bookClass.ts        # Core booking function with retry logic
│   ├── scheduleBookings.ts # Daily scheduler (midnight UTC)
│   └── client.ts           # Inngest client configuration
├── scripts/
│   ├── booking-automation.ts       # Core Puppeteer logic (used by Inngest)
│   └── test-*.ts                   # Testing scripts
├── supabase/
│   └── migrations/         # SQL migration files
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_schedule_management.sql
├── .github/
│   └── workflows/
│       └── booking-automation.yml  # Manual testing only (no cron)
├── docs/                   # Comprehensive documentation
│   ├── My Workout Scheduler PRD.md
│   ├── BOOKING_AUTOMATION.md
│   ├── GITHUB_ACTIONS_SETUP.md
│   └── [more docs...]
└── middleware.ts           # Route protection middleware
```

---

## Key Files and Their Purpose

### Critical Application Files

- **`app/dashboard/page.tsx`** - Main dashboard landing page
- **`app/dashboard/credentials/page.tsx`** - Gym credentials management form
- **`app/dashboard/schedule/page.tsx`** - Schedule list view with CRUD operations
- **`app/actions/recurring-classes.ts`** - Server actions for schedule CRUD operations
- **`app/actions/gym-credentials.ts`** - Server actions for credential management
- **`app/actions/user-settings.ts`** - Server actions for user settings (pause toggle)
- **`lib/encryption.ts`** - Handles AES-256-GCM encryption for gym credentials
- **`lib/date-utils.ts`** - Date/time utilities (booking window calculations, timezone handling)
- **`lib/supabase/database.ts`** - Database query helpers (CRUD operations)
- **`middleware.ts`** - Protects routes, redirects unauthenticated users to login

### Critical Automation Files

- **`inngest/bookClass.ts`** - Event-driven booking function
  - Triggered by Inngest at exact booking window time
  - Fetches class data and validates skip/pause status
  - Calls Puppeteer automation script
  - Intelligent retry logic:
    - Clock drift: 12 retries × 15s (booking window not open yet)
    - Class full: retry every 15min until class starts
  - Updates database with results

- **`inngest/scheduleBookings.ts`** - Daily scheduler
  - Runs at midnight UTC via Inngest cron
  - Queries all active recurring classes
  - Schedules booking events for next occurrence
  - Ensures no classes are missed

- **`scripts/booking-automation.ts`** - Core Puppeteer logic
  - Login to gym website
  - Navigate to class schedule
  - Find target class (fuzzy matching)
  - Two-step booking flow (class list → description page with checkbox)
  - Duplicate prevention (checks if already booked/waitlisted)
  - Booking window detection (verifies window is open)
  - Error handling and screenshot capture

- **`app/api/inngest/route.ts`** - Inngest webhook endpoint
  - Receives event triggers from Inngest
  - Executes booking and scheduler functions
  - Returns results to Inngest for logging/monitoring

### Database Migrations

- **`001_initial_schema.sql`** - Core tables: gym_credentials, recurring_classes, booking_attempts
- **`002_rls_policies.sql`** - Row Level Security policies (users see only their own data)
- **`003_schedule_management.sql`** - Adds `next_skip_date` field, user_settings table, 'skipped' status

---

## Important Concepts

### 1. Encryption Strategy

**Application-level encryption** (NOT database-level):
- Gym passwords encrypted using AES-256-GCM in Node.js
- Encryption key stored in environment variable (`ENCRYPTION_KEY`)
- Key never sent to database (more secure than database-level encryption)
- Works on free tier (no paid Supabase Vault needed)

**Files:** `lib/encryption.ts`

### 2. Date and Time Utilities

**Centralized date/time handling** in `lib/date-utils.ts`:
- Booking window calculations (`calculateBookingWindowOpen`, `hasBookingWindowOpened`)
- Next occurrence calculations (`calculateNextOccurrence`)
- Date formatting utilities (`formatDate`, `formatTime12Hour`)
- Timezone-aware date comparisons
- Day name utilities (`getDayName`, `getShortDayName`)
- Common timezone definitions with DST support

**Critical for consistency:**
- All date calculations should use utilities from `lib/date-utils.ts`
- Utilities handle timezone conversions and DST automatically
- Local date parsing prevents timezone offset issues
- Always parse YYYY-MM-DD dates as local dates to avoid timezone bugs

**Files:** `lib/date-utils.ts`, used throughout the application

### 3. Booking Window Logic

Classes book at a specific time before the class starts (e.g., 26 hours prior):

**Example:**
- Class: Monday 4:15 PM
- Booking window: 26 hours prior
- Booking opens: Sunday 2:15 PM

**Window Detection:**
- Check if "RESERVE" button is disabled
- Check for tooltip: "Reservation starts at [DATE] at [TIME]"
- If window not open, skip booking attempt

**Files:** `scripts/booking-automation.ts`, `lib/date-utils.ts:calculateBookingWindowOpen()`

### 4. Two-Step Booking Flow (YMCA Daxko Platform)

**Critical for automation:**

1. **Step 1:** Click "RESERVE" button on class list page
2. **Step 2:** Navigate to class description page
3. **Step 3:** Select checkbox next to user's name in "Active Members" section
4. **Step 4:** Determine if class is full (look for "Accepting Spot in WaitList" text)
5. **Step 5:** Click final "RESERVE" or "WAITLIST" button
6. **Step 6:** Wait for confirmation page:
   - Confirmed: "Now that reservation is complete"
   - Waitlisted: "Now that you are in waitlist"

**Files:** `scripts/booking-automation.ts`, `docs/YMCA_BOOKING_FLOW_CONFIRMED.md`

### 5. Skip Next Occurrence Feature

Users can skip the next single occurrence of a recurring class using the `next_skip_date` field.

**How it works:**
- User clicks "Skip Next" on a class
- System calculates next occurrence date and stores in `next_skip_date`
- Automation skips booking when `class_date` matches `next_skip_date`
- After skipping, `next_skip_date` is automatically cleared (smart unskip)
- If booking window already passed, skip is cleared immediately

**Files:** `app/actions/recurring-classes.ts:skipNextOccurrence()`, `scripts/booking-automation.ts`

### 6. Class Status Detection (v2.7 Enhancement)

The system detects 6 different class states on the YMCA Daxko platform with enhanced logic:

**Class States:**

1. **Available** (RESERVE - dark blue, clickable)
   - Detection: Booking button exists, no status pills
   - Action: Proceeds with booking
   - Retry: N/A (booking attempt proceeds)

2. **Booking Window Not Open** (RESERVE - light blue, disabled)
   - Detection: Button disabled or tooltip "reservation starts at..."
   - Action: Returns error with "window not open" message
   - Retry: Clock drift retry (12 × 15s within Puppeteer)

3. **Already Reserved** (RESERVED - white, clickable)
   - Detection: Button text includes "RESERVED"
   - Action: Returns status "confirmed" with "already reserved" message
   - Retry: No (already booked)

4. **Class Full** (orange pill)
   - Detection: Case-insensitive "full", "class full", "spots full", pill/badge with "full"
   - Action: Returns status "failed" with "Class is full..." message
   - Retry: **YES** - 15-minute intervals until class starts (Inngest orchestrated)

5. **Cancelled** (pill)
   - Detection: "cancelled", "class cancelled", pill/badge with "cancel"
   - Action: Returns status "failed" with "Class is cancelled - booking not possible"
   - Retry: **NO** (permanent failure)

6. **Not Reservable** (red pill)
   - Detection: "not reservable", pill/badge with "not reservable"
   - Action: Returns status "failed" with "Class is not reservable - booking not possible"
   - Retry: **NO** (permanent failure)

**Status Detection Priority:**
reserved > cancelled > not reservable > full > available

**Enhanced Features (v2.7):**
- Case-insensitive matching for all status indicators
- Explicit pill/badge element detection (`class="pill"`, `class="badge"`)
- Independent booking button check (doesn't depend on `isFull` flag)
- Defensive pre-click check (re-validates status before clicking RESERVE)
- Smart retry logic: only retries "Class Full" (temporary), not cancelled/not reservable (permanent)

**Files:** `scripts/booking-automation.ts` (lines 1049-1307), `docs/PRODUCTION_TESTING.md`

### 7. Duplicate Prevention (Enhanced in v2.7)

**Two Mechanisms:**

**A. Database-Level Duplicate Detection (Existing)**
- Before booking, checks `booking_attempts` table for existing confirmed/waitlisted attempts
- Filter by `recurring_class_id`, `class_date`, and `status`
- If found, skip booking (prevents re-booking already secured spots)

**B. Run-Level Duplicate Detection (New in v2.7)**
- Checks for pending booking attempts within last 5 minutes
- Prevents race conditions when retries trigger simultaneously
- Returns status `duplicate` and exits early
- **Files:** `lib/inngest/functions.ts` (lines 52-86)

**C. Idempotency Keys (New in v2.7)**
- Retry events have unique IDs: `book-retry-{classId}-{date}-{attemptNumber}`
- Inngest deduplicates events with same ID (only processes once)
- Prevents duplicate retry events from being queued
- **Files:** `lib/inngest/functions.ts` (lines 188-203), `lib/inngest/scheduler.ts` (lines 105-141)

**Files:** `scripts/booking-automation.ts`, `lib/inngest/functions.ts`, `lib/inngest/scheduler.ts`

### 8. Fuzzy Matching

Class names on gym website may have minor spelling variations. System uses case-insensitive matching and handles variations.

**Example:**
- Database: "BODYPUMP"
- Website: "Body Pump" or "BodyPump"
- Match: ✓

**Files:** `scripts/booking-automation.ts:findClassElement()`

### 9. Timezone Handling

Each recurring class has a timezone setting (e.g., "America/New_York"). System uses gym's local timezone for all date calculations.

**Critical for accuracy:**
- Booking window calculations use class timezone
- Class occurrence dates use class timezone
- System handles DST transitions automatically
- Uses IANA timezone identifiers (e.g., "America/New_York")
- Uses `date-fns` and `date-fns-tz` libraries for precise timezone conversions
- Date utilities parse YYYY-MM-DD strings as local dates to prevent timezone offset bugs

**Common timezones available:**
- Eastern Time (ET), Central Time (CT), Mountain Time (MT), Pacific Time (PT)
- Arizona Time (MST - No DST), Alaska Time (AKT), Hawaii Time (HST)

**Files:** `lib/date-utils.ts` (primary), `scripts/booking-automation.ts`, `inngest/bookClass.ts`

---

## Operational Notes

### Event-Driven Architecture (Inngest)

**How it works:**
- When a user creates/edits a class, Next.js calculates the booking window time and sends an event to Inngest
- Inngest waits until the exact booking window time (e.g., Friday 7:30 AM for Saturday 9:30 AM class)
- At the precise moment, Inngest triggers the booking function via webhook
- Daily scheduler (midnight UTC) re-schedules all active classes for their next occurrence

**Monitoring:**
- View scheduled events, runs, and logs in Inngest dashboard
- Each event shows status: pending, running, completed, or failed
- Failed events automatically retry up to 3 times with exponential backoff

**Pause/Resume Automation:**
- **Per-user:** Use the global pause toggle in dashboard settings
- **Per-class:** Use the active toggle on individual classes
- **Single occurrence:** Use the "Skip Next" button

**Manual Testing:**
- GitHub Actions workflow still available for manual testing via `workflow_dispatch`
- No cron schedule (replaced by Inngest event-driven triggers)

---

## Common Development Tasks

### Adding a New Feature

1. Check if database schema changes needed → Add migration in `supabase/migrations/`
2. Update TypeScript types in `lib/database.types.ts`
3. Add UI components in `app/dashboard/`
4. Add database helpers in `lib/supabase/database.ts`
5. Test locally with `npm run dev`

### Testing Booking Automation

**Available test scripts:**

```bash
# Test database query (no booking)
npm run test:booking-query

# Test database helpers
npm run test:database-helpers

# Dry-run test (no actual bookings, shows what would happen)
npm run test:booking-dry-run

# Test single booking (makes real booking!)
npm run test:single-booking

# Run full automation (makes real bookings!)
npm run automation:run
```

**Important:** Always use dry-run tests first!

### Debugging GitHub Actions

1. Check workflow runs: GitHub repo → Actions tab
2. View logs for specific run
3. Check screenshots artifact (if booking failed)
4. Verify secrets are set: Settings → Secrets and variables → Actions
5. Manual trigger: Actions → booking-automation → Run workflow

**Common issues:**
- Cron schedule not triggering: Manual trigger may help "prime" it
- Puppeteer timeout: Check gym website is accessible
- Login failure: Verify credentials are correct

### Database Operations

**Local development:**
```bash
# Test encryption
npx tsx test-encryption.ts
```

**Supabase Dashboard:**
- View data: Database → Table Editor
- Run SQL: SQL Editor
- Check logs: Database → Logs

**Migration workflow:**
1. Write SQL in `supabase/migrations/00X_name.sql`
2. Run in Supabase Dashboard → SQL Editor
3. Verify in Table Editor
4. Update TypeScript types if schema changed

---

## Security Considerations

### Row Level Security (RLS)

**Critical:** All tables (except `users`) have RLS policies ensuring users only see their own data.

**Policy pattern:**
```sql
CREATE POLICY "Users can view own records"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

**Files:** `supabase/migrations/002_rls_policies.sql`

### Environment Variables

**Local development (`.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ENCRYPTION_KEY=...  # Generate with: openssl rand -base64 32
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
PUPPETEER_SKIP_DOWNLOAD=true  # For Vercel deployment
```

**Inngest configuration:**
- Sign up at https://inngest.com
- Create new app, copy Event Key and Signing Key
- Set both keys in `.env.local` and Vercel

**Vercel environment variables:**
- Same as local `.env.local`
- Set in Vercel Dashboard → Settings → Environment Variables
- **Critical:** Add `PUPPETEER_SKIP_DOWNLOAD=true` to prevent build failures

### Credential Storage

**Never commit:**
- `.env.local` (gitignored)
- Actual gym credentials
- Encryption keys

**Always encrypt:**
- Gym passwords before storing in database
- Use `lib/encryption.ts` utilities

---

## Known Issues and Gotchas

### ~~GitHub Actions Cron Reliability~~ ✅ RESOLVED

**Previous Issue:** Cron schedules were unreliable for frequent intervals (every 15 minutes).

**Solution:** Migrated to Inngest event-driven architecture in v2.0
- Triggers at exact booking window times (no polling)
- 99.9%+ reliability with built-in retry logic
- Daily scheduler provides fallback for missed events

### Booking Window Edge Cases

**Clock drift:** System clock may differ from gym website clock.

**Mitigation:** Intelligent retry logic in Inngest (12 retries × 15s = 3min total) catches booking window as soon as it opens.

**Files:** `inngest/bookClass.ts`, `scripts/booking-automation.ts`

### Timezone Calculations

**Critical:** Always use the class's timezone for calculations, not system timezone.

**Common mistakes:**
- Using `new Date()` without timezone context
- Parsing YYYY-MM-DD dates as UTC (causes off-by-one-day bugs)
- Not accounting for DST transitions

**Correct approach:**
- Use utilities from `lib/date-utils.ts` for all date/time calculations
- Parse YYYY-MM-DD dates as local dates: `new Date(year, month - 1, day)`
- Use IANA timezone identifiers for automatic DST handling

**Files:** `lib/date-utils.ts`, `scripts/booking-automation.ts`

---

## Testing Strategy

### Manual Testing Checklist

1. **Authentication:**
   - [ ] Sign up new user
   - [ ] Log in existing user
   - [ ] Protected routes redirect to login
   - [ ] Logout works

2. **Gym Credentials:**
   - [ ] Save credentials (verify encryption)
   - [ ] Edit credentials
   - [ ] Password show/hide toggle works
   - [ ] Password confirmation validation

3. **Schedule Management:**
   - [ ] Add recurring class
   - [ ] Edit class
   - [ ] Delete class (with confirmation)
   - [ ] Copy class
   - [ ] Global pause toggle
   - [ ] Per-class active toggle
   - [ ] Skip next occurrence

4. **Booking Automation:**
   - [ ] Dry-run test shows correct classes
   - [ ] Single booking test succeeds
   - [ ] Duplicate prevention works
   - [ ] Fuzzy matching finds classes
   - [ ] Booking window detection works
   - [ ] Waitlist handling works
   - [ ] Screenshots captured on failure

### Automated Testing (Future)

Currently relies on manual testing. Consider adding:
- Unit tests for utilities (`lib/encryption.ts`, `lib/supabase/database.ts`)
- Integration tests for booking flow
- E2E tests for critical user flows

---

## Documentation

**Essential reading:**
- `README.md` - Quick start and setup
- `docs/My Workout Scheduler PRD.md` - Full product spec
- `docs/BOOKING_AUTOMATION.md` - Automation system details
- `docs/PRODUCTION_TESTING.md` - Production testing guide (v2.7+)
- `docs/GITHUB_ACTIONS_SETUP.md` - GitHub Actions setup guide
- `docs/YMCA_BOOKING_FLOW_CONFIRMED.md` - Confirmed booking flow

**Helpful references:**
- `docs/DATABASE_SETUP.md` - Database setup guide
- `docs/TESTING_BOOKINGS.md` - Testing instructions
- `docs/BACKLOG.md` - Future enhancements

---

## Development Guidelines

### Code Style

- TypeScript strict mode enabled
- Use async/await (not callbacks)
- Prefer named exports over default exports
- Use descriptive variable names (avoid abbreviations)
- Comment complex logic (especially booking flow)

### Server Actions Pattern

**All form submissions use Next.js Server Actions** (`app/actions/`):
- Mark functions with `'use server'` directive
- Return structured results: `{ success: boolean, error?: string, ... }`
- Validate authentication before any operation
- Revalidate paths after mutations (`revalidatePath`)
- Use TypeScript types for form data and results

**Example pattern:**
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveData(data: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Perform operation...
  revalidatePath('/dashboard')
  return { success: true }
}
```

**Files:** `app/actions/recurring-classes.ts`, `app/actions/gym-credentials.ts`, `app/actions/user-settings.ts`

### Git Workflow

- Develop on feature branches: `claude/write-cl-*`
- Commit messages: Descriptive, present tense (e.g., "Add fuzzy matching for class names")
- Push to designated branch before creating PR

### Error Handling

- Always catch Puppeteer errors
- Log errors with context (user ID, class ID, timestamp)
- Save screenshots on booking failures
- Write errors to `booking_attempts` table
- Never swallow errors silently

### Database Queries

- Always use parameterized queries (prevent SQL injection)
- Filter by `user_id` (enforce RLS in application logic too)
- Handle null/undefined cases
- Use TypeScript types for type safety

---

## Quick Reference

### Environment Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test encryption
npx tsx test-encryption.ts

# Test booking automation (dry-run)
npm run test:booking-dry-run

# Run booking automation (real bookings!)
npm run automation:run
```

### Database Access

**Supabase Dashboard:**
- URL: https://supabase.com/dashboard
- Project: [Your project name]

**Local connection:**
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()
```

### Common Queries

```typescript
// Get user's recurring classes
const { data: classes } = await supabase
  .from('recurring_classes')
  .select('*')
  .eq('user_id', userId)
  .order('day_of_week')

// Get user settings (pause toggle)
const { data: settings } = await supabase
  .from('user_settings')
  .select('*')
  .eq('user_id', userId)
  .single()

// Get booking attempts for a class
const { data: attempts } = await supabase
  .from('booking_attempts')
  .select('*')
  .eq('recurring_class_id', classId)
  .order('attempt_timestamp', { ascending: false })

// Check if class already booked
const { data: existing } = await supabase
  .from('booking_attempts')
  .select('*')
  .eq('recurring_class_id', classId)
  .eq('class_date', classDate)
  .in('status', ['confirmed', 'waitlisted'])

// Skip next occurrence
await supabase
  .from('recurring_classes')
  .update({ next_skip_date: '2025-11-20' })
  .eq('id', classId)
```

---

## Contact and Support

**Project Owner:** Brock Busby
**Repository:** https://github.com/beerock/my-workout-scheduler

**For issues:**
- Check documentation in `docs/`
- Review logs in Supabase Dashboard or GitHub Actions
- Check screenshots artifact for booking failures

---

## Version History

- **v1.0** (Initial) - Project setup, auth, schedule management
- **v1.1** - Booking automation with Puppeteer
- **v1.2** - GitHub Actions integration, parallel processing
- **v1.3** - Duplicate prevention, fuzzy matching, booking window detection
- **v1.4** - Timezone bug fixes, centralized date utilities, server actions refactor
- **v2.0** - Inngest migration: event-driven architecture, intelligent retry logic, 100% free tier
- **v2.7** - Enhanced class status detection (6 states), duplicate prevention with idempotency keys, smart retry logic

**Last Updated:** November 17, 2025
