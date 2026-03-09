# Environment Variables - Quick Reference

**For comprehensive documentation, see:** [ENVIRONMENT_VARIABLES_STRATEGY.md](./ENVIRONMENT_VARIABLES_STRATEGY.md)

---

## TL;DR

### Your Questions - Answered

1. **Should we use Resend for both auth emails AND booking notifications?**
   - ✅ **YES** - Use Resend for everything. Simpler, cheaper, easier to manage.

2. **Best approach for NEXT_PUBLIC_SITE_URL?**
   - ✅ **Dynamic helper function** - Use `getSiteUrl()` utility (auto-detects environment)
   - Only set `NEXT_PUBLIC_SITE_URL` in production

3. **How to handle Vercel preview deployments?**
   - ✅ **Zero-configuration** - Vercel auto-injects `VERCEL_URL`, helper uses it automatically

4. **Dynamic getSiteUrl() helper or explicit env vars?**
   - ✅ **Helper function** - Already created in `lib/env-utils.ts`

5. **Organization strategy for .env.example?**
   - ✅ **Grouped by service** - See updated `.env.example` with clear sections

6. **What other env vars for post-MVP?**
   - Monitoring (Sentry), Analytics (PostHog), Rate limiting (Upstash), OAuth providers
   - See section 6 in `.env.example` (commented out, add when needed)

7. **Security best practices?**
   - Use different secrets per environment
   - Never use `NEXT_PUBLIC_` for sensitive data
   - Rotate production secrets quarterly
   - See full list in strategy doc

---

## What We Created

### 1. Comprehensive Strategy Document
**File:** `docs/ENVIRONMENT_VARIABLES_STRATEGY.md`

Contains:
- Strategic decisions with rationale
- Multi-environment configuration guide
- Security best practices
- Future scalability planning
- Migration roadmap

### 2. Updated .env.example
**File:** `.env.example`

Features:
- Clear sections grouped by service
- Inline documentation for each variable
- Security warnings for sensitive vars
- Quick start checklist
- Future variables (commented out)

### 3. Environment Utilities
**File:** `lib/env-utils.ts`

Functions:
- `getSiteUrl()` - Auto-detecting URL resolver
- `getEmailConfig()` - Email sender configuration
- `getEnvironment()` - Current environment detection
- `isProduction()`, `isDevelopment()`, `isPreview()` - Environment checks
- `getResendApiKey()` - Validated Resend API key
- `validateEnv()` - Startup validation

---

## Usage Examples

### Get Site URL (for email links, redirects)

```typescript
import { getSiteUrl } from '@/lib/env-utils'

// Email verification link
const verificationUrl = `${getSiteUrl()}/auth/callback?token=${token}`

// Redirect after login
redirect(getSiteUrl() + '/dashboard')

// API webhook URL
const webhookUrl = `${getSiteUrl()}/api/webhooks/inngest`
```

**Returns:**
- Local: `http://localhost:3000`
- Preview: `https://my-workout-scheduler-git-feature-team.vercel.app`
- Production: `https://myworkout.beerock.com`

### Send Email with Resend

```typescript
import { getResendApiKey, getEmailConfig } from '@/lib/env-utils'
import { Resend } from 'resend'

const resend = new Resend(getResendApiKey())
const { fromEmail, fromName } = getEmailConfig()

await resend.emails.send({
  from: `${fromName} <${fromEmail}>`,
  to: user.email,
  subject: 'Booking Confirmation',
  html: `<p>Your class has been booked!</p>`,
})
```

### Environment-Specific Logic

```typescript
import { isProduction, getEnvironment } from '@/lib/env-utils'

if (isProduction()) {
  // Enable production features
  console.log('Running in production mode')
} else {
  // Development/preview features
  console.log(`Running in ${getEnvironment()} mode`)
}
```

### Validate Environment on Startup

```typescript
import { validateEnv } from '@/lib/env-utils'

const validation = validateEnv()

if (!validation.isValid) {
  console.error('Missing required environment variables:', validation.missing)
  throw new Error('Invalid environment configuration')
}

console.log(`Environment: ${validation.environment}`)
console.log(`Site URL: ${validation.siteUrl}`)
```

---

## Setup Checklist

### Local Development

- [ ] Copy `.env.example` to `.env.local`
- [ ] Add Supabase credentials (from Supabase dashboard)
- [ ] Generate encryption key: `openssl rand -base64 32`
- [ ] Add Inngest keys (from Inngest dashboard)
- [ ] Add Resend API key (from Resend dashboard)
- [ ] Run `npm run dev` to verify

### Vercel Deployment (All Environments)

