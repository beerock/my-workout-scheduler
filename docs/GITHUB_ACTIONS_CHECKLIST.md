# GitHub Actions Setup Checklist

Use this checklist to ensure GitHub Actions is fully configured.

## ✅ Pre-Setup Verification

- [ ] Code is pushed to GitHub repository
- [ ] Workflow file exists at `.github/workflows/booking-automation.yml`
- [ ] You have access to your Supabase dashboard
- [ ] You know your encryption key (from `.env.local`)

## 🔐 Step 1: Get Your Credentials

### Get Supabase URL and Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → This is `SUPABASE_URL`
   - **service_role** key (NOT anon key!) → This is `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ The service_role key starts with `eyJ...` and is much longer than the anon key

### Get Your Encryption Key

- Open your `.env.local` file
- Copy the value of `ENCRYPTION_KEY`
- This is the same key used to encrypt/decrypt gym passwords

## 🔑 Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret** button

### Secret 1: SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Value**: Your Supabase project URL (e.g., `https://abcdefghijklmnop.supabase.co`)
- Click **Add secret**

### Secret 2: SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Your Supabase service_role key (the long one starting with `eyJ...`)
- ⚠️ **Important**: This is the `service_role` key, NOT the `anon` key
- Click **Add secret**

### Secret 3: ENCRYPTION_KEY
- **Name**: `ENCRYPTION_KEY`
- **Value**: Your encryption key from `.env.local`
- ⚠️ **Important**: Must match the key used in your web app
- Click **Add secret**

## ✅ Step 3: Verify Secrets Are Set

After adding all three secrets, you should see:
- `ENCRYPTION_KEY` (with eye icon to reveal)
- `SUPABASE_SERVICE_ROLE_KEY` (with eye icon to reveal)
- `SUPABASE_URL` (with eye icon to reveal)

## 🧪 Step 4: Test the Workflow

1. Go to **Actions** tab in your GitHub repository
2. You should see **Booking Automation** workflow in the list
3. Click on **Booking Automation**
4. Click **Run workflow** button (top right)
5. Select your branch (usually `main` or `master`)
6. Click **Run workflow** (green button)
7. Watch the workflow run in real-time

### What to Look For

✅ **Success indicators:**
- All steps complete without errors
- "Run booking automation" step shows booking results
- Screenshots uploaded (if any failures occurred)

❌ **Failure indicators:**
- Red X on any step
- Error messages in logs
- "Missing Supabase credentials" error

## 🔍 Step 5: Check Results

After workflow completes:

1. **Check the logs:**
   - Click on the workflow run
   - Expand "Run booking automation" step
   - Look for booking results

2. **Check the database:**
   - Query `booking_attempts` table in Supabase
   - Should see new records with status (confirmed/waitlisted/failed)

3. **Check artifacts (if failures):**
   - Download "booking-screenshots" artifact
   - Review screenshots to debug issues

## ⚠️ Common Issues

### "Missing Supabase credentials"
- **Fix**: Verify all three secrets are set correctly
- Check secret names match exactly (case-sensitive)

### "ENCRYPTION_KEY environment variable is required"
- **Fix**: Verify `ENCRYPTION_KEY` secret is set
- Check it matches your `.env.local` value

### "Login failed" in booking attempts
- **Fix**: This is a booking issue, not a GitHub Actions issue
- Check gym credentials in database
- Review screenshots in artifacts

### Workflow doesn't appear in Actions tab
- **Fix**: Make sure workflow file is committed and pushed
- Check file is at `.github/workflows/booking-automation.yml`

## 📅 Step 6: Verify Scheduled Runs

The workflow runs automatically every hour. To verify:

1. Wait until the next hour (e.g., if it's 2:30 PM, wait until 3:00 PM)
2. Go to **Actions** tab
3. You should see a new workflow run appear
4. It will be triggered by the schedule (not manual)

## ✅ Final Checklist

- [ ] All three secrets are set in GitHub
- [ ] Manual workflow run succeeds
- [ ] Booking attempts are created in database
- [ ] Screenshots are uploaded (if any failures)
- [ ] Scheduled runs are working (check after next hour)

## 🎉 You're Done!

Once all checks pass, your automation is fully set up and will:
- Run automatically every hour
- Book classes when booking windows open
- Record all attempts in the database
- Upload screenshots for debugging

## 📚 Need Help?

- See [GitHub Actions Setup Guide](./GITHUB_ACTIONS_SETUP.md) for detailed instructions
- See [Booking Automation Guide](./BOOKING_AUTOMATION.md) for system documentation
- Check workflow logs for specific error messages

