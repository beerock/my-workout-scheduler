# Pre-Launch Checklist for MVP

This document tracks infrastructure and configuration tasks for production readiness.

**Status:** Live with 3 users (private beta, invite-only)

---

## Security & Rate Limiting

### Supabase Auth Rate Limits

**Configured April 6, 2026:**
- Sending emails: 25/hour
- Sign-ups and sign-ins: 10/5min
- Other limits: Supabase defaults (acceptable for 3 users)

No further action needed unless user count grows significantly.

---

## Email Configuration

### Resend Domain Settings

- [x] Domain: beerock.com (DKIM verified, SPF configured)
- [x] Sender: noreply@beerock.com
- [x] Click Tracking: Disabled (was causing redirect issues)
- [x] All email flows tested Jan 9, 2026

### Admin Email Toggles

- [x] `ADMIN_DISABLE_ALL_EMAILS` - Not set (verified April 7, 2026)
- [x] `ADMIN_DISABLE_BOOKING_EMAILS` - Not set (verified April 7, 2026)
- [x] `ADMIN_DISABLE_ERROR_EMAILS` - Not set (verified April 7, 2026)

---

## Environment Variables

### Vercel Production - All Verified

- [x] `NEXT_PUBLIC_SUPABASE_URL` - Set
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Set
- [x] `ENCRYPTION_KEY` - Production-only scope (separate key for dev/preview, April 6, 2026)
- [x] `INNGEST_EVENT_KEY` - Set
- [x] `INNGEST_SIGNING_KEY` - Set
- [x] `RESEND_API_KEY` - Set
- [x] `NEXT_PUBLIC_SITE_URL` - Set to production domain
- [x] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Production key (not test key)
- [x] `TURNSTILE_SECRET_KEY` - Set
- [x] `ADMIN_USER_IDS` - Set

---

## URL Configuration

- [x] Vercel production domain configured with SSL
- [x] Cloudflare Turnstile production key configured for domain
- [x] Resend domain verified (beerock.com)
- [x] Supabase redirect URLs configured (verified April 7, 2026):
  - `http://localhost:3000/auth/callback` (dev)
  - `https://my-workout-scheduler.vercel.app/auth/callback` (preview)
  - `https://myworkout.beerock.com/auth/callback` (production)
  - `https://myworkout.beerock.com/auth/reset-password` (production)
- [x] Supabase Site URL set to `myworkout.beerock.com`

---

## Database & Inngest

- [x] All migrations deployed (app running in production)
- [x] Inngest auto-syncs on Vercel deploy (configured via dashboard)
- [x] Daily scheduler running (`0 0 * * *`)
- [x] Supabase keep-alive cron active

---

## Pre-Launch Testing

Most items verified through active usage with 3 users:

- [x] Signup and onboarding flow (3 users onboarded)
- [x] Booking automation end-to-end
- [x] Email notifications (booking success, failure, waitlist)
- [x] Skip/unskip flow with Book Now dialog
- [x] Pause/resume schedule
- [x] Password reset flow
- [x] Test from mobile devices (320px viewport) - verified April 7, 2026

---

## Monitoring

**Active monitoring:**
- Resend Dashboard: https://resend.com/emails
- Inngest Dashboard: Function runs and errors
- Vercel Logs: Deployment and runtime errors

---

## Rollback Plan

If critical issues occur:

1. Revert to previous deployment in Vercel
2. Check Supabase Auth logs for error patterns
3. Verify environment variables are correct
4. Deploy fix to preview branch first, then production

---

## Quick Reference: Where to Find Settings

| Setting | Location |
|---------|----------|
| Rate Limits | Supabase Dashboard > Authentication > Rate Limits |
| Redirect URLs | Supabase Dashboard > Authentication > URL Configuration |
| Env Variables | Vercel Dashboard > Settings > Environment Variables |
| Email Deliverability | Resend Dashboard > Emails |
| Domain Verification | Resend Dashboard > Domains > beerock.com |

---

*Last Updated: April 7, 2026 - All items verified*
