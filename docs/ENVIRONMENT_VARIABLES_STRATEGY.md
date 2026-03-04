# Environment Variables Strategy

## Overview

This document outlines the comprehensive environment variable strategy for My Workout Scheduler, designed to support local development, Vercel preview deployments, and production environments while maintaining security and scalability.

---

## Strategic Decisions

### 1. Email Service Architecture

**Decision: Use Resend for ALL email functionality**

**Rationale:**
- **Unified billing and management**: Single service for both transactional emails (auth) and operational emails (booking notifications)
- **Simplified integration**: One API key, one provider to monitor
- **Cost-effective for MVP**: Free tier supports 3,000 emails/month (sufficient for 5 users × ~20 classes/week × 4 emails/class = ~400 emails/month)
- **Supabase compatibility**: Supabase Auth supports custom SMTP, allowing Resend integration for auth emails

**Implementation:**
```
Resend → Booking notifications (via our API)
      → Auth emails (via Supabase SMTP settings)
```

**Alternative considered and rejected:**
- Using Supabase's built-in email + separate service for notifications (complexity, split billing)

---

### 2. Multi-Environment URL Resolution

**Decision: Dynamic URL resolution with `getSiteUrl()` helper**

**Rationale:**
- **Automatic environment detection**: No manual configuration needed for preview deployments
- **Vercel-native**: Leverages Vercel's auto-injected `VERCEL_URL` environment variable
- **Override capability**: Supports explicit `NEXT_PUBLIC_SITE_URL` when needed
- **Developer-friendly**: Works out-of-the-box in all environments

**Priority order:**
1. `NEXT_PUBLIC_SITE_URL` (explicit override, production only)
2. `VERCEL_URL` (auto-injected by Vercel for preview/production)
3. `localhost:3000` (local development fallback)

**When to set NEXT_PUBLIC_SITE_URL:**
- **Production only**: Set to `https://myworkout.beerock.com`
- **Local/Preview**: Leave unset (auto-detection works)

**Implementation:**
```typescript
// lib/env-utils.ts
export function getSiteUrl(): string {
  // 1. Explicit override (production)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // 2. Vercel auto-detected URL (preview/production)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3. Local development fallback
  return 'http://localhost:3000'
}
```

**Usage examples:**
```typescript
// Email verification links
const verificationUrl = `${getSiteUrl()}/auth/callback?token=${token}`

// Redirect after login
redirect(getSiteUrl() + '/dashboard')
```

---

### 3. Vercel Preview Deployments

**Decision: Zero-configuration preview support**

**How it works:**
1. Every PR/branch gets auto-generated URL: `https://my-workout-scheduler-git-{branch}-{team}.vercel.app`
2. Vercel auto-injects `VERCEL_URL` with the preview URL
3. `getSiteUrl()` automatically uses this URL
4. No manual configuration needed

**Benefits:**
- Preview deployments work identically to production
- Auth emails contain correct preview URLs
- Team members can test full flows on preview branches

**Considerations:**
- Supabase auth redirect URLs: Add `https://*.vercel.app/**` to allowed list (wildcard support)
- Inngest dev mode: Use Inngest CLI for local testing, skip preview deployment events

---

### 4. Organization Strategy

**Decision: Group by service/function with clear documentation**

**Grouping structure:**
```
1. Core Application (Supabase, Next.js)
2. Security (Encryption)
3. Event Automation (Inngest)
4. Email Service (Resend)
5. Optional/Future Services (Monitoring, Analytics)
```

**Documentation standards:**
- **Required vs optional**: Clearly marked
- **Where to get values**: Links to provider dashboards
- **Example values**: Safe examples that demonstrate format
- **Generation commands**: Included for secrets (e.g., `openssl rand -base64 32`)
- **Environment-specific notes**: Which vars to set in which environments

---

### 5. Future Scalability

**Anticipated environment variables (post-MVP):**

**Monitoring & Observability:**
- `SENTRY_DSN` - Error tracking
- `SENTRY_AUTH_TOKEN` - Release tracking
- `NEXT_PUBLIC_POSTHOG_KEY` - Product analytics
- `LOGFLARE_API_KEY` - Log aggregation

