# Supabase Auth Email Templates

**Simple, Clean Email Templates**

This document contains copy-paste HTML templates for Supabase authentication emails. These templates match the simple style used in application notification emails.

---

## How to Update Supabase Email Templates

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. For each template type, paste the corresponding HTML below
5. Click **Save**

**Important:** Test each template after saving by triggering the corresponding auth action.

---

## Template Variables Reference

Supabase uses Go template syntax for variables:

| Variable | Description | Available In |
|----------|-------------|--------------|
| `{{ .ConfirmationURL }}` | Full confirmation link | All templates |
| `{{ .Token }}` | 6-digit OTP code | Confirm signup, Magic link |
| `{{ .TokenHash }}` | Hashed token for URL | All templates |
| `{{ .SiteURL }}` | Your site URL | All templates |
| `{{ .RedirectTo }}` | Redirect destination | All templates |

---

## 1. Confirm Signup (Email Verification)

**Subject:** `Verify your email for My Workout Scheduler`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Click to verify your email and start automating your gym bookings.
  </div>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 0;">

        <!-- Email container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 6px;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px; border-bottom: 3px solid #2563eb;">
              <h1 style="margin: 0; color: #6b7280; font-size: 24px; font-weight: 600; line-height: 1.2;">
                My Workout Scheduler
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px; color: #6b7280; font-size: 16px; line-height: 1.6;">
              <h2 style="margin: 0 0 16px; color: #2563eb; font-size: 20px; font-weight: 600;">
                Verify Your Email
              </h2>

              <p style="margin: 0 0 24px;">
                Thanks for signing up! Click the button below to verify your email address and get started with automated gym class bookings.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 24px; color: #ffffff; text-decoration: none; font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #2563eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                  This link expires in 1 hour. If you didn't create an account, you can safely ignore this email.
                </p>
              </div>

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 14px;">
                Need help? Email <a href="mailto:help@beerock.com" style="color: #2563eb; text-decoration: none;">help@beerock.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                My Workout Scheduler
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Reset Password (Forgot Password)

**Subject:** `Reset your My Workout Scheduler password`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Click to reset your password. This link expires in 1 hour.
  </div>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 0;">

        <!-- Email container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 6px;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px; border-bottom: 3px solid #f59e0b;">
              <h1 style="margin: 0; color: #6b7280; font-size: 24px; font-weight: 600; line-height: 1.2;">
                My Workout Scheduler
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px; color: #6b7280; font-size: 16px; line-height: 1.6;">
              <h2 style="margin: 0 0 16px; color: #f59e0b; font-size: 20px; font-weight: 600;">
                Reset Your Password
              </h2>

              <p style="margin: 0 0 24px;">
                We received a request to reset your password. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 6px; background-color: #f59e0b;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 24px; color: #ffffff; text-decoration: none; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                  <strong>Security notice:</strong> This link expires in 1 hour. If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 14px;">
                Need help? Email <a href="mailto:help@beerock.com" style="color: #2563eb; text-decoration: none;">help@beerock.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                My Workout Scheduler
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Email Change Confirmation

**Subject:** `Confirm your new email for My Workout Scheduler`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Confirm your new email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Click to confirm your new email address. This link expires in 1 hour.
  </div>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 0;">

        <!-- Email container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 6px;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px; border-bottom: 3px solid #2563eb;">
              <h1 style="margin: 0; color: #6b7280; font-size: 24px; font-weight: 600; line-height: 1.2;">
                My Workout Scheduler
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px; color: #6b7280; font-size: 16px; line-height: 1.6;">
              <h2 style="margin: 0 0 16px; color: #2563eb; font-size: 20px; font-weight: 600;">
                Confirm Your New Email
              </h2>

              <p style="margin: 0 0 24px;">
                You requested to change your email address. Click the button below to confirm this change.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 24px; color: #ffffff; text-decoration: none; font-weight: 600;">
                      Confirm New Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #2563eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                  This link expires in 1 hour. If you didn't request this change, you can safely ignore this email. Your current email will remain unchanged.
                </p>
              </div>

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 14px;">
                Need help? Email <a href="mailto:help@beerock.com" style="color: #2563eb; text-decoration: none;">help@beerock.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                My Workout Scheduler
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Magic Link (Optional)

If you use magic link authentication, use this template.

**Subject:** `Your sign-in link for My Workout Scheduler`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Sign in to your account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Click to sign in to your account. This link expires in 1 hour.
  </div>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 0;">

        <!-- Email container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 6px;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px; border-bottom: 3px solid #10b981;">
              <h1 style="margin: 0; color: #6b7280; font-size: 24px; font-weight: 600; line-height: 1.2;">
                My Workout Scheduler
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px; color: #6b7280; font-size: 16px; line-height: 1.6;">
              <h2 style="margin: 0 0 16px; color: #10b981; font-size: 20px; font-weight: 600;">
                Sign In to Your Account
              </h2>

              <p style="margin: 0 0 24px;">
                Click the button below to sign in to your My Workout Scheduler account. No password needed!
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 6px; background-color: #10b981;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 24px; color: #ffffff; text-decoration: none; font-weight: 600;">
                      Sign In Now
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                  This link expires in 1 hour and can only be used once. If you didn't request this link, you can safely ignore this email.
                </p>
              </div>

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 14px;">
                Need help? Email <a href="mailto:help@beerock.com" style="color: #2563eb; text-decoration: none;">help@beerock.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                My Workout Scheduler
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Design System Colors

These templates use Tailwind default colors for simplicity:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2563eb` | Links, CTAs, info messages |
| Success | `#10b981` | Magic link (welcome back) |
| Warning | `#f59e0b` | Password reset (security) |
| Text | `#6b7280` | Body text |
| Text Light | `#9ca3af` | Secondary text, footer |
| Background | `#ffffff` | Email body |
| Background Alt | `#f9fafb` | Footer, info boxes |
| Border | `#e5e7eb` | Dividers |

---

## Testing

After updating templates in Supabase:

1. **Email Verification:** Create a new test account
2. **Password Reset:** Use "Forgot Password" on login page
3. **Email Change:** Change email in Profile settings
4. **Magic Link:** If enabled, use "Sign in with magic link"

Test in multiple email clients:
- Gmail (web)
- Outlook (web and desktop)
- Apple Mail
- Mobile email apps

---

## Troubleshooting

**Links not clickable:**
- Ensure `{{ .ConfirmationURL }}` is properly rendered
- Check Supabase email settings for correct Site URL

**Emails going to spam:**
- Ensure SPF/DKIM records are set up for your domain
- Check Supabase email deliverability settings

---

**Last Updated:** January 2026