- [ ] Go to Vercel Dashboard → Settings → Environment Variables
- [ ] Add all required variables (sections 1-4 in `.env.example`)
- [ ] **Production only**: Set `NEXT_PUBLIC_SITE_URL=https://myworkout.beerock.com`
- [ ] Use **DIFFERENT** secrets for production (especially `ENCRYPTION_KEY`)
- [ ] Enable "Sensitive" checkbox for all ⚠️ SENSITIVE variables
- [ ] Redeploy to apply changes

### Supabase Configuration

- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Add site URL: `https://myworkout.beerock.com`
- [ ] Add redirect URLs:
  - `https://myworkout.beerock.com/**`
  - `https://*.vercel.app/**` (for preview deployments)
  - `http://localhost:3000/**` (for local dev)

### Resend Configuration (Production)

- [ ] Go to Resend Dashboard → Domains
- [ ] Add and verify your domain (e.g., `yourdomain.com`)
- [ ] Update `RESEND_FROM_EMAIL` to use verified domain (e.g., `noreply@yourdomain.com`)
- [ ] Test email sending in production

---

## Environment Variables by Environment

### Required in ALL Environments

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_KEY
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
RESEND_API_KEY
```

### Production ONLY

```env
NEXT_PUBLIC_SITE_URL=https://myworkout.beerock.com
```

### Optional (All Environments)

```env
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=My Workout Scheduler
```

### Auto-Injected by Vercel

```env
VERCEL_URL                    # Auto-generated preview/production URL
VERCEL_ENV                    # 'development' | 'preview' | 'production'
VERCEL_GIT_COMMIT_REF         # Branch name
```

---

## Next Steps

### Current Session: Add Email Service Support

1. ✅ Strategy document created
2. ✅ `.env.example` updated with Resend variables
3. ✅ `lib/env-utils.ts` created with helper functions
4. ⏳ **TODO**: Add Resend API key to Vercel (all environments)
5. ⏳ **TODO**: Test `getSiteUrl()` in local development
6. ⏳ **TODO**: Update any hardcoded URLs to use `getSiteUrl()`

### Next Session: Email Notifications

1. Install Resend SDK: `npm install resend`
2. Create email templates in `lib/email/templates/`
3. Implement booking notification emails
4. Configure Supabase SMTP to use Resend (for auth emails)
5. Test email flow in all environments

### Future Sessions: Post-MVP Enhancements

1. Add monitoring (Sentry) - uncomment variables in `.env.example`
2. Add analytics (PostHog) - uncomment variables in `.env.example`
3. Add rate limiting (Upstash Redis) - uncomment variables in `.env.example`
4. Add OAuth providers (Google, GitHub) - uncomment variables in `.env.example`

---

## Troubleshooting

### Error: "Missing environment variable"

**Symptom:** Build fails or runtime error about missing env var

**Solution:**
1. Check variable is set in Vercel Dashboard → Environment Variables
2. Verify correct environment scope (Development/Preview/Production)
3. Redeploy after adding variables

### Error: "Invalid redirect URL" in auth flow

**Symptom:** Supabase auth fails with redirect error

**Solution:**
1. Add `https://*.vercel.app/**` to Supabase → Authentication → URL Configuration
2. Verify production URL is added: `https://myworkout.beerock.com/**`

### Email links point to wrong URL

**Symptom:** Email contains `localhost:3000` in preview/production

**Solution:**
1. Use `getSiteUrl()` instead of hardcoded URLs
2. In production, set `NEXT_PUBLIC_SITE_URL` in Vercel

### Resend emails not sending

**Symptom:** Email API calls fail or emails not delivered

**Solution:**
1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for API errors
3. In production, verify domain is verified in Resend
4. Use verified domain email for `RESEND_FROM_EMAIL`

---

## Reference Links

### Documentation
- [ENVIRONMENT_VARIABLES_STRATEGY.md](./ENVIRONMENT_VARIABLES_STRATEGY.md) - Comprehensive strategy doc
- [.env.example](../.env.example) - Template with all variables

### Provider Dashboards
- [Supabase Dashboard](https://supabase.com/dashboard) - Get Supabase credentials
- [Inngest Dashboard](https://www.inngest.com/) - Get Inngest keys
- [Resend Dashboard](https://resend.com/dashboard) - Get Resend API key, verify domains
- [Vercel Dashboard](https://vercel.com/dashboard) - Set environment variables

### Utilities
- `lib/env-utils.ts` - Environment helper functions
- `lib/encryption.ts` - Encryption key usage
- `lib/supabase/client.ts` - Supabase client configuration
- `lib/supabase/server.ts` - Supabase server client

---

**Last Updated:** November 18, 2025