**Feature Flags:**
- `NEXT_PUBLIC_FEATURE_FLAGS` - JSON config for gradual rollouts
- `LAUNCHDARKLY_SDK_KEY` - If using LaunchDarkly

**Performance:**
- `UPSTASH_REDIS_URL` - Rate limiting, caching
- `UPSTASH_REDIS_TOKEN` - Authentication

**Auth Enhancements:**
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_CLIENT_ID` - GitHub OAuth
- `GITHUB_CLIENT_SECRET` - GitHub OAuth

**Background Jobs:**
- `QUIRREL_TOKEN` - If migrating from Inngest
- `TEMPORAL_NAMESPACE` - Workflow orchestration

**CDN & Assets:**
- `NEXT_PUBLIC_CDN_URL` - Custom CDN for assets
- `CLOUDINARY_API_KEY` - Image optimization
- `CLOUDINARY_API_SECRET` - Image uploads

**Notifications:**
- `SLACK_WEBHOOK_URL` - Admin alerts
- `DISCORD_WEBHOOK_URL` - Community notifications

**Design principle for future additions:**
- Add variables only when feature is actively being built
- Document in `.env.example` with clear comments
- Mark as optional until feature launches
- Remove if feature is deprecated

---

### 6. Security Best Practices

**Secret Management:**

✅ **DO:**
- Use `NEXT_PUBLIC_` prefix ONLY for truly public values (URLs, public API keys)
- Store sensitive keys server-side only (service role keys, encryption keys)
- Use Vercel's environment variable encryption (automatic)
- Rotate secrets periodically (quarterly for production)
- Use different secrets per environment (don't reuse production keys in dev)
- Keep `.env.local` in `.gitignore` (already configured)

❌ **DON'T:**
- Commit `.env` files to git (even if "empty")
- Share secrets via Slack/email (use 1Password, Vercel's secure sharing)
- Hardcode fallback secrets in code
- Use production keys in local development
- Expose service role keys to client-side code

**Access Control:**
- **Production secrets**: Owner + 1 trusted teammate only
- **Preview/dev secrets**: Full team access okay
- **Encryption key**: Owner only, backed up securely offline

**Vercel Configuration:**
- Set sensitive vars in Vercel Dashboard (encrypted at rest)
- Use environment-specific values: Development, Preview, Production
- Enable "Sensitive" checkbox for secrets (hides from UI)
- Audit access logs quarterly

**Compliance:**
- No PII in environment variables
- No user passwords (use proper encryption table)
- Follow GDPR principles (right to deletion, portability)

---

## Environment-Specific Configuration

### Local Development (`.env.local`)

**Required variables:**
```env
# Core Application
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
ENCRYPTION_KEY=generated-with-openssl

# Event Automation
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Email Service
RESEND_API_KEY=re_test_key_for_local_dev
```

**Optional variables:**
```env
# Email Configuration (optional, defaults work)
RESEND_FROM_EMAIL=dev@localhost
RESEND_FROM_NAME=My Workout Scheduler (Dev)

# Debugging (optional)
DEBUG=true
LOG_LEVEL=debug
```

**Not needed:**
- `NEXT_PUBLIC_SITE_URL` (auto-detects localhost:3000)
- `VERCEL_URL` (Vercel only)

---

### Vercel Preview Deployments

**Set in Vercel Dashboard → Preview environment:**
```env
# Same as local development EXCEPT:
RESEND_API_KEY=re_preview_key  # Use separate Resend API key if desired
```

**Auto-injected by Vercel:**
- `VERCEL_URL` (e.g., `my-workout-scheduler-git-feature-team.vercel.app`)
- `VERCEL_ENV=preview`
- `VERCEL_GIT_COMMIT_REF` (branch name)

**Not needed:**
- `NEXT_PUBLIC_SITE_URL` (auto-detection uses VERCEL_URL)

**Supabase configuration:**
- Add `https://*.vercel.app/**` to Supabase Auth → Redirect URLs (wildcard)

---

### Production (Vercel)

