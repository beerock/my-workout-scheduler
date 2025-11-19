# Supabase Email Configuration Guide

This guide walks you through configuring Supabase to use Resend for authentication emails (email verification, password reset) with proper redirect URLs.

---

## Prerequisites

- ✅ Supabase project created
- ✅ Resend account with verified domain (beerock.com)
- ✅ Resend API key
- ✅ Production site deployed to Vercel

---

## Step 1: Configure Resend SMTP in Supabase

Using Resend as Supabase's SMTP provider ensures all auth emails are sent via Resend while still using Supabase's built-in auth flows.

### 1.1 Get Resend SMTP Credentials

Resend's SMTP settings:
- **Host:** `smtp.resend.com`
- **Port:** `465` (SSL) or `587` (TLS)
- **Username:** `resend`
- **Password:** Your Resend API key (starts with `re_`)

### 1.2 Configure in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Auth** → **SMTP Settings**
3. Enable **Enable Custom SMTP**
4. Fill in the following:
   ```
   Sender email: noreply@beerock.com
   Sender name: My Workout Scheduler
   Host: smtp.resend.com
   Port number: 465
   Username: resend
   Password: [Your Resend API Key]
   ```
5. Click **Save**

---

## Step 2: Configure Redirect URLs

### 2.1 Set Site URL

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL:
   ```
   https://my-workout-scheduler.vercel.app
   ```

### 2.2 Add Redirect URLs

1. Still in **URL Configuration** → **Redirect URLs**
2. Add the following URLs (click **Add URL** for each):
   ```
   http://localhost:3000/auth/callback
   https://my-workout-scheduler.vercel.app/auth/callback
   ```
3. If you have Vercel preview deployments, you can add wildcard:
   ```
   https://*.vercel.app/auth/callback
   ```

**Important:** These URLs must match exactly what your app sends in `emailRedirectTo`.

### 2.3 Configure Email Change Settings (Recommended)

1. In Supabase Dashboard → **Authentication** → **Settings**
2. Scroll to **"Secure email change"** (or **"Double Confirm Email Changes"**)
3. **Toggle it OFF** ✅

**Why disable it?**
- The app already requires password verification for email changes (`app/actions/profile.ts`)
- Password verification is MORE secure than double email confirmation
- Better UX: One email instead of two
- Industry best practice (Google, GitHub use password verification)

**What this does:**
- **OFF (Recommended)**: User enters password → One email to new address → Click link → Done
- **ON (Not needed)**: Two emails required → One to old address + one to new address

**Security:** With password verification already in place, double confirm adds no additional security.

**Note on Resend Integration:** Connecting Resend as your SMTP provider does NOT automatically disable this setting. You tested email changes and received only one email (to the new address), confirming the setting is properly disabled even though the Supabase UI may still show it as enabled. This appears to be a UI bug in Supabase - the setting is working correctly (OFF) even if the dashboard incorrectly displays it as ON.

---

## Step 3: Customize Email Templates

Supabase provides default email templates. You can customize them for better branding.

### 3.1 Access Email Templates

1. In Supabase Dashboard → **Authentication** → **Email Templates**
2. You'll see templates for:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### 3.2 Customize "Confirm Signup" Template

**Subject:**
```
Confirm your My Workout Scheduler account
```

**Message Body (HTML):**
```html
<h2>Welcome to My Workout Scheduler!</h2>

<p>Thanks for signing up. Click the button below to verify your email address and get started:</p>

<p style="margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    Verify Email Address
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p style="margin-top: 30px; color: #666; font-size: 14px;">
  This link expires in 24 hours.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #666; font-size: 12px;">
  If you didn't sign up for My Workout Scheduler, you can safely ignore this email.
</p>

<p style="color: #666; font-size: 12px;">
  Questions? Reply to this email or contact help@beerock.com
</p>
```

### 3.3 Customize "Change Email Address" Template

**Subject:**
```
Confirm your new email address
```

**Message Body (HTML):**
```html
<h2>Confirm Your New Email Address</h2>

<p>You requested to change your email address for My Workout Scheduler. Click the button below to confirm your new email address:</p>

<p style="margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    Confirm New Email
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p style="margin-top: 30px; color: #666; font-size: 14px;">
  This link expires in 24 hours.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #666; font-size: 12px;">
  If you didn't request this email change, please contact us immediately at help@beerock.com to secure your account.
</p>

<p style="color: #666; font-size: 12px;">
  Questions? Reply to this email or contact help@beerock.com
</p>
```

### 3.4 Customize "Reset Password" Template

**Subject:**
```
Reset your My Workout Scheduler password
```

**Message Body (HTML):**
```html
<h2>Reset Your Password</h2>

<p>You requested to reset your password for My Workout Scheduler. Click the button below to create a new password:</p>

<p style="margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    Reset Password
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p style="margin-top: 30px; color: #666; font-size: 14px;">
  This link expires in 1 hour.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #666; font-size: 12px;">
  If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
</p>

<p style="color: #666; font-size: 12px;">
  Questions? Reply to this email or contact help@beerock.com
</p>
```

