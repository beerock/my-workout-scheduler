# Backlog

This document tracks features and improvements organized by priority and status.

**MVP Status:** v1.0 released January 8, 2026 with email notification system complete. All sections below are post-MVP work.

**Last Updated:** April 28, 2026

---

## Post-MVP: High Priority (Deferred from MVP)

High-priority items that were initially planned for MVP but deferred to post-launch.

### Credential Testing on Credentials Page
**Status:** Backlogged | **Priority:** High

Allow users to test their gym credentials before saving, ensuring they work with the booking system (GroupExPro login). Painful during recent onboarding - should tie into invite code onboarding flow.

**Requirements:**
- "Test Credentials" button on credentials page
- Attempts GroupExPro login to verify credentials work
- Clear success/failure feedback
- Consider integration with invite code onboarding flow

**Dependencies:** Invite Code Signup Gate (for onboarding flow integration)

**Last Updated:** April 6, 2026

---

### SEO & Marketing
**Status:** Partially complete | **Priority:** Medium

**Completed (v2.19):** Metadata, sitemap, robots.txt, favicon, OG images, canonical URLs, `NEXT_PUBLIC_SITE_URL` set in Vercel production.

**Still needed:**
- Google Search Console setup
- Manifest.json for PWA

**Last Updated:** April 6, 2026

---


## Post-MVP: High Priority

Important features for near-term after launch.

### Separate Inngest Apps per Environment
**Status:** Backlogged | **Priority:** High

Inngest currently auto-syncs to the most recent Vercel deployment (preview OR production). Every preview commit on a feature branch redirects Inngest away from production, which means real users receive booking emails from the preview env — including the `(Preview)` suffix in `RESEND_FROM_NAME` that was observed during Sprint 1. Merging a feature branch swings Inngest back to production automatically, but the next feature-branch push swings it back to preview.

Fix: configure Inngest to maintain TWO registered apps — one permanently pointed at production, one for preview — so booking events in production are always routed to production, and preview deploys serve only as an integration-testing surface with their own isolated event pipeline.

**Requirements:**
- Register production app with Vercel integration tied to production deploys only
- Register preview app separately (may use env-scoped function registration)
- Confirm production events never flow to preview and vice versa
- Document the setup in `docs/INNGEST_SETUP.md`

**Dependencies:** Understanding of Inngest's Vercel integration options (may require Inngest support contact)

**Last Updated:** April 22, 2026

---

### Invite Code Signup Gate
**Status:** Backlogged | **Priority:** High

Allow new users to sign up only with a valid invite code. Replaces the current hard-disabled signup page with a gated flow for smoother friend onboarding.

**Requirements:**
- Invite code input field on signup page (shown before the registration form)
- Valid code unlocks the full signup form
- Admin can generate and manage invite codes (Supabase table)
- Codes can be single-use or multi-use with an optional expiration

**Dependencies:** Manual DB inserts for MVP

**Last Updated:** April 6, 2026

---

### OAuth Login (Google/Apple)
**Status:** Backlogged | **Priority:** High

Add Google and Apple OAuth as preferred login method with account linking support.

**Requirements:**
- OAuth buttons on login/signup pages
- Account linking in profile settings
- Users must maintain at least one login method

**Dependencies:** Google Cloud Console setup, Apple Developer setup, Supabase OAuth config

**Last Updated:** April 6, 2026

---

### Retry Chain Cancellation Fix
**Status:** Backlogged | **Priority:** High

When a user cancels/deletes a class during a retry cycle, `cancelOn` kills the sleeping run but the already-dispatched retry event spawns a new uncancellable run. Fix by either looping retries within one function invocation or re-checking class state before proceeding.

**Last Updated:** April 6, 2026

---

### Timeout Retry Double-Book Prevention
**Status:** Backlogged | **Priority:** High

When the 10-minute `waitForEvent` times out, the function schedules a retry without checking if GitHub Actions already completed successfully. This could trigger a second booking attempt. Fix by querying `booking_attempts` status before retrying after timeout.

