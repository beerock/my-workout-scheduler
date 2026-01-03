# CLAUDE.md

**Project Context Guide for Claude Code**

This document provides Claude with essential context about the My Workout Scheduler project to enable effective assistance with development, debugging, and feature implementation.

---

## Project Overview

**My Workout Scheduler** is a web application that automates class reservations for recurring fitness sessions at YMCA gyms using browser automation (Puppeteer) to reserve classes the instant registration opens.

**Primary Use Case:** Users configure recurring gym classes (e.g., "Monday 4:15 PM BODYPUMP @ Downtown YMCA") and the system automatically books them when the registration window opens (typically 26 hours before class time).

**MVP Scope:** 5 users, 2-5 classes per user, 100% free tier services

**Current Version (v2.19):** Production-ready with Design System v2 component library, Header and Footer layout components, immediate scheduling on unpause/activate/unskip, skip edit confirmation, intelligent pause/inactive interaction using three-zone cleanup logic, NextClassCard booking status display (confirmed/waitlisted/pending), custom error pages (404, error boundary, global error) with support contact, and comprehensive SEO metadata (sitemap, robots.txt, OG images, per-page titles).

---

## Tech Stack

- **Frontend/Backend:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + built-in auth)
- **Automation:** Inngest (event-driven orchestration) + Puppeteer (headless Chrome)
- **Date/Time:** date-fns and date-fns-tz for timezone handling
- **Email Service:** Resend (production domain: beerock.com with DKIM)
- **Hosting:** Vercel

---

## Architecture Overview

### Key Components

1. **Next.js Web Application** (`/app`)
   - Authentication pages with bot protection
   - Protected dashboard with schedule management
   - Server actions pattern for all form submissions (`/app/actions`)

2. **Supabase Database**
   - `users` - Auth (managed by Supabase Auth)
   - `gym_credentials` - Encrypted gym login info
   - `recurring_classes` - Schedule configuration (includes `skip_next_occurrence`, `skip_target_datetime`)
   - `booking_attempts` - Booking history (status: pending, confirmed, waitlisted, failed, skipped)
   - `user_settings` - Global settings (`schedule_paused`)

3. **Inngest Functions** (`/inngest`)
   - `bookClass.ts` - Core booking with intelligent retry logic
   - `scheduleBookings.ts` - Daily scheduler (midnight UTC)
   - Event-driven: triggers at exact booking window times

4. **Puppeteer Automation** (`/scripts`)
   - `booking-automation.ts` - Core booking logic (used by Inngest)
   - Two-step YMCA Daxko booking flow
   - Fuzzy matching, window detection, duplicate prevention

### Data Flow

```
User configures schedule → Next.js calculates booking window → Sends event to Inngest
→ Inngest waits until exact time → Triggers booking function → Puppeteer automation
→ Login to gym → Navigate to class → Book/Waitlist → Write result to Supabase
→ Daily scheduler (midnight UTC) re-schedules all active classes
```

---

## Project Structure (Key Locations)

```
my-workout-scheduler/
├── app/
│   ├── (auth)/                          # Login, signup (with Turnstile)
│   ├── actions/                         # Server actions (CRUD operations)
│   ├── dashboard/                       # Protected pages
│   │   ├── credentials/                 # Gym credentials management
│   │   ├── schedule/                    # Schedule management
│   │   └── profile/                     # User profile settings
│   └── api/inngest/                     # Inngest webhook endpoint
├── components/                           # React components
├── lib/
│   ├── supabase/                        # Supabase clients (browser, server)
│   ├── encryption.ts                    # AES-256-GCM encryption
│   ├── date-utils.ts                    # Date/time calculations (CRITICAL)
│   └── env-utils.ts                     # Environment detection & email config
├── inngest/                              # Event-driven booking functions
├── scripts/                              # Puppeteer automation & tests
├── supabase/migrations/                  # Database migrations with RLS policies
└── docs/                                 # Comprehensive documentation
```

---

## Critical Domain Concepts

### 1. Encryption Strategy

**Application-level encryption** (NOT database-level) using AES-256-GCM. Gym passwords encrypted in Node.js with key stored in `ENCRYPTION_KEY` env variable. Key never sent to database (more secure, works on free tier).

**Files:** `lib/encryption.ts`

### 2. Date/Time Handling (CRITICAL)

