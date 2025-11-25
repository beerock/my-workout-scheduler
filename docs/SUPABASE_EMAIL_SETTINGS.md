# Supabase Email Settings Configuration

## Issue: Receiving Two Emails on Email Change

When users change their email address, Supabase may send emails to **both** the old and new email addresses by default. This is controlled by the "Double Confirm Email Changes" setting.

## Solution: Disable Double Confirmation

To ensure only **ONE** email is sent (to the new address only), follow these steps:

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **My Workout Scheduler**
3. Navigate to **Authentication** in the left sidebar

### Step 2: Configure Email Settings

1. Click on **Email Templates** or **Settings** (depending on your Supabase version)
2. Look for **Email confirmation settings** or **Auth settings**
3. Find the setting labeled one of:
   - **"Enable email confirmations"**
   - **"Double Confirm Email Changes"**
   - **"Secure Email Change"**

### Step 3: Disable Double Confirmation

**Option A: If you see "Secure Email Change" or "Double Confirm Email Changes"**
- **Disable** or **Uncheck** this option
- This setting, when enabled, sends a confirmation link to BOTH the old and new email
- When disabled, only the new email receives the verification link

**Option B: If using the newer Supabase dashboard**
1. Go to **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Look for **"Secure email change (require verification from both emails)"**
4. **Toggle OFF** (should be gray/disabled)

### Step 4: Save Changes

1. Click **Save** at the bottom of the page
2. Changes take effect immediately (no restart needed)

## Expected Behavior After Configuration

### Before (Double Confirmation Enabled):
1. User changes email from `old@example.com` to `new@example.com`
2. Email sent to `old@example.com`: "Your email is being changed. Click to confirm."
3. Email sent to `new@example.com`: "Verify your new email address."
4. User must click links in **both** emails

### After (Double Confirmation Disabled):
1. User changes email from `old@example.com` to `new@example.com`
2. User enters password to confirm (handled by our app)
3. Email sent **only** to `new@example.com`: "Verify your new email address."
4. User clicks link in new email → Done!

## Security Considerations

**Why is this secure even with double confirmation disabled?**

Our implementation requires **password verification** before allowing email changes:
- User must enter current password in the profile form
- Server verifies password is correct before calling `updateUser()`
- This proves the user's identity before any email is sent

**When to use double confirmation:**
- If you DON'T require password verification in your app
- If you want extra security for high-sensitivity applications

**Our approach (password + single confirmation):**
- ✅ Secure (password verification proves identity)
- ✅ Better UX (only one email to check)
- ✅ Faster process (no need to check old email)

## Alternative: Email Template Customization

If you want to keep double confirmation but customize the email sent to the old address:

1. Go to **Authentication** → **Email Templates**
2. Find **"Email Change"** template
3. Edit the template sent to the old email address
4. You can make it informational only (no confirmation required)

## Troubleshooting

### Still receiving two emails after disabling?

1. **Clear browser cache** and test again
2. **Check Supabase logs**: Authentication → Logs → Look for email events
3. **Verify the setting is saved**: Return to settings page and confirm toggle is OFF
4. **Contact Supabase support** if issue persists

### Email not being sent at all?

1. Check **Email Templates** are configured correctly
2. Verify SMTP settings if using custom email provider
3. Check Supabase project quotas (free tier limits)
4. Review Authentication logs for errors

## Related Files

- `app/actions/profile.ts` - Contains `updateEmail()` with password verification
- `components/ProfileForm.tsx` - Email update form with password requirement
- `docs/PRODUCTION_EMAIL_SETUP.md` - Email service configuration

## References

- [Supabase Email Auth Documentation](https://supabase.com/docs/guides/auth/auth-email)
- [Supabase Email Configuration](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Secure Email Change Setting](https://supabase.com/docs/guides/auth/auth-email#secure-email-change)