**Last Updated:** April 6, 2026

---

---

## Post-MVP: Medium Priority

### GitHub Timeout Handling
**Status:** Planned | **Priority:** Medium

Improve handling of GitHub Actions delays/outages. Currently, 10m timeout causes false failure states. GH Actions has been reliable in practice, so this is not urgent.

**Plan Document:** `docs/plans/GITHUB_TIMEOUT_HANDLING.md`

**Last Updated:** April 6, 2026

---

### Transient Error Retry During Full-Class Retries
**Status:** Backlogged | **Priority:** Medium

If a retry attempt fails for a non-"full" reason (timeout, network error, etc.), continue the retry cycle rather than giving up permanently.

**Last Updated:** January 18, 2026

---

---

### Retry Logic Error Code Refactor
**Status:** Backlogged | **Priority:** Medium

Retry trigger uses `errorMessage?.toLowerCase().includes('full')` which is fragile. 4 different "class full" detection implementations across 6 files with inconsistent keyword coverage. `isClassFullError` misses `'no spots'` and `'no waitlist option'`. Refactor to a single shared function with structured error codes.

**Partially addressed:** "Already Registered" plan adds "filled to capacity" detection and touches several of the same files. Remaining work is consolidating all 6 files to use one shared detection function.

**Files:** `lib/booking-error-utils.ts`, `lib/notifications/send-booking-notification.ts`, `lib/email/get-email-template.ts`, `app/actions/dashboard-stats.ts`, `app/actions/booking-history.ts`, `lib/inngest/functions.ts`

**Last Updated:** April 7, 2026

---

### Replace window.alert() with Inline Alerts
**Status:** Backlogged | **Priority:** Medium

12 instances of `window.alert()` in SkipButton (6) and ScheduleList (6) for error feedback. Replace with inline `<Alert variant="error">` components, consistent with the rest of the app.

**Last Updated:** April 29, 2026

---

### Supabase Error Destructure Gaps
**Status:** Backlogged | **Priority:** Medium

Three Supabase queries in `app/actions/recurring-classes.ts` (lines 571, 715) and `lib/inngest/functions.ts` (lines 377, 568) drop the `error` field from destructuring. On query failure, callers silently fall through with `null` data — no breadcrumb in logs. Per CLAUDE.md rule, all Supabase queries must destructure `{ data, error }` and log errors with a `[module-name]` prefix.

**Requirements:**
- Destructure `error` on all four queries
- Log with `console.error('[module]', error)` before any fallback

**Last Updated:** April 29, 2026

---

### Duplicate Booking Run Prevention
**Status:** Backlogged | **Priority:** Medium

Inngest `check-duplicate-runs` step queries for pending booking attempts before the current attempt record is created, so two simultaneous runs both pass the check.

**Last Updated:** April 3, 2026

---

### Duplicate Check Window & Re-Trigger UX
**Status:** Backlogged | **Priority:** Medium

The `check-duplicate-runs` step blocks new booking attempts if a `pending` attempt exists for the same class within the last 5 minutes. This is overly conservative -- GitHub Actions runs typically complete in 60-90 seconds. If a user triggers a booking, realizes they selected the wrong day/time, edits the class, and retries, they may have to wait several minutes with no feedback.

**Requirements:**
- Evaluate reducing the 5-minute window (e.g., 2 minutes)
- Consider cancel-and-replace: when user edits + retriggers, cancel the pending attempt before sending a new one
- Add UI feedback ("Booking in progress...") on the class card so users understand why retry is blocked

**Last Updated:** April 8, 2026

---

### PauseBanner Inline Error Display
**Status:** Backlogged | **Priority:** Medium

The PauseBanner inline variant (header button) has no error display - when pause/resume fails, the user sees nothing. The banner variant correctly shows errors.

**Last Updated:** April 6, 2026

---

### Retry Status Indicators in Dashboard
**Status:** Backlogged | **Priority:** Medium

Show real-time retry status so users know when system is retrying vs needs action.

**Last Updated:** November 28, 2025

