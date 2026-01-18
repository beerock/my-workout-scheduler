# GitHub Actions Setup Guide

This guide walks you through setting up the booking automation to run on GitHub Actions.

## Prerequisites

- GitHub repository with the code pushed
- Supabase project with service role key
- Encryption key (same one used in your web app)

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **service_role** key (this is your `SUPABASE_SERVICE_ROLE_KEY`)
   - ⚠️ **Important**: Use the `service_role` key, NOT the `anon` key
   - The service role key bypasses Row Level Security (RLS), which is required for automation

## Step 2: Get Your Encryption Key

- Use the same `ENCRYPTION_KEY` that you use in your `.env.local` file
- This key is used to decrypt gym passwords stored in the database
- If you don't have one, generate it:
  ```bash
  openssl rand -base64 32
  ```
- ⚠️ **Important**: If you change the encryption key, all encrypted passwords in the database will need to be re-encrypted

## Step 3: Set GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

### Secret 1: `SUPABASE_URL`
- **Name**: `SUPABASE_URL`
- **Value**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- Click **Add secret**

### Secret 2: `SUPABASE_SERVICE_ROLE_KEY`
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Your Supabase service role key (starts with `eyJ...`)
- ⚠️ This is sensitive - never share or commit this
- Click **Add secret**

### Secret 3: `ENCRYPTION_KEY`
- **Name**: `ENCRYPTION_KEY`
- **Value**: Your encryption key (the base64 string)
- ⚠️ This is sensitive - never share or commit this
- Click **Add secret**

## Step 4: Verify Workflow File

The workflow file should already be in your repository at:
```
.github/workflows/booking-automation.yml
```

Verify it exists and contains:
- Cron schedule: `0 * * * *` (runs every hour)
- Manual trigger: `workflow_dispatch`
- Environment variables set correctly

## Step 5: Test the Workflow

### Option 1: Manual Trigger (Recommended for First Test)

1. Go to **Actions** tab in your GitHub repository
2. Click on **Booking Automation** workflow
3. Click **Run workflow** button (top right)
4. Select the branch (usually `main` or `master`)
5. Click **Run workflow**
6. Watch the workflow run in real-time
7. Check the logs for any errors

### Option 2: Wait for Scheduled Run

- The workflow runs automatically every hour at minute 0
- Check the **Actions** tab after the next hour mark

## Step 6: Verify Results

After the workflow runs:

1. **Check Workflow Logs**
   - Go to **Actions** → Click on the latest run
   - Review the logs for:
     - Number of classes processed
     - Booking results (confirmed/waitlisted/failed)
     - Any errors

2. **Check Database**
   - Query the `booking_attempts` table in Supabase
   - Verify new records were created
   - Check `status` field for results

3. **Check Screenshots** (if any failures)
   - Download artifacts from the workflow run
   - Review screenshots to debug issues

## Troubleshooting

### Workflow Fails Immediately

**Error**: "Missing Supabase credentials"

**Solution**:
- Verify all three secrets are set correctly
- Check secret names match exactly (case-sensitive)
- Re-run the workflow

### Workflow Fails on "Install dependencies"

**Error**: npm install fails

**Solution**:
- Check `package.json` is valid
- Verify Node.js version in workflow (should be 20)
- Check for dependency conflicts

### Workflow Fails on "Run booking automation"

**Error**: Database connection or query errors

**Solution**:
- Verify `SUPABASE_URL` is correct
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
- Check Supabase project is active
- Review error message in logs

**Error**: "ENCRYPTION_KEY environment variable is required"

**Solution**:
- Verify `ENCRYPTION_KEY` secret is set
- Check it matches the key used in your web app
- Re-run workflow

### No Classes Booked

**Possible reasons**:
- No active classes in database
- All users have `schedule_paused = true`
- Booking windows not yet open
- Classes have `next_skip_date = today`

**Check**:
- Run `npm run test:booking-query` locally to see what classes should be booked
- Check `recurring_classes.active = true`
- Check `user_settings.schedule_paused = false`
- Verify booking window calculations

### Login Failures

**Error**: "Login failed" in booking attempts