**All date calculations MUST use utilities from `lib/date-utils.ts`:**
- Booking window calculations (`calculateBookingWindowOpen`, `hasBookingWindowOpened`)
- Next occurrence calculations (`calculateNextOccurrence`)
- Timezone-aware comparisons with DST support
- Parse YYYY-MM-DD dates as local dates to prevent timezone offset bugs

**Two `calculateBookingWindowOpen` Implementations - Use Correct One:**
- `lib/inngest/scheduler.ts` - Takes `day_of_week` (number), calculates next occurrence dynamically ✓ **Use this for recurring class scheduling**
- `lib/date-utils.ts` - Takes `classDate` (string YYYY-MM-DD), for pre-calculated dates only (deprecated for external use)

**Common mistake:** Using `new Date()` without timezone context causes off-by-one-day bugs.

**Files:** `lib/date-utils.ts`, `lib/inngest/scheduler.ts`

### 3. Booking Window Logic

Classes book at specific time before class starts (e.g., 26 hours prior). System must detect if window is open and retry if triggered early.

**Fast Retry Loop:** When disabled button detected (window not open):
- 9 attempts × 5 seconds = 45 seconds total coverage
- Breaks immediately when window opens
- Meets <60s booking KPI

**Status Priority:** reserved > disabled button > cancelled > not reservable > full > available

**Files:** `scripts/booking-automation.ts`, `lib/date-utils.ts`

### 4. Two-Step Booking Flow (YMCA Daxko Platform)

**Critical automation sequence:**
1. Click "RESERVE" button on class list page
2. Navigate to class description page
3. Select checkbox next to user's name
4. Detect if waitlist (look for "Accepting Spot in WaitList" text)
5. Click final "RESERVE" or "WAITLIST" button
6. Wait for confirmation page

**Files:** `scripts/booking-automation.ts`, `docs/YMCA_BOOKING_FLOW_CONFIRMED.md`

### 5. Class Status Detection (6 States)

System detects: Available, Window Not Open (disabled button), Already Reserved, Class Full, Cancelled, Not Reservable

**Smart retry logic:**
- **Class Full:** Retry every 15min until class starts (temporary failure)
- **Cancelled/Not Reservable:** No retry (permanent failure)
- **Window Not Open:** Fast retry loop (9×5s)

**Enhanced features:** Case-insensitive matching, pill/badge detection, defensive pre-click check

**Files:** `scripts/booking-automation.ts`, `docs/PRODUCTION_TESTING.md`

### 6. Duplicate Prevention (3 Mechanisms)

**A. Database-Level:** Check for existing confirmed/waitlisted attempts before booking
**B. Run-Level:** Check for pending attempts within last 5 minutes (prevents race conditions)
**C. Idempotency Keys:** Retry events have unique IDs (`book-retry-{classId}-{date}-{attempt}`)

**Files:** `scripts/booking-automation.ts`, `inngest/bookClass.ts`

### 7. Fuzzy Matching

Handles class name variations using Levenshtein distance algorithm (0.75-0.8 similarity threshold).

**Examples:** "Raquetball" → "Racquetball" ✓, "BODYPUMP" → "Body Pump" ✓

**Files:** `scripts/booking-automation.ts`

### 8. Timezone Handling (CRITICAL)

Each class has a timezone (e.g., "America/New_York"). System uses class timezone for ALL calculations. Uses IANA timezone identifiers with automatic DST handling.

**Common mistake:** Not using class timezone causes booking at wrong time.

**Files:** `lib/date-utils.ts` (primary), `scripts/booking-automation.ts`, `inngest/bookClass.ts`

### 9. Skip Next Occurrence (Two-Field Approach)

Users can skip single occurrence using two fields for clear separation of concerns:

**Fields:**
- `skip_next_occurrence` (boolean) - Flag for business logic checked by Inngest
- `skip_target_datetime` (timestamptz) - Full datetime for UI display with timezone

**How it works:**
- User clicks "Skip Next" → System calculates next occurrence datetime and sets both fields
- Inngest checks boolean flag before booking attempt (simple, no date comparison needed)
- UI shows badge based on `current_time < skip_target_datetime` comparison
- After skip happens, flag cleared immediately (prevents double-skip)
- At next booking attempt (one week later), datetime cleared (cleanup stale data)

**Benefits:**
- Simpler business logic (boolean check vs date comparison)
- No timezone bugs in skip logic (flag is timezone-agnostic)
- Proper datetime storage with timezone for UI display
- Clear separation: backend uses flag, UI uses datetime

