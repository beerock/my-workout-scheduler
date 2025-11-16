# CLAUDE.md

**Project Context Guide for Claude Code**

This document provides Claude with essential context about the My Workout Scheduler project to enable effective assistance with development, debugging, and feature implementation.

---

## Project Overview

**My Workout Scheduler** is a web application that automates class reservations for recurring fitness sessions at YMCA gyms. It eliminates manual booking by using browser automation to reserve classes the instant registration opens.

**Primary Use Case:** Users configure their recurring gym classes (e.g., "Monday 4:15 PM BODYPUMP @ Downtown YMCA") and the system automatically books them when the registration window opens (typically 26 hours before class time).

**MVP Scope:** 5 users, 2-5 classes per user, free tier services (GitHub Actions paid tier exception for frequent scheduling)

**Recent Updates (v1.4):**
- Fixed timezone-related bugs in booking window and reset logic
- Centralized all date/time utilities in `lib/date-utils.ts`
- Refactored form submissions to use Next.js Server Actions
- Improved local date parsing to prevent UTC offset issues

---

## Tech Stack

- **Frontend/Backend:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + built-in auth)
- **Automation:** GitHub Actions + Puppeteer (headless Chrome)
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

3. **Automation Scripts** (`/scripts`)
   - `booking-automation.ts` - Core Puppeteer booking logic
   - `run-booking-automation.ts` - Main entry point for automation
   - `database-helpers.ts` - Database query utilities
   - `test-*.ts` - Various testing scripts

4. **GitHub Actions** (`.github/workflows`)
   - `booking-automation.yml` - Runs every 15 minutes, triggers booking script
   - Queries database for classes with open booking windows
   - Executes Puppeteer scripts in parallel for all due bookings

### Data Flow

```
User configures schedule
    ↓
Next.js → Supabase DB (recurring_classes)
    ↓
GitHub Actions (every 15 min) → Query Supabase
    ↓
Puppeteer script → Login to gym site → Book class
    ↓
Write result → Supabase (booking_attempts)
    ↓
Email notification → User
    ↓
User views status → Next.js dashboard
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
├── scripts/
│   ├── booking-automation.ts       # Core Puppeteer logic
│   ├── run-booking-automation.ts   # Main automation entry point
│   ├── database-helpers.ts         # Database utilities
│   └── test-*.ts                   # Testing scripts
├── supabase/
│   └── migrations/         # SQL migration files
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_schedule_management.sql
├── .github/
│   └── workflows/
│       └── booking-automation.yml  # GitHub Actions workflow
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

- **`scripts/booking-automation.ts`** - Core booking logic
  - Login to gym website
  - Navigate to class schedule
  - Find target class (fuzzy matching)
  - Two-step booking flow (class list → description page with checkbox)
  - Duplicate prevention (checks if already booked/waitlisted)
  - Booking window detection (verifies window is open)
  - Error handling and screenshot capture

- **`scripts/run-booking-automation.ts`** - Orchestrates automation
  - Queries database for classes with open booking windows
  - Processes users in parallel (<60s total)
  - Writes results back to database

- **`.github/workflows/booking-automation.yml`** - Scheduler
  - Runs every 15 minutes: `schedule: - cron: '*/15 * * * *'`
  - Note: GitHub Actions cron may be unreliable for frequent intervals
  - Manual triggers work and may help "prime" the schedule

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

### 6. Duplicate Prevention

Before attempting to book, system checks database for existing booking attempts with status "confirmed" or "waitlisted" for the same class occurrence.

**Logic:**
- Query `booking_attempts` table
- Filter by `recurring_class_id`, `class_date`, and `status`
- If found, skip booking (prevents re-booking already secured spots)

**Files:** `scripts/booking-automation.ts:checkIfAlreadyBooked()`

### 7. Fuzzy Matching

Class names on gym website may have minor spelling variations. System uses case-insensitive matching and handles variations.

**Example:**
- Database: "BODYPUMP"
- Website: "Body Pump" or "BodyPump"
- Match: ✓

**Files:** `scripts/booking-automation.ts:findClassElement()`

### 8. Timezone Handling

Each recurring class has a timezone setting (e.g., "America/New_York"). System uses gym's local timezone for all date calculations.

**Critical for accuracy:**
- Booking window calculations use class timezone
- Class occurrence dates use class timezone
- System handles DST transitions automatically
- Uses IANA timezone identifiers (e.g., "America/New_York")
- Date utilities parse YYYY-MM-DD strings as local dates to prevent timezone offset bugs

**Common timezones available:**
- Eastern Time (ET), Central Time (CT), Mountain Time (MT), Pacific Time (PT)
- Arizona Time (MST - No DST), Alaska Time (AKT), Hawaii Time (HST)

**Files:** `lib/date-utils.ts` (primary), `scripts/booking-automation.ts`

---

## Operational Notes

### Enable/Disable Automatic Booking Schedule

**To disable automatic booking (e.g., for testing):**
1. Edit `.github/workflows/booking-automation.yml`
2. Comment out the `schedule` section (cron trigger)
3. Commit and push the change
4. The workflow will stop running automatically but can still be triggered manually

**To re-enable automatic booking:**
1. Uncomment the `schedule` section in `.github/workflows/booking-automation.yml`
2. Commit and push the change
3. The workflow will resume running every 15 minutes automatically

**Current Status:** Schedule is enabled (runs every 15 minutes automatically)

**Reference:** `docs/BACKLOG.md` for event-driven trigger architecture optimization (future)

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
ENCRYPTION_KEY=...  # Generate with: openssl rand -base64 32
```

**GitHub Actions secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (NOT anon key!)
- `ENCRYPTION_KEY` (same as local)

**Vercel environment variables:**
- Same as local `.env.local`
- Set in Vercel Dashboard → Settings → Environment Variables

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

### GitHub Actions Cron Reliability

**Issue:** Cron schedules may not auto-trigger reliably for frequent intervals (every 15 minutes).

**Workaround:** Manual triggers work and may help "prime" the schedule.

**Long-term solution (backlogged):** Event-driven trigger architecture based on booking window times.

**Reference:** `docs/My Workout Scheduler PRD.md` (section on GitHub Actions)

### Booking Window Edge Cases

**Clock drift:** System clock may differ from gym website clock.

**Mitigation:** Retry logic (6 attempts, 30-second intervals) if booking button not found.

**Files:** `scripts/booking-automation.ts:attemptBooking()`

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

**Last Updated:** November 16, 2025
