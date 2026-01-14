# Backlog

This document tracks features and improvements organized by priority and status.

**Last Updated:** January 13, 2026

---

## Pre-MVP Required

Items that MUST be completed before MVP launch.

### Contact/Support Form
**Status:** Required before launch | **Priority:** High

Add contact form at `/contact` and support email link in footer for user support.

**Requirements:**
- Contact form with Name, Email, Subject dropdown, Message fields
- Send via Resend to help@beerock.com
- Pre-fill user info if logged in
- Add "Contact" link to footer

**Last Updated:** November 19, 2025

---

### Three-Zone Skip Cleanup Testing
**Status:** Production testing required | **Priority:** High

The three-zone skip cleanup logic (v2.12) needs comprehensive production testing to verify all time-based zones work correctly when users pause/deactivate classes.

**Test Document:** `docs/TESTING_SKIP_THREE_ZONE_LOGIC.md`

**Zones to test:**
- Zone A (before booking window): Preserve both skip fields
- Zone B (inside booking window): Clear flag only, keep datetime
- Zone C (after class time): Clear both fields

**Last Updated:** December 1, 2025

---

### Skip/Pause Interaction Behavior
**Status:** Decision made, needs documentation | **Priority:** Low

**Decision:** Skip state is independent and preserved regardless of pause/unpause actions. Current implementation is correct - no code changes needed, just documentation.

**Last Updated:** November 29, 2025

---

### Review Support Email
**Status:** Quick review needed | **Priority:** Low

Confirm `help@beerock.com` is correct in error pages before MVP launch.

**Files:** `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`

**Last Updated:** January 2, 2026

---

### SEO & Marketing
**Status:** Partially complete | **Priority:** Medium

**Completed (v2.19):** Metadata, sitemap, robots.txt, favicon, OG images, canonical URLs

**Still needed before launch:**
- Set `NEXT_PUBLIC_SITE_URL` in Vercel production
- Google Search Console setup
- Manifest.json for PWA

**Last Updated:** January 2, 2026

---

## Post-MVP: High Priority

Important features for near-term after launch.

### OAuth Login (Google/Apple)
**Status:** Backlogged | **Priority:** High

Add Google and Apple OAuth as preferred login method with account linking support.

**Key features:**
- OAuth buttons on login/signup pages
- Account linking in profile settings
- Profile photo from OAuth providers
- Users must maintain at least one login method

**Dependencies:** Google Cloud Console setup, Apple Developer setup, Supabase OAuth config

**Last Updated:** November 19, 2025

---

### Rate Limiting on Auth Endpoints
**Status:** Backlogged | **Priority:** Medium

Add rate limiting to prevent brute force attacks using Upstash Redis.

**Limits:**
- Login: 5 attempts per 15 minutes per IP
- Signup: 3 attempts per hour per IP
- Password reset: 3 attempts per hour per email

**Last Updated:** November 23, 2025

---

### Manual "Book Now" Button
**Status:** Backlogged | **Priority:** Medium

Add UI button to immediately trigger booking attempt for a class (bypassing scheduled automation).

**Requirements:**
- "Book Now" button on each active class
- Real-time status updates during booking
- Rate limiting to prevent spam

**Last Updated:** January 10, 2025

---

### Retry Status Indicators in Dashboard
**Status:** Backlogged | **Priority:** Medium

Show real-time retry status so users know when system is retrying vs needs action.

**Requirements:**
- Status badges: Confirmed, Retrying, Failed - Action Needed
- Retry info panel: next attempt time, attempts count
- Action callout for permanent failures with fix steps

**Dependencies:** Failure scenarios audit (completed v2.10)

**Last Updated:** November 28, 2025

---

### NextClassCard Failure Handling (Phase 2)
**Status:** Backlogged | **Priority:** Medium

Enhance NextClassCard to handle failure states and retry scenarios. Phase 1 (booking status display) completed in v2.17.

**Requirements:**
- Show "Retrying" state with next retry time
- Skip failed classes, show next bookable class
- Failure alert banner with error details

**Last Updated:** January 2, 2026

---

### User Troubleshooting Guide
**Status:** Backlogged | **Priority:** Medium

Create user-facing documentation for diagnosing common booking failures.

**Sections needed:**
- Common failure scenarios (from v2.10 audit)
- Self-service debugging tools
- Quick fixes checklist
- When to contact support

**Last Updated:** November 28, 2025

---

### Admin Dashboard
**Status:** Backlogged | **Priority:** Medium

Admin UI for user management and analytics without direct database access.

**Phase 1 (first priority):**
- User list with search/filter
- User details view
- Delete user with audit logging

**Future phases:** Analytics charts, bulk operations, system settings

**Last Updated:** November 21, 2025

---

### Real-time Status Updates
**Status:** Backlogged | **Priority:** Medium

Update booking status in UI without page refresh using Supabase Realtime.

**Last Updated:** January 10, 2025

---

## Post-MVP: Low Priority

Nice-to-have features that aren't critical.

### My Schedule Filtering & Sorting
**Status:** Backlogged | **Priority:** Low

Add filter and sort controls to the My Schedule page, similar to Booking History. Helps users with multiple classes quickly find and manage specific classes.

**Requirements:**
- Filter by status: All, Active, Inactive, Skipped
- Sort options: Day ascending/descending, next booking, class name
- Persist filter/sort preferences in URL params or localStorage

**Last Updated:** January 13, 2026

---

### Email Notification Enhancements
**Status:** Schema ready, implementation deferred | **Priority:** Low