**Files:** `app/actions/recurring-classes.ts`, `lib/inngest/functions.ts`, `components/SkipButton.tsx`

### 10. Skip Edit Confirmation

When editing a class with active skip, changing day/time triggers confirmation modal before clearing skip fields.

**Two-pass pattern:** First call returns `skipClearWarning`, second call with `confirmSkipClear=true` clears skip. Modal shows formatted skip date and appears before booking window check.

**Files:** `app/actions/recurring-classes.ts`, `components/RecurringClassForm.tsx`

### 11. Skip Cleanup (Pause/Inactive) - Three-Zone Logic

When pausing schedule or deactivating class, skip fields cleaned up based on time:
- **Zone A** (before booking window): Preserve both fields
- **Zone B** (inside window, before class): Clear `skip_next_occurrence` flag only, keep `skip_target_datetime` for UI
- **Zone C** (after class time): Clear both fields

Skip buttons disabled when paused/inactive with tooltips. Uses `calculateBookingWindowOpen()` for timezone-aware calculations.

**Files:** `app/actions/recurring-classes.ts` (toggleRecurringClassActive), `app/actions/user-settings.ts` (updateSchedulePaused), `components/SkipButton.tsx`

### 12. Environment Variables

**Multi-environment support** with dynamic URL resolution and environment-aware email config:
- Production: `noreply@beerock.com` (custom domain with DKIM)
- Preview/Dev: `onboarding@resend.dev` (test sender)

**See detailed docs:** `docs/ENVIRONMENT_VARIABLES_STRATEGY.md`, `docs/ENV_QUICK_REFERENCE.md`, `.env.example`

**Files:** `lib/env-utils.ts`

### 13. Design System v2 & Component Library (CRITICAL)

**Version:** v2.15 (January 2026)
**Status:** MANDATORY for all frontend AND email development

**All UI/UX work MUST use Design System v2 patterns and the component library.**

#### Using the Frontend Design Skill (IMPORTANT)

For any new visual design work (pages, components, email templates, redesigns):
```
/frontend-design
```
This skill ensures production-grade, polished designs that avoid generic AI aesthetics.

#### Component Library: `components/ui/`

Import from barrel: `import { Button, Badge, Modal, ... } from '@/components/ui'`

**Available Components (18 total):**

| Category | Components |
|----------|------------|
| Core | Button, Badge, Card, Modal |
| Form | Input, Select, Checkbox, FormField |
| Navigation | DropdownMenu, Tabs (with TabPanel) |
| Feedback | Alert, Toast, Skeleton (+ SkeletonCard, SkeletonClassCard) |
| Display | StatusIndicator, StatCard, Divider |
| Layout | Header, Footer |

#### Design Tokens (Tailwind Config)

**Typography:** `font-sora` (headings), `font-dm-sans` (body)

