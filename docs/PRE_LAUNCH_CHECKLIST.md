# Pre-Launch Checklist for MVP

This document contains critical configuration changes that must be made before launching the MVP to production users.

**Status:** 🚧 TESTING CONFIGURATION - NOT PRODUCTION READY

---

## 🔒 Security & Rate Limiting

### Supabase Auth Rate Limits

**Current Configuration (Testing):**
```
Password Reset: 50 requests per hour per email
Email Verification: 50 requests per hour per email
```

**⚠️ ACTION REQUIRED BEFORE MVP LAUNCH:**

Reset rate limits to production-safe values in Supabase Dashboard:

1. Go to: **Supabase Dashboard** → **Authentication** → **Rate Limits**
2. Set the following recommended limits:

```
Password Reset: 3 requests per hour per email
Email Verification Resend: 1 request per 60 seconds per user
Email Signups: 30 requests per hour per IP address
```

**Why these limits?**
- **Password Reset (3/hour):** Prevents brute force attacks while allowing legitimate users to retry if needed
- **Email Verification (1/60s):** Prevents abuse while allowing users to resend if email doesn't arrive
- **Signups (30/hour/IP):** Prevents automated spam accounts while allowing legitimate use

**Documentation:**
- Current settings: `docs/SUPABASE_EMAIL_CONFIGURATION.md` (Step 6)
- OWASP recommendations: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#account-lockout

---

## 📧 Email Configuration

### Resend Domain Settings

**Current Configuration (Testing):**
```
Click Tracking: ❌ DISABLED (was causing redirect issues)
Open Tracking: ✅ Enabled (optional)
```

**✅ VERIFIED FOR PRODUCTION:**
- Domain: beerock.com
- DKIM: ✅ Verified
- SPF: ✅ Configured
- Sender: noreply@beerock.com

**No action required** - Current settings are production-ready.

### Email Notification System (v2.27)

**⚠️ ACTION REQUIRED BEFORE MVP LAUNCH:**

1. **Verify Admin Toggles:**
   - [ ] `ADMIN_DISABLE_ALL_EMAILS` is NOT set or set to `false` in production
   - [ ] `ADMIN_DISABLE_BOOKING_EMAILS` is NOT set or set to `false` in production
   - [ ] `ADMIN_DISABLE_ERROR_EMAILS` is NOT set or set to `false` in production

2. **Test Email Flow:** ✅ All tested Jan 9, 2026
   - [x] Test welcome email: Signup new user → Verify email → Receive welcome email
   - [x] Test booking notification: Trigger booking → Receive confirmation email
   - [x] Test notification preferences: Change settings → Verify changes respected
   - [x] Test pause reminder: Pause schedule → Verify Inngest run scheduled (7 days)
   - [x] Test pause cancellation: Unpause → Verify Inngest run cancelled
   - [x] Test email change verification: Change email → Click verification → See success banner
   - [x] Test failure email: Booking failure → Receive failure notification
   - [x] Test waitlist email: Waitlisted booking → Receive waitlist notification

3. **Verify Environment Variables:**
   - [ ] `RESEND_API_KEY` is set in Vercel Production
   - [ ] `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL` points to production domain
   - [ ] `RESEND_FROM_EMAIL` is `noreply@beerock.com` (verified domain)

4. **Database Migration:**
   - [ ] Run migration 010_notification_system.sql in production Supabase
   - [ ] Run migration 011_pause_reminder.sql in production Supabase
   - [ ] Verify user_settings table has notification columns
   - [ ] Verify notification_log table exists

5. **Inngest Function Sync:**
   - [ ] Verify `pauseReminderFunction` is visible in Inngest Dashboard
   - [ ] Sync Inngest functions after deployment (see CLAUDE.md section on Inngest sync)

---

## 🌐 Environment Variables & URL Configuration

### Vercel Production Environment Variables

**Verify these are set in Vercel Production:**

```
✅ NEXT_PUBLIC_SITE_URL=https://[your-production-domain]
✅ RESEND_API_KEY=[Production API Key]
✅ RESEND_FROM_EMAIL=noreply@beerock.com (or your production email)
✅ ENCRYPTION_KEY=[Unique production key]
✅ SUPABASE_SERVICE_ROLE_KEY=[Production service role key]
✅ NEXT_PUBLIC_TURNSTILE_SITE_KEY=[Production Turnstile key]
```

**⚠️ CRITICAL:**
- Use **different** `ENCRYPTION_KEY` for production than dev/preview
- Ensure all **⚠️ SENSITIVE** variables have "Sensitive" checkbox enabled in Vercel
- Update `NEXT_PUBLIC_SITE_URL` to match your final production domain

### URL Configuration Checklist

**Verify production domain is configured in ALL services:**