---

### NextClassCard Failure Handling (Phase 2)
**Status:** Backlogged | **Priority:** Medium

Enhance NextClassCard to handle failure states and retry scenarios.

**Last Updated:** January 2, 2026

---


### Real-time Status Updates
**Status:** Backlogged | **Priority:** Medium

Update booking status in UI without page refresh using Supabase Realtime.

**Last Updated:** January 10, 2025

---

### Manual "Book Now" Button
**Status:** Backlogged | **Priority:** Medium

Add UI button to immediately trigger booking attempt for a class.

**Last Updated:** January 10, 2025

---

### Email Template Design Consolidation
**Status:** Backlogged | **Priority:** Medium

Booking email templates have been touched piecemeal over time and have diverged in structure (different box colors, inconsistent section ordering, varied action patterns, repeated tel: link building across 4 files). Do a full design pass across all booking templates to consolidate shared layouts and reuse common section components.

**Requirements:**
- Extract shared helpers for phone tel-link construction (currently duplicated 4x)
- Standardize the class info card, "what to do next" guidance block, and action box patterns
- Audit visual hierarchy and voice consistency across all failure/success templates

**Last Updated:** April 10, 2026

---

## Post-MVP: Low Priority

Nice-to-have features that aren't critical.

### `reset-password` rewriteAuthError Coverage
**Status:** Backlogged | **Priority:** Low