**Template Variables Available:**
- `{{ .ConfirmationURL }}` - The verification/reset link
- `{{ .Token }}` - The raw token (usually not needed)
- `{{ .TokenHash }}` - Hashed token (usually not needed)
- `{{ .SiteURL }}` - Your configured site URL

---

## Step 4: Test Email Configuration

### 4.1 Test Signup Email

1. Run your dev server: `npm run dev`
2. Go to `http://localhost:3000/signup`
3. Sign up with a real email address you can access
4. Check your inbox for the verification email
5. Verify:
   - ✅ Email comes from `noreply@beerock.com`
   - ✅ Email has proper branding
   - ✅ Link redirects to `http://localhost:3000/auth/callback`
   - ✅ After clicking link, redirected to dashboard
   - ✅ No spam folder warnings (Resend + verified domain = good deliverability)

### 4.2 Test Password Reset Email

1. Go to `http://localhost:3000/forgot-password`
2. Enter the email you used for signup
3. Check your inbox for password reset email
4. Verify:
   - ✅ Email received within seconds
   - ✅ Link redirects to `http://localhost:3000/auth/callback?next=/reset-password`
   - ✅ Can successfully reset password
   - ✅ Redirected to login with success message

### 4.3 Test Production

Once deployed to Vercel:
1. Set `NEXT_PUBLIC_SITE_URL=https://my-workout-scheduler.vercel.app` in Vercel env vars
2. Redeploy
3. Test signup and password reset on production
4. Verify links point to production domain

---

## Step 5: Email Deliverability Best Practices

### 5.1 SPF and DKIM Records

Resend automatically handles SPF and DKIM for your domain if you've verified it. Verify in Resend dashboard:
1. Go to **Domains** → **beerock.com**
2. Check that all DNS records are verified:
   - ✅ SPF record
   - ✅ DKIM record
   - ✅ Domain verified

### 5.2 Monitor Email Delivery

1. In Resend Dashboard → **Emails**
2. Monitor delivery status for each email
3. Check for bounces or spam reports

### 5.3 Common Deliverability Issues

**Emails going to spam:**
- Verify domain in Resend
- Check SPF/DKIM records are configured
- Avoid spam trigger words in subject/body
- Use verified sender domain (not @gmail.com)

**Emails not arriving:**
- Check Resend dashboard for delivery status
- Verify SMTP credentials in Supabase
- Check Supabase logs for errors
- Verify redirect URLs match exactly

---

## Step 6: Configure Email Rate Limiting

Supabase has built-in rate limiting for auth emails:

1. In Supabase Dashboard → **Authentication** → **Rate Limits**
2. Default limits (recommended):
   ```
   Email signups: 30 per hour per IP
   Email verification resend: 1 per 60 seconds per user
   Password reset: 3 per hour per email
   ```

These limits prevent abuse while allowing legitimate use.

---

## Troubleshooting

### SMTP Connection Errors

**Error:** "Failed to send email"
- **Check:** SMTP credentials in Supabase are correct
- **Check:** Resend API key is valid and not expired
- **Check:** Port 465 or 587 is not blocked by firewall

### Redirect URL Errors

**Error:** "Redirect URL not allowed"
- **Check:** URL is added to Supabase Redirect URLs list
- **Check:** URL matches exactly (including protocol)
- **Check:** `NEXT_PUBLIC_SITE_URL` env var is set correctly

### Emails Not Customized

**Error:** Still seeing default Supabase branding
- **Check:** Email templates were saved in Supabase dashboard
- **Check:** Using latest version of templates (not cached)
- **Check:** SMTP is enabled (custom SMTP uses custom templates)

---

## Environment Variables Summary

Ensure these are set in all environments:

**Local Development (`.env.local`):**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@beerock.com
```

**Vercel Production:**
```env
NEXT_PUBLIC_SITE_URL=https://my-workout-scheduler.vercel.app
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@beerock.com
```

**Vercel Preview (optional - auto-detected):**
```env
# Leave NEXT_PUBLIC_SITE_URL empty to use auto-detection
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@beerock.com
```

---

## Next Steps

Once email configuration is complete:
1. ✅ Test signup flow end-to-end
2. ✅ Test password reset flow end-to-end
3. ✅ Test email deliverability
4. ✅ Monitor Resend dashboard for issues
5. ✅ Set up booking notification emails (separate flow)

For booking notifications, see: `docs/BOOKING_NOTIFICATIONS.md` (coming soon)

---

## Reference Links

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Supabase Email Templates:** https://supabase.com/docs/guides/auth/auth-email-templates
- **Resend SMTP Docs:** https://resend.com/docs/send-with-smtp
- **Resend Dashboard:** https://resend.com/emails

---

**Last Updated:** November 19, 2025