**Items:**
- Daily digest (one summary email per day)
- Weekly summary alternative
- Dedicated unsubscribe page (currently links to account settings)
- Email delivery tracking via Resend webhooks
- First booking success celebration email
- Credentials updated security email

**Last Updated:** November 2025

---

### "Stay Logged In" Checkbox
**Status:** Backlogged | **Priority:** Low

Add checkbox on login page to control session persistence.

- Checked: Session persists across browser restarts
- Unchecked: Session ends when browser closes

**Last Updated:** November 19, 2025

---

### Supabase Double Confirm Email Changes
**Status:** Config change needed | **Priority:** Low

Disable "Secure email change" in Supabase to send only ONE verification email instead of two. Password verification already proves identity.

**Action:** Toggle off in Supabase Dashboard → Authentication → Settings

**Documentation:** `docs/SUPABASE_EMAIL_SETTINGS.md`

**Last Updated:** November 19, 2025

---

### Unverified Account Cleanup Job
**Status:** Backlogged | **Priority:** Low

Daily cron to delete accounts where `email_confirmed_at IS NULL AND created_at > 48 hours old`.

**Last Updated:** November 23, 2025

---

### Booking Automation Improvements
**Status:** Backlogged | **Priority:** Low

**Items:**
- Early exit on page load failure (break retry loop if schedule doesn't load)
- Exponential backoff for outer retry loop (15s → 30s → 60s)
- Booking performance metrics (timing, retry counts, detection stats)

**Last Updated:** November 27, 2025

---

### Multi-Branch Fallback Logic
**Status:** Backlogged | **Priority:** Low

Auto-try fallback branches when primary branch class is full/unavailable.

**Last Updated:** January 10, 2025

---

### Performance Optimizations
**Status:** Backlogged | **Priority:** Low

**Items:**
- Browser session reuse (one browser per user for multiple classes)
- Cookie persistence across automation runs (skip login if cookies valid)

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

### Multi-Gym Support
**Status:** Backlogged | **Priority:** Low

Support multiple gym systems with gym-specific forms and booking scripts. Includes timezone inheritance from gym entity.

**Last Updated:** November 2025

---

### Event Cancellation for Pause/Inactive/Skip
**Status:** Backlogged | **Priority:** Low

Cancel Inngest events when user pauses, deactivates, or skips (currently relies on runtime checks).

**Current behavior:** Events still fire but runtime protection prevents booking. Acceptable for MVP.

**When to implement:** If log noise becomes a problem at 50+ users

**Last Updated:** December 29, 2025

---

### Email Notification Case Study
**Status:** Backlogged | **Priority:** Low

Portfolio case study for `/prototype/email-notifications` page.

**Planning document:** `docs/CASE_STUDY_PLANNING.md`

**Last Updated:** November 2025

---

## Completed (Summary)

Brief summaries of completed work. See PRD version history for full details.

### Event-Driven Trigger Architecture ✅
**Completed:** November 16, 2025 (v2.0)

Migrated from 15-minute cron polling to Inngest event-driven architecture. Bookings now trigger at exact booking window times with zero wasted runs. Architecture: Inngest → GitHub Actions → Supabase.

---

### Retry Logic for Full Classes ✅
**Completed:** November 16, 2025 (v2.0)

Two-tier retry strategy: (1) Clock drift retries within Puppeteer (12×15s), (2) Class full retries via Inngest (every 15 min until class starts).

---

### Password Security Requirements ✅
**Completed:** January 2026 (v2.25)

Implemented password complexity: 8+ chars, lowercase, uppercase, digit. Visual checklist on signup/password forms. Server-side validation.

---

### Production Email Configuration ✅
**Completed:** November 2025

Domain `beerock.com` verified in Resend. DKIM enabled. Production emails from `noreply@beerock.com`.

---

### User Profile Email Verification Notifications ✅
**Completed:** November 19, 2025

Email verification success notifications on dashboard and profile pages. Detects multiple Supabase redirect patterns.

---

### Skip/Edit Interaction Behavior ✅
**Completed:** November 30, 2025 (v2.12)

When editing class day/time, skip is cleared with user confirmation modal. Other edits (branch, class type) preserve skip state.

---

### Authentication Security Priority 1 ✅
**Completed:** November 23, 2025 (v2.9)

Password confirmation on signup, resend verification on login, Cloudflare Turnstile bot protection, persistent auth notifications.

---

## Archived

Items deprioritized or unlikely to be implemented.

### Daxko API Integration
**Status:** Archived - Requires partner access

Direct API integration would replace Puppeteer automation, but Daxko API requires partner status. Research stalled.

---

### SMS Notifications
**Status:** Archived - Cost concerns

Per-message SMS costs not justified for MVP. Email notifications sufficient.

---

### GitHub Actions Automation Delay
**Status:** Archived - Acceptable as-is

~60 second delay after booking script completes before next workflow step. Not worth fixing - bookings succeed correctly.

---

### Duplicate Detection Race Window
**Status:** Archived - Defense-in-depth, acceptable

45-second race window where duplicate bookings could both proceed. Unlikely in practice due to Inngest idempotency keys.

---

## Operational Notes

### Production Deployment
- **URL:** https://my-workout-scheduler.vercel.app
- **Architecture:** Inngest → GitHub Actions (Puppeteer) → Supabase
- **Monitoring:** Inngest Dashboard

### Required Inngest Sync
Manual sync required in Inngest dashboard after deploying function changes.

### User Deletion
Inngest events NOT canceled on user delete (fail gracefully, acceptable for MVP).