`app/(auth)/reset-password/page.tsx` passes Supabase `updateUser` errors directly to `setError(error.message)` without running them through `rewriteAuthError()` (the helper added in v2.36 that rephrases Supabase's raw rate-limit message). In practice this is unreachable — reset-password requires a fresh magic-link session so the rate limiter effectively can't fire — but for coverage parity with `/forgot-password`, `/login`, and `/verify-email`, wrapping the error in `rewriteAuthError()` keeps the pattern consistent.

**Requirements:**
- Import `rewriteAuthError` from `@/lib/auth-error-utils`
- Wrap the two `setError(error.message)` sites in the handler + catch block

**Last Updated:** April 22, 2026

---

### Memoize `FirstBookingPreview` Computation
**Status:** Backlogged | **Priority:** Low

`computeFirstBookingInfo()` runs on every `RecurringClassForm` render (and the preview component itself re-runs it). The payload is tiny — four primitives in, one formatted string out — so real-world keystroke latency is negligible. But if form-interaction perf ever surfaces as a concern, wrap the call in `useMemo` keyed on `dayOfWeek + classTime + bookingWindowHours + timezone` to skip redundant date-math work.

**Last Updated:** April 22, 2026

---

### Tokenize Custom Card Shadows
**Status:** Backlogged | **Priority:** Low

Two cards use inline `boxShadow` with custom rgba values because no existing `shadow-*` token matches. Single-use, so tokenizing now would be premature abstraction — revisit if a third surface needs the same treatment.

**Components:**
- `NextClassCard` dark-gradient depth shadow (`0 4px 16px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)`)
- `GetStartedBanner` purple-glow shadow (`0 4px 24px rgba(139,92,246,0.25), 0 8px 32px rgba(124,58,237,0.15)`)

**Last Updated:** April 21, 2026

---

### Code Cleanup Sprint
**Status:** Backlogged | **Priority:** Low

Combined cleanup items from multiple audits (April 2026):
- Delete `booking-automation-daxko-backup.ts` (dead Daxko flow, 80K)
- Remove unused `DropdownMenu` component
- Remove unused `StatusIndicator` and `StatCard` components (prototype-only)
- Remove unused env-utils exports (`isProduction`/`isDevelopment`/`isPreview`/`validateEnv`/`getEnvironment`/`getResendApiKey`)
- Remove dead export `calculateClassStartTime` from scheduler.ts
- Remove Toast infrastructure (ToastContext, ToastProvider in layout, Toast component) - unused, use Alert instead
- Delete `app/api/test-db/route.ts` (test endpoint in production)
- Delete empty `app/api/book-classes/` directory
- Remove `getClassesNeedingBooking()` from database-helpers.ts (dead pre-Inngest code)
- Remove unused Insert type aliases from database.types.ts
- Register remaining scripts in package.json
- Extract shared stats card components (duplicated between dashboard and schedule pages)

**Last Updated:** April 7, 2026

---

### Email Template XSS Hardening
**Status:** Backlogged | **Priority:** Low

7 booking email templates (all success-side: success, waitlist, retry-successful, retry-waitlisted, already-registered, already-waitlisted, no-registration) interpolate `className` and `branchName` as raw HTML without `escapeHtml()`. Failure-side templates already escape. Low risk for closed system with 3 trusted users and curated class dropdown. Modern email clients strip scripts.

**Last Updated:** April 28, 2026

---

### RLS Policy Tightening
**Status:** Backlogged | **Priority:** Low

`notification_log` and `notification_digest_queue` have INSERT/UPDATE/DELETE policies allowing `{public}` role with `qual = true`. These should be restricted to `service_role` only.

**Last Updated:** April 6, 2026

---

### Notification Dedup with Admin Toggle
**Status:** Backlogged | **Priority:** Low

When admin email toggles suppress an email, it logs with `delivery_status: 'failed'`, which counts as "already sent" in dedup checks. Affects welcome emails and class-full retry notifications. Fix by filtering dedup queries to `delivery_status = 'sent'`.

**Last Updated:** April 6, 2026

---

### Server-Side Input Validation Gaps
**Status:** Backlogged | **Priority:** Low

Several server actions lack validation that the client enforces: `class_time` format not validated, `booking_window_hours` uses `|| 26` (swallows explicit zero), no length limits on `class_type`/`branch`, gym credentials username has no length limit.

**Last Updated:** April 6, 2026

---

### Arbitrary Hex Color Cleanup
**Status:** Backlogged | **Priority:** Low

DiagonalBadge `pending` gradient, GetStartedBanner purple gradient, and PauseBanner Resume button use arbitrary hex colors instead of design tokens.

**Last Updated:** April 6, 2026

---

### Contact/Support Form
**Status:** Backlogged | **Priority:** Low

Add contact form at `/contact` for user support. Not needed while system is closed to friends who can reach out directly.

**Last Updated:** April 6, 2026

---

### Rate Limiting on Auth & Booking Endpoints
**Status:** Backlogged | **Priority:** Low

Application-level rate limiting via Upstash Redis. Not needed with 3 trusted users, Supabase rate limits provide baseline protection.

**Last Updated:** April 6, 2026

---

### Admin Dashboard
**Status:** Backlogged | **Priority:** Low

Admin UI for user management. Supabase Studio works fine for 3 users.

**Last Updated:** April 6, 2026

---

### User Troubleshooting Guide
**Status:** Backlogged | **Priority:** Low

User-facing documentation for diagnosing common booking failures.

**Last Updated:** November 28, 2025

---

### My Schedule Filtering & Sorting
**Status:** Backlogged | **Priority:** Low

Add filter and sort controls to the My Schedule page.

**Last Updated:** January 13, 2026

---

### Dashboard Branch Contact Info Panel
**Status:** Backlogged | **Priority:** Low

Surface the branch phone number and address (from `YMCA_BRANCH_INFO` in `lib/constants/ymca.ts`) as an expandable detail on the schedule page or class detail views. Address field is already stored but not yet surfaced anywhere in the UI. This is polish that builds on the v2.35 phone-in-emails work.

**Last Updated:** April 10, 2026

---

### Admin-Only Filter for Test Scripts
**Status:** Backlogged | **Priority:** Low

Dry-run and booking test scripts (`test-booking-automation-dry-run.ts`, `run-booking-automation.ts`) currently query the database for whatever class is next in the booking window regardless of user, which can surface other users' classes and decrypt their credentials during test runs. Per CLAUDE.md's testing rule ("Always use admin account... Never use other users' classes or credentials"), these scripts should filter to the admin user only.

**Requirements:**
- Filter test scripts to admin UID only via `ADMIN_USER_IDS` env var
- Affects: `scripts/test-booking-automation-dry-run.ts`, `scripts/run-booking-automation.ts`, `scripts/test-single-booking.ts`

**Last Updated:** April 10, 2026

---

### Drop Stale Daxko `gym_url` Column
**Status:** Backlogged | **Priority:** Low

The `gym_url` column in the `gym_credentials` table still holds stale Daxko URLs (e.g. `https://operations.daxko.com/online/4032/GXP/ClassSchedule.mvc`) from before v2.32 when Daxko was removed from the booking flow. The field was removed from the credentials form in v2.33 but the column, its data, and ~10 code references remain. Booking automation hardcodes the GroupExPro flow and ignores the column entirely.

**Requirements:**
- Add migration to drop the `gym_url` column
- Remove references in `lib/database.types.ts`, `app/actions/gym-credentials.ts`, `scripts/database-helpers.ts`, `scripts/run-booking-automation.ts`, `scripts/test-*.ts`, `app/dashboard/schedule/page.tsx`
- Verify no components still read the field

**Last Updated:** April 10, 2026

---

### Admin CMS / Database-Driven Class Catalog
**Status:** Backlogged | **Priority:** Low

Move gym reference data from constants file to database tables with admin interface, including editable branch contact info (phone, address) currently hardcoded in `lib/constants/ymca.ts` via `YMCA_BRANCH_INFO`.

**Dependencies:** Multi-org support, admin dashboard

**Last Updated:** April 10, 2026

---

### Email Notification Enhancements
**Status:** Schema ready, implementation deferred | **Priority:** Low

Daily digest, weekly summary, dedicated unsubscribe page, delivery tracking, celebration/security emails.

**Last Updated:** January 2026

---

### "Stay Logged In" Checkbox
**Status:** Backlogged | **Priority:** Low

Add checkbox on login page to control session persistence.

**Last Updated:** November 19, 2025

---

### Supabase Double Confirm Email Changes
**Status:** Config change needed | **Priority:** Low

Disable "Secure email change" in Supabase to send only ONE verification email.

**Last Updated:** November 19, 2025

---

### Unverified Account Cleanup Job
**Status:** Backlogged | **Priority:** Low

Daily cron to delete unverified accounts older than 48 hours.

**Last Updated:** November 23, 2025

---

### Booking Automation Improvements
**Status:** Backlogged | **Priority:** Low

Early exit on page load failure, exponential backoff, performance metrics.

**Last Updated:** November 27, 2025

---

### Multi-Branch Fallback Logic
**Status:** Backlogged | **Priority:** Low

Auto-try fallback branches when primary branch class is full/unavailable.

**Last Updated:** January 10, 2025

---

### Performance Optimizations
**Status:** Backlogged | **Priority:** Low

Browser session reuse and cookie persistence across automation runs.

**Last Updated:** January 14, 2025

---

### Class Cancellation Detection
**Status:** Backlogged | **Priority:** Low

Detect when gym cancels a booked class and notify user.

**Last Updated:** January 10, 2025

---

### Gym Site Class Listing Scraper
**Status:** Backlogged | **Priority:** Low

Scrape gym website to auto-populate class dropdowns instead of manual entry.

**Last Updated:** January 10, 2025

---

### Enhanced Booking History & Analytics
**Status:** Backlogged | **Priority:** Low

Analytics dashboard with success rates, failure reasons, trends over time.

**Last Updated:** January 10, 2025

---

### Product Analytics (PostHog)
**Status:** Backlogged | **Priority:** Low

Add PostHog for deeper behavioral analytics beyond Vercel Analytics traffic counts. Useful if product questions emerge that traffic-only analytics can't answer — e.g., where users drop off in the Add Class flow, or which features go unused. Vercel Analytics (added April 10, 2026) covers pageviews and Core Web Vitals; PostHog would add funnels, session replay, and feature flags.

**Requirements:**
- Install `posthog-js` and initialize client-side in root layout
- Define initial event taxonomy (signup, add_class, booking_success, pause, skip)
- Configure PII masking if enabling session replay
- Evaluate free-tier quota (1M events/mo, 1 year retention) vs. usage

**Dependencies:** None

**Last Updated:** April 11, 2026

---

### Multi-Gym Support
**Status:** Backlogged | **Priority:** Low

Support multiple gym systems with gym-specific forms and booking scripts.

**Last Updated:** November 2025

---

### Event Cancellation for Pause/Inactive/Skip
**Status:** Backlogged | **Priority:** Low

Cancel Inngest events when user pauses, deactivates, or skips. Currently relies on runtime checks, acceptable for MVP.

**Last Updated:** December 29, 2025

---

### Auth Callback Error Param Sanitization
**Status:** Backlogged | **Priority:** Low

Use error codes instead of raw messages in auth callback URL params.

**Last Updated:** February 10, 2026

---

### Email Notification Case Study
**Status:** Backlogged | **Priority:** Low

Portfolio case study for `/prototype/email-notifications` page.

**Last Updated:** November 2025

---

### Test-Driven Iteration Loop for Booking Automation
**Status:** Backlogged | **Priority:** Low

Assertion-based test specs for the Puppeteer booking flow.

**When to implement:** Next time booking automation needs significant iteration.

**Last Updated:** February 13, 2026

---

### Migrate Puppeteer to Playwright
**Status:** Backlogged | **Priority:** Low

Replace Puppeteer with Playwright for better auto-wait, selectors, and debugging.

**When to implement:** Next time booking scripts need significant changes.

**Last Updated:** April 1, 2026

---

### CI Failure Diagnostic Prompt
**Status:** Backlogged | **Priority:** Low

Ready-made prompt for diagnosing GitHub Actions failures.

**When to implement:** When CI failures become frequent enough to justify setup.

**Last Updated:** February 13, 2026

---

### Pre-Launch Checklist Cleanup
**Status:** Backlogged | **Priority:** Low

`docs/PRE_LAUNCH_CHECKLIST.md` is stale (Jan 2026). Most items are done. Collapse completed sections, remove generic QA checklists, fix stale `NEXT_PUBLIC_APP_URL` reference. Only outstanding items: Supabase rate limits (separate backlog entry), admin email toggle verification, redirect URL confirmation.

**Last Updated:** April 6, 2026

---

## Completed (Summary)

Brief summaries of completed work. See PRD version history for full details.

### Booking History Dedup + Multi-Category Error Expansion ✅
**Completed:** April 26, 2026 (v2.37)

Repeated attempts for the same class on the same calendar day collapse into one history card (first→last time range, attempt count). Success rate deduplicates by class occurrence via `computeTargetClassDate` so 50 retries count as one outcome. Expanded error section shows all unique failure categories by priority (critical → config → technical → retrying), each with its own icon, attempt count, and error messages; collapsed toggle shows only the top-priority label.

---

### No Auto-Registration Detection ✅
**Completed:** April 8, 2026

Classes without online registration (drop-in, special programs, paid programs) now return `no_registration` status instead of a scary critical failure email. Sends a friendly blue info email explaining the class doesn't offer online booking. Weekly re-detection, respects `email_on_success` preference.

---

### Already-Booked Email Templates & Duplicate Prevention ✅
**Completed:** April 8, 2026

New "Great news! You're already registered/waitlisted" email templates when automation detects user is already booked. Added "filled to capacity" detection on class details page to trigger retry chain. Fixed missing `booking/cancel` in trigger-booking endpoint to prevent duplicate booking runs.

---

### getDashboardStats Query Parallelization ✅
**Completed:** April 7, 2026

Parallelized 3 independent Supabase queries (active count, user classes, booking attempts) with `Promise.all`. Saves ~200-400ms per dashboard/schedule page load.

---

### Skip/Pause Independence & Documentation ✅
**Completed:** April 7, 2026

Removed three-zone skip cleanup from pause path - pause and skip are fully independent. Pausing never modifies skip fields. Deactivating clears both skip fields with user confirmation. Documented in CLAUDE.md and PRD.

---

### Support Email Verified ✅
**Completed:** April 7, 2026

`help@beerock.com` confirmed consistent across all 9+ files (error pages, email templates, booking scripts, docs).

---

### Supabase Rate Limits Tightened ✅
**Completed:** April 6, 2026

Auth rate limits configured in Supabase Dashboard: 25 emails/hr, 10 sign-ups/sign-ins per 5 min.

---

### Timezone Bug Fixes & Audit Quick Fixes ✅
**Completed:** April 6, 2026 (v2.34)

Fixed 3 timezone bugs (getFixedClassStartTime, calculateNextClassDate, calculateNextOccurrence) and skip zone UTC comparison. Removed screenshot references from error messages, fixed escapeHtml on email subject, gitignored debug directory.

---

### Code Cleanup from Class Selector Audit ✅
**Completed:** April 3, 2026

All 6 items resolved: dead ternary, `substr` replaced with `useId()`, custom option ARIA fix, `updateData: any` typed, `lib/env.ts` consolidated.

---

### Early-Start Booking Optimization ✅
**Completed:** April 1, 2026 (v2.32)

Inngest fires events 90s before booking window. Booking click within 2-4s of window opening (was ~57s).

---

### Supabase Free-Tier Keep-Alive ✅
**Completed:** March 19, 2026 (v2.31)

Dedicated Inngest cron (every 3 days) prevents Supabase free-tier database pause.

---

### Disable Supabase Signups at Dashboard Level ✅
**Completed:** February 18, 2026

Disabled signups in Supabase Dashboard, complementing UI and server action blocks.

---

### GitHub Actions Workflow Caching ✅
**Completed:** January 18, 2026

Cache for node_modules and Puppeteer browsers. ~90s to ~60s on cache hits.

---

### Password Security Requirements ✅
**Completed:** January 2026 (v2.25)

Password complexity: 8+ chars, lowercase, uppercase, digit. Visual checklist and server-side validation.

---

### Event-Driven Trigger Architecture ✅
**Completed:** November 16, 2025 (v2.0)

Migrated from 15-minute cron to Inngest event-driven architecture.

---

### Retry Logic for Full Classes ✅
**Completed:** November 16, 2025 (v2.0)

Class full retries via Inngest every 15 min until class starts.

---

### Authentication Security Priority 1 ✅
**Completed:** November 23, 2025 (v2.9)

Password confirmation, resend verification, Turnstile bot protection.

---

### Skip/Edit Interaction Behavior ✅
**Completed:** November 30, 2025 (v2.12)

Skip cleared with confirmation on day/time edit, preserved for other edits.

---

### Production Email Configuration ✅
**Completed:** November 2025

Domain beerock.com verified in Resend. DKIM enabled.

---

### User Profile Email Verification Notifications ✅
**Completed:** November 19, 2025

Email verification success notifications on dashboard and profile pages.

---

## Archived

Items deprioritized or unlikely to be implemented.

### Daxko API Integration
Archived - Daxko no longer in booking flow (migrated to GroupExPro)

### SMS Notifications
Archived - Per-message costs not justified. Email sufficient.

### GitHub Actions Automation Delay
Archived - ~60s delay acceptable, bookings succeed correctly

### Duplicate Detection Race Window
Archived - 45s race window unlikely in practice due to Inngest idempotency keys

---

## Operational Notes

### Production Deployment
- **URL:** https://myworkout.beerock.com
- **Architecture:** Inngest -> GitHub Actions (Puppeteer) -> Supabase
- **Monitoring:** Inngest Dashboard
- **Users:** 3 active (closed friend group, invite-only)

### Inngest Sync
Auto-syncs on Vercel deploy (configured). No manual sync needed.

### User Deletion
Inngest events NOT canceled on user delete (fail gracefully, acceptable for MVP).

### ENCRYPTION_KEY
Production key scoped to Production only in Vercel (April 6, 2026). Dev/preview needs separate key added.