**Solution**:
- Verify gym credentials in database are correct
- Check if gym website structure changed
- Review screenshot from workflow artifacts
- Update selectors in `scripts/booking-automation.ts` if needed

## Workflow Schedule

The workflow runs:
- **Automatically**: Every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
- **Manually**: Via "Run workflow" button in Actions tab

To change the schedule, edit `.github/workflows/booking-automation.yml`:
```yaml
schedule:
  - cron: '0 * * * *'  # Change this
```

Cron format: `minute hour day month day-of-week`
- `0 * * * *` = Every hour at minute 0
- `0 */2 * * *` = Every 2 hours
- `0 9 * * *` = Every day at 9:00 AM
- `*/30 * * * *` = Every 30 minutes

## Monitoring

### GitHub Actions Dashboard
- View all workflow runs in **Actions** tab
- See success/failure status
- Download logs and artifacts

### Database Monitoring
Query `booking_attempts` table:
```sql
SELECT 
  status,
  COUNT(*) as count,
  MAX(attempt_timestamp) as latest
FROM booking_attempts
GROUP BY status
ORDER BY latest DESC;
```

### Email Notifications (Future Enhancement)
Currently, notifications are not implemented. You can:
- Set up GitHub email notifications for workflow failures
- Query the database periodically
- Add email notifications in a future update

## Security Best Practices

1. **Never commit secrets**
   - All sensitive values are in GitHub Secrets
   - `.env.local` is in `.gitignore`

2. **Rotate keys periodically**
   - Change `ENCRYPTION_KEY` if compromised
   - Rotate Supabase service role key if needed
   - Update all secrets in GitHub

3. **Limit service role key access**
   - Only use service role key in GitHub Actions
   - Never use in client-side code
   - Consider IP restrictions in Supabase (if available)

4. **Review workflow logs**
   - Check logs regularly for errors
   - Look for unexpected behavior
   - Monitor booking success rates

## Cache Management

The workflow caches `node_modules` and Puppeteer browsers (`~/.cache/puppeteer`) to speed up runs. Here's what you need to know:

### How It Works

| Aspect | Behavior |
|--------|----------|
| **Cache key** | Based on `package-lock.json` hash — changes automatically when dependencies update |
| **Expiration** | GitHub evicts caches not accessed in 7 days |
| **Storage limit** | 10GB per repo (oldest caches evicted first) |
| **Expected times** | ~90s (cache miss) → ~60s (cache hit) |

### What Gets Cached

```yaml
path: |
  node_modules
  ~/.cache/puppeteer
```

The `npx puppeteer browsers install chrome` step runs on every workflow to ensure Chrome is available, but completes quickly (~1s) when already cached.

### When to Clear Cache

Clear the cache if you experience:
- Mysterious workflow failures after it previously worked
- After major Node.js version upgrade
- After Puppeteer major version upgrade (new Chrome version needed)
- Strange Puppeteer/Chrome errors

### Cache Management Commands

```bash
# List all caches
gh cache list

# Delete a specific cache by key
gh cache delete <cache-key>

# Delete all caches (nuclear option)
gh cache list --json key -q '.[].key' | xargs -I {} gh cache delete {}
```

### Via GitHub UI

1. Go to repository → **Actions** → **Caches** (left sidebar)
2. View cache sizes and last accessed times
3. Delete individual caches as needed

### Troubleshooting Cache Issues

**Symptom**: "Could not find Chrome" error

**Cause**: Puppeteer cache missing or corrupted

**Fix**: Delete the cache and re-run workflow:
```bash
gh cache list  # Find cache key starting with "Linux-deps-"
gh cache delete Linux-deps-xxxxx
```

---

## Next Steps

After setup is complete:

1. ✅ Test with a single class first
2. ✅ Monitor first few automated runs
3. ✅ Verify bookings are actually happening
4. ✅ Adjust selectors if needed for your gym website
5. ✅ Set up monitoring/alerting (optional)

## Support

If you encounter issues:
1. Check workflow logs for detailed error messages
2. Review screenshots in artifacts
3. Test scripts locally first
4. Check database for booking attempt records
5. Verify all secrets are set correctly