**Colors:**
- Primary: `primary-*` (#1a6fff) - main actions
- Success: `success-*` (#00c853) - confirmations, booked status
- Warning: `warning-*` (#ff9500) - pending status
- Danger: `danger-*` (#f43f5e) - destructive actions, failed status
- Purple: `purple-*` (#8B5CF6) - achievements, streaks, premium

**Visual Effects:**
- Gradients: `bg-gradient-primary`, `bg-gradient-success`, `bg-gradient-danger`, `bg-gradient-purple`
- Shadows: `shadow-card`, `shadow-floating`, `shadow-btn-primary`, `shadow-btn-success`
- Clip-paths: `clip-diagonal-badge`, `clip-diagonal-card-tr`, `clip-diagonal-card-br`

#### Development Rules

**Web UI:**
1. ❌ NEVER create inline buttons - use `<Button>` component
2. ❌ NEVER create inline form fields - use `<Input>`, `<Select>`, `<Checkbox>`
3. ❌ NEVER use arbitrary colors - use design tokens from tailwind.config.ts
4. ❌ NEVER create inline footers - use `<Footer>` component on ALL pages
5. ✅ ALWAYS import from `components/ui/`
6. ✅ ALWAYS run `/frontend-design` skill for new visual design work
7. ✅ ALWAYS use mobile-first responsive classes (design for 320px, enhance with sm:/lg:)
8. ✅ ALWAYS add `overflow-x-hidden` to layout root containers (prevents mobile horizontal scroll)
9. ✅ ALWAYS include `<Footer>` at bottom of every page

**Layout Components:**
- **Header:** Use `<Header>` for dashboard/protected pages (via EditorialLayout). Auth pages and landing page have custom headers.
- **Footer:** Use `<Footer>` on ALL pages. Props: `showTagline` (default: true), `className`, `style`

```tsx
// Standard footer with tagline
<Footer />

// Footer without tagline
<Footer showTagline={false} />
```

**Mobile-First Responsive Patterns:**
```tsx
// Grid: Single column on mobile, expand on larger screens
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

// Padding: Tighter on mobile
<div className="p-4 sm:p-6 lg:p-8">

// Typography: Larger hero text on mobile when visual elements hidden
<p className="text-5xl sm:text-4xl lg:text-7xl">  // 5xl mobile, scales down then up

// Visibility: Hide non-essential elements on mobile
<div className="hidden sm:block">  // Only visible sm+
<div className="hidden sm:flex">   // Flex only on sm+

// Buttons: Allow wrapping, responsive padding
<div className="flex flex-wrap gap-2 sm:gap-3">
<button className="px-3 sm:px-5 py-2 sm:py-2.5">
```

**Adaptive Component Example - SuccessRateCard:**
- Mobile (< 640px): Large percentage as hero, gauge hidden, legend hidden
- Tablet (640px+): Gauge visible (144px), legend visible
- Desktop (1024px+): Prominent gauge (240px), full visualization

**Email Templates:**
- **Location:** `lib/email/templates/`
- ✅ Use design token colors (primary #1a6fff, success #00c853, warning #ff9500, danger #f43f5e)
- ✅ Follow diagonal accent aesthetic where applicable
- ✅ Match responsive layout patterns from existing templates
- ✅ Test in Gmail/Outlook/Apple Mail

**UX Decision:** Buttons use `rounded-lg` (not diagonal) for clear affordance. Only badges use diagonal clip-path.

#### Reference Prototypes

- Main hub: `/prototype` - Design system showcase
- Scheduler redesign: `/prototype/scheduler-v2`
- Component showcase: `/prototype/design-system-components`

**Files:**
- `tailwind.config.ts` - Design token definitions
- `components/ui/index.ts` - Barrel export (import all components from here)
- `docs/DESIGN_SYSTEM.md` - Complete design system documentation
- `docs/COMPONENT_LIBRARY.md` - Component usage guide with full API docs

### 14. Immediate Scheduling (v2.13)

Users can trigger immediate scheduling by unpausing, activating a class, or removing a skip. System automatically schedules classes without waiting for midnight UTC daily scheduler.

**Two scheduling modes:**

**Silent Scheduling (Future Windows):**
- Booking window not yet open (`bookingTime > now`)
- Call `scheduleBooking()` in background
- No user dialogs or interruption
- Most common case

**User Prompt (Open Windows):**
- Booking window already open (`bookingTime <= now`)
- Show "Book Now" dialog with class details
- User decides: Book immediately or skip this week
- Sequential dialogs for multiple classes (unpause scenario)

**Implementation locations:**

**Backend:**
- `app/actions/user-settings.ts` - `updateSchedulePaused()` checks all active classes when unpausing
- `app/actions/recurring-classes.ts` - `toggleRecurringClassActive()` and `setSkipNextOccurrence()` check single class
- Return `classesWithOpenWindows` or `bookingWindowAlreadyOpen` + `classDetails` for UI prompts

**Frontend:**
- `components/PauseToggle.tsx` - Sequential dialogs for multiple classes (progress indicator)
- `components/SkipButton.tsx` - Single dialog for unskip
- `components/ScheduleList.tsx` - Single dialog for activate
- `components/RecurringClassForm.tsx` - Existing dialog updated with class details

**Dialog format:** "Booking window is open for **{CLASS_TYPE} - {DAY} {TIME} @ {BRANCH}**. Would you like to book now?"

**Duplicate prevention:** `scheduleBooking()` sends `booking/cancel` first, then new event. Only one event exists per class+date.

**Files:** `app/actions/user-settings.ts`, `app/actions/recurring-classes.ts`, `components/PauseToggle.tsx`, `components/SkipButton.tsx`, `components/ScheduleList.tsx`, `lib/inngest/scheduler.ts` (uses existing functions)

### 15. SEO & Metadata

Comprehensive SEO implementation with per-page metadata, dynamic sitemap, robots.txt, and social sharing images.

**Metadata Strategy:**
- **Public pages** (/, /login, /signup): Full SEO metadata with descriptions, OG tags, canonical URLs
- **Dashboard pages** (/dashboard/*): Titles only (for browser tabs/UX), not indexed
- **Auth utility pages** (forgot-password, reset-password, verify-email): Noindex
- **Prototype pages** (/prototype/*): Noindex

**Title Template:** `%s | My Workout Scheduler` (e.g., "Dashboard | My Workout Scheduler")

**Key Files:**
- `app/layout.tsx` - Root metadata with metadataBase, title template, OG defaults
- `app/sitemap.ts` - Dynamic sitemap (/, /login, /signup)
- `app/robots.ts` - Blocks /dashboard/, /prototype/, /api/
- `app/icon.svg`, `app/icon.tsx`, `app/apple-icon.tsx` - Favicon assets
- `app/opengraph-image.tsx`, `app/twitter-image.tsx` - Social sharing images

**Client Component Metadata Pattern:**
For client components (auth pages, prototype pages), create `layout.tsx` files to export metadata:
```tsx
// app/(auth)/login/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to manage your automated gym class bookings.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**Environment Variable:** `NEXT_PUBLIC_SITE_URL` - Used for sitemap, canonical URLs, OG images

---

## Operational Notes

### Event-Driven Architecture (Inngest)

- User creates/edits class → Next.js calculates booking window → Sends event to Inngest
- Inngest waits until exact time → Triggers booking function
- Daily scheduler (midnight UTC) re-schedules all active classes
- Monitor events in Inngest dashboard (pending, running, completed, failed)

### Pause/Resume Controls

- **Per-user:** Global pause toggle in dashboard settings
- **Per-class:** Active toggle on individual classes
- **Single occurrence:** "Skip Next" button

### Inngest Function Configuration Sync (CRITICAL)

When modifying Inngest function configurations (especially `cancelOn` patterns), Inngest must re-sync with the application to pick up changes:

**Problem:** Code changes deployed to Vercel are not automatically reflected in Inngest's cached function definitions. Old function configurations may persist in Inngest dashboard until manually synced.

**Solution - After updating Inngest functions:**

1. **Deploy code to Vercel** (via git push)
2. **Verify Vercel deployment** is complete and marked "Ready"
3. **Sync Inngest:**
   - Go to Inngest Dashboard → Apps
   - Find your app (your Vercel deployment)
   - Look for "Sync" button or similar refresh option
   - Click to force Inngest to fetch latest function definitions from your app
   - Wait for sync to complete

**Why this matters:** Changes to function configurations like `cancelOn` expressions won't take effect until Inngest re-syncs. Old runs created before sync will still have the old configuration baked in.

**Timeline:** Function definitions typically sync automatically within 5-10 minutes, but manual sync ensures immediate update.

**Files affected:** `lib/inngest/functions.ts` (any changes to function configs, retries, cancelOn, etc.)

---

## Security & Data Protection

### Row Level Security (RLS)

All tables have RLS policies ensuring users only see their own data. Pattern: `USING (auth.uid() = user_id)`

**Files:** `supabase/migrations/002_rls_policies.sql`

### Environment Variables

**Required for local dev:**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY` (generate with: `openssl rand -base64 32`)
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`
- `PUPPETEER_SKIP_DOWNLOAD=true` (required for Vercel builds)

**See:** `.env.example` for full template with comments

### Credential Storage

- Never commit `.env.local`, gym credentials, or encryption keys
- Always encrypt gym passwords before storing in database using `lib/encryption.ts`

---

## Known Issues and Gotchas

### Timezone Calculations (CRITICAL)

**Always use class timezone, not system timezone.** Common mistakes:
- Using `new Date()` without timezone context
- Parsing YYYY-MM-DD dates as UTC (causes off-by-one-day bugs)
- Not accounting for DST transitions

**Solution:** Use utilities from `lib/date-utils.ts` for all date/time operations.

### Booking Window Edge Cases

Clock drift may cause triggers slightly before window opens. Mitigated by fast retry loop (9×5s) that catches window as soon as it opens.

### User Deletion Limitation

⚠️ Inngest scheduled events are NOT canceled when users deleted. Events trigger but fail gracefully with "Class not found" message. Acceptable for MVP.

### Inngest Event Cancellation Behavior

**Current Behavior:**
- **Delete class**: Inngest events ARE canceled (sends `booking/cancel` event)
- **Make class inactive**: Inngest events are NOT canceled (events still fire)
- **Pause schedule**: Inngest events are NOT canceled (events still fire)

**Runtime Protection:**
Even when events fire for inactive/paused classes, the system safely prevents booking:
- `getClassById()` filters by `active = true` - inactive classes return null
- Booking function checks `schedule_paused` flag at runtime
- Events that can't find active classes return "Class not found" error
- No actual bookings occur, but events appear in Inngest logs

**Why This Design:**
- Runtime checks provide defense-in-depth protection
- Simpler than managing event cancellation for every state change
- Daily scheduler (midnight UTC) only schedules active classes going forward
- Similar to user deletion limitation (events not canceled but fail safely)

**For MVP:** Acceptable tradeoff - extra event runs are harmless, runtime checks prevent unwanted bookings.

**Future Consideration:** Could add event cancellation to inactive/pause actions to reduce noise in Inngest logs.

---

## Development Guidelines

### Code Style

- TypeScript strict mode enabled
- Use async/await (not callbacks)
- Prefer named exports over default exports
- Use descriptive variable names
- Comment complex logic (especially booking flow)

### Server Actions Pattern

All form submissions use Next.js Server Actions (`app/actions/`):
- Mark functions with `'use server'` directive
- Return structured results: `{ success: boolean, error?: string, ... }`
- Validate authentication before operations
- Revalidate paths after mutations (`revalidatePath`)

### Error Handling

- Always catch Puppeteer errors
- Log with context (user ID, class ID, timestamp)
- Save screenshots on booking failures
- Write errors to `booking_attempts` table
- Never swallow errors silently

### Database Queries

- Always use parameterized queries (prevent SQL injection)
- Filter by `user_id` (enforce RLS in application logic)
- Handle null/undefined cases
- Use TypeScript types for safety

---

## Essential Documentation

**Must-read for development:**
- `README.md` - Quick start and setup
- `docs/My Workout Scheduler PRD.md` - Full product specification
- `docs/BOOKING_AUTOMATION.md` - Automation system details
- `docs/PRODUCTION_TESTING.md` - Production testing guide
- `docs/ENVIRONMENT_VARIABLES_STRATEGY.md` - Environment variable strategy
- `docs/YMCA_BOOKING_FLOW_CONFIRMED.md` - Confirmed booking flow

**Helpful references:**
- `docs/ENV_QUICK_REFERENCE.md` - Quick environment variables guide
- `docs/PRODUCTION_EMAIL_SETUP.md` - Production email setup (Resend with DKIM)
- `docs/DATABASE_SETUP.md` - Database setup guide
- `docs/TESTING_BOOKINGS.md` - Testing instructions
- `.env.example` - Environment variables template

---

## Testing

### Test Scripts

```bash
npm run test:booking-dry-run       # Dry-run (no actual bookings)
npm run test:single-booking        # Single booking test (REAL booking!)
npm run test:booking-query         # Database query test
npm run test:database-helpers      # Database helpers test
npx tsx test-env-setup.ts          # Validate environment variables
npx tsx test-resend-email.ts       # Test email sending
```

**Important:** Always use dry-run tests first!

### Manual Testing Focus Areas

- Authentication flow (signup, login, verification, bot protection)
- Schedule management (add, edit, delete, copy, skip next)
- Booking automation (window detection, fuzzy matching, duplicate prevention)
- Timezone handling (DST transitions, multiple timezones)

---

## Common Development Tasks

### Adding a New Feature

1. Check if database schema changes needed → Add migration in `supabase/migrations/`
2. Update TypeScript types in `lib/database.types.ts`
3. Add UI components in `app/dashboard/`
4. Add server actions in `app/actions/`
5. Add database helpers in `lib/supabase/database.ts`
6. Test locally with `npm run dev`

### Debugging Booking Issues

1. Check Inngest dashboard for event status and logs
2. Review `booking_attempts` table in Supabase for error messages
3. Check screenshots artifact (if booking failed)
4. Verify booking window calculation using `lib/date-utils.ts` utilities
5. Test with dry-run script first

---

## Contact and Support

**Project Owner:** Brock Busby
**Repository:** https://github.com/beerock/my-workout-scheduler

**For issues:**
- Check documentation in `docs/`
- Review logs in Supabase Dashboard or Inngest Dashboard
- Check screenshots artifact for booking failures

---

**Last Updated:** January 2, 2026 (v2.19)
