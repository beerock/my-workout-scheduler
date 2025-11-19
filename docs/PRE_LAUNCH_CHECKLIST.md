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

---

## 🌐 Environment Variables

**Verify these are set in Vercel Production:**

```
✅ NEXT_PUBLIC_SITE_URL=https://my-workout-scheduler.vercel.app
✅ RESEND_API_KEY=[Production API Key]
✅ RESEND_FROM_EMAIL=noreply@beerock.com
✅ ENCRYPTION_KEY=[Unique production key]
✅ SUPABASE_SERVICE_ROLE_KEY=[Production service role key]
```

**⚠️ CRITICAL:**
- Use **different** `ENCRYPTION_KEY` for production than dev/preview
- Ensure all **⚠️ SENSITIVE** variables have "Sensitive" checkbox enabled in Vercel

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

**Last Updated:** November 19, 2025
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