**Set in Vercel Dashboard → Production environment:**
```env
# Core Application
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-DIFFERENT-FROM-DEV

# Security
ENCRYPTION_KEY=production-key-DIFFERENT-FROM-DEV

# Event Automation
INNGEST_EVENT_KEY=production-inngest-event-key
INNGEST_SIGNING_KEY=production-inngest-signing-key

# Email Service
RESEND_API_KEY=re_production_key
RESEND_FROM_EMAIL=noreply@your-domain.com
RESEND_FROM_NAME=My Workout Scheduler

# Site URL (explicit for production)
NEXT_PUBLIC_SITE_URL=https://myworkout.beerock.com
```

**Auto-injected by Vercel:**
- `VERCEL_URL` (e.g., `myworkout.beerock.com`)
- `VERCEL_ENV=production`

**Supabase configuration:**
- Add `https://myworkout.beerock.com/**` to Auth → Redirect URLs

---

## Migration Guide

### Phase 1: Add Email Service Support (Current Session)

**Actions:**
1. ✅ Create this strategy document
2. ✅ Update `.env.example` with Resend variables
3. ✅ Create `lib/env-utils.ts` with `getSiteUrl()`
4. ✅ Add Resend variables to Vercel (all environments)
5. ⏳ Configure Supabase SMTP to use Resend (separate session)
6. ⏳ Implement booking notification emails (separate session)

### Phase 2: Improve Auth Workflows (Next Session)

**Actions:**
1. Update email templates to use `getSiteUrl()` for links
2. Configure Supabase Auth → Email Templates → Custom SMTP
3. Test email verification in preview deployments
4. Test password reset flows
5. Document email template customization

### Phase 3: Future Enhancements (Post-MVP)

**Actions:**
1. Add monitoring variables when implementing error tracking
2. Add analytics variables when implementing product analytics
3. Add CDN variables when implementing image optimization
4. Update `.env.example` incrementally as features are added

---

## Reference: Getting Environment Variable Values

### Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project API keys → anon/public
   - `SUPABASE_SERVICE_ROLE_KEY`: Project API keys → service_role (⚠️ sensitive!)

### Inngest
1. Go to https://www.inngest.com/
2. Select your app
3. Settings → Keys
   - `INNGEST_EVENT_KEY`: Event Keys → Create key
   - `INNGEST_SIGNING_KEY`: Signing Keys → Create key

### Resend
1. Go to https://resend.com/dashboard
2. API Keys → Create API Key
   - `RESEND_API_KEY`: Copy the generated key (⚠️ shown once!)
3. Verified Domains → Add domain (for production)
   - Use `noreply@your-domain.com` after verification

### Encryption Key
Generate locally:
```bash
openssl rand -base64 32
```
⚠️ **Critical**: Use DIFFERENT keys for dev/preview/production

---

## Troubleshooting

### "Invalid redirect URL" error in auth flow
**Cause:** Supabase doesn't recognize the URL
**Fix:** Add `https://*.vercel.app/**` to Supabase Auth → Redirect URLs

### Emails contain "localhost:3000" links in preview
**Cause:** Not using `getSiteUrl()` for links
**Fix:** Replace hardcoded URLs with `getSiteUrl()` in email templates

### Inngest events not triggering in preview
**Cause:** Inngest webhook URL not accessible
**Fix:** Use Inngest Dev Server for local testing, production Inngest for preview/prod

### "Missing environment variable" in build
**Cause:** Variable not set in Vercel for specific environment
**Fix:** Vercel Dashboard → Settings → Environment Variables → Check environment scope

---

## Validation Checklist

Before deploying to production, verify:

- [ ] All required variables set in Vercel Production environment
- [ ] Production secrets are DIFFERENT from dev/preview
- [ ] `NEXT_PUBLIC_SITE_URL` set correctly in production
- [ ] Supabase redirect URLs include production URL
- [ ] Resend domain verified (for production email sending)
- [ ] Test auth flow in preview deployment
- [ ] Test booking notification emails
- [ ] Encryption key backed up securely offline
- [ ] Team members have appropriate access levels
- [ ] `.env.local` added to `.gitignore` (verify not committed)

---

## Version History

- **v1.0** (Nov 18, 2025) - Initial strategy document
  - Resend integration design
  - Multi-environment URL resolution
  - Security best practices
  - Future scalability planning