1. **Vercel Domain:**
   - [ ] Production domain configured in Vercel project settings
   - [ ] SSL certificate active (automatic with Vercel)
   - [ ] `NEXT_PUBLIC_SITE_URL` environment variable matches production domain

2. **Supabase Auth Redirect URLs:**
   - [ ] Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**
   - [ ] Add production redirect URLs:
     - `https://[your-domain]/auth/callback`
     - `https://[your-domain]/auth/reset-password`
   - [ ] Site URL set to: `https://[your-domain]`

3. **Resend Domain Verification:**
   - [ ] Domain verified in Resend Dashboard (currently: beerock.com)
   - [ ] DKIM records verified
   - [ ] SPF records configured
   - [ ] Confirm this is the correct domain for production emails

4. **Cloudflare Turnstile:**
   - [ ] Production site key created for final domain
   - [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` updated in Vercel

**Why this matters:**
- Incorrect URLs break authentication redirects, email links, and API callbacks
- Must be configured before first production user signup

---

## 🤖 Bot Protection

### Cloudflare Turnstile Production Key

**Current Configuration (Testing):**
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

**⚠️ ACTION REQUIRED BEFORE MVP LAUNCH:**

Replace test key with production Turnstile site key:

1. Go to: **Cloudflare Dashboard** → **Turnstile** → **Add Site**
2. Create site key for production domain (e.g., `myworkout.beerock.com` or custom domain)
3. Update Vercel Production environment variable:
   - Variable: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - Value: [Your production site key]
   - Environment: Production only

**Why this is required:**
- **Current:** Test key (always passes - allows all signups including bots)
- **Production:** Real key (validates human interaction, prevents spam signups)

**Documentation:**
- Get site key: https://dash.cloudflare.com/ → Turnstile
- Test key only works in development, must be replaced for production

---

## 🧪 Pre-Launch Testing Checklist

### Test with Real User Flow

- [ ] Signup with new email → Verify email → Access dashboard
- [ ] Password reset → Receive email → Reset password → **Log in with new password**
- [ ] Test from different devices (mobile, tablet, desktop)
- [ ] Test in different browsers (Chrome, Safari, Firefox)
- [ ] Test spam folder delivery (Gmail, Outlook, Apple Mail)

### Security Testing

- [ ] Cannot access `/dashboard` without authentication
- [ ] Cannot access password reset page without valid token
- [ ] Old password doesn't work after reset
- [ ] Expired verification links show proper error message
- [ ] Rate limits prevent abuse attempts

### Email Deliverability

- [ ] Check Resend Dashboard for delivery rates
- [ ] Verify no bounces or spam reports
- [ ] Test email arrives within 60 seconds
- [ ] Email renders properly in major email clients

---

## 📊 Monitoring Setup

### Post-Launch Monitoring

**Week 1 after launch:**
- [ ] Monitor Resend Dashboard daily for delivery issues
- [ ] Check Supabase Auth logs for failed login attempts
- [ ] Verify rate limit hits (should be rare for legitimate users)
- [ ] Monitor Vercel logs for errors

**Tools:**
- Resend Dashboard: https://resend.com/emails
- Supabase Auth Logs: Dashboard → Authentication → Logs
- Vercel Logs: Dashboard → Deployments → [Latest] → Logs

---

## 🚨 Rollback Plan

If critical auth issues occur after launch:

1. **Immediate:** Revert to previous deployment in Vercel
2. **Check:** Supabase Auth logs for error patterns
3. **Verify:** Environment variables are correct
4. **Test:** Auth flows in production
5. **Fix:** Deploy fix to preview branch first, then production

---

## 📝 Launch Day Tasks

**30 minutes before launch:**
- [ ] Reset Supabase rate limits to production values (see above)
- [ ] Verify all environment variables in Vercel
- [ ] Test one complete auth flow on production
- [ ] Clear any test users from database (optional)

**Immediately after launch:**
- [ ] Test signup flow with real email
- [ ] Monitor Resend dashboard for first emails
- [ ] Check Vercel logs for any errors
- [ ] Have rollback plan ready

---

## 📞 Support Contacts

**If issues arise:**
- Resend Support: https://resend.com/support
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/support

---

**Last Updated:** January 9, 2026
**Next Review:** Before MVP launch

---

## Quick Reference: Where to Find Settings

| Setting | Location |
|---------|----------|
| Rate Limits | Supabase Dashboard → Authentication → Rate Limits |
| SMTP Config | Supabase Dashboard → Project Settings → Auth → SMTP Settings |
| Redirect URLs | Supabase Dashboard → Authentication → URL Configuration |
| Env Variables | Vercel Dashboard → Settings → Environment Variables |
| Email Deliverability | Resend Dashboard → Emails |
| Domain Verification | Resend Dashboard → Domains → beerock.com |
