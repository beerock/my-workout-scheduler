# Quick Start: Booking Automation

This is a quick reference guide for getting the booking automation up and running.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Web app working (can log in, add credentials, add classes)
- [ ] GitHub repository created and code pushed

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
npm install
```

### 2. Test Database Connection (1 min)

```bash
npm run test:booking-query
```

Should show your active classes. If not, check:
- `.env.local` has correct Supabase credentials
- Database has active classes
- User has gym credentials saved

### 3. Test Password Decryption (1 min)

```bash
npm run test:database-helpers
```

Should show classes with decrypted credentials. If it fails:
- Check `ENCRYPTION_KEY` in `.env.local`
- Verify it matches the key used when saving credentials

### 4. Dry-Run Test (1 min)

```bash
npm run test:booking-dry-run
```

Simulates the booking process without actually booking. Good for verifying everything is set up correctly.

### 5. Set Up GitHub Actions (1 min)

1. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add three secrets:
   - `SUPABASE_URL` (from Supabase dashboard)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key, not anon key)
   - `ENCRYPTION_KEY` (same as in `.env.local`)

See [GitHub Actions Setup Guide](./GITHUB_ACTIONS_SETUP.md) for detailed instructions.

### 6. Test Workflow

1. Go to **Actions** tab in GitHub
2. Click **Booking Automation** workflow
3. Click **Run workflow** → **Run workflow**
4. Watch it run and check results

## Testing with Real Bookings

⚠️ **Warning**: This will make real bookings on the gym website!

Before running:
- [ ] Test with a class you can safely cancel
- [ ] Verify credentials are correct
- [ ] Check booking window is open
- [ ] Have a way to cancel if needed

Run:
```bash
npm run automation:run
```

## Common Issues

### "No classes need booking"
- Check `recurring_classes.active = true`
- Check `user_settings.schedule_paused = false`
- Verify booking window is open (class time - booking_window_hours)
- Check `next_skip_date` is not today

### "Login failed"
- Verify gym credentials in database are correct
- Check if gym website changed (may need to update selectors)
- Review screenshot in `screenshots/` folder

### "Class not found"
- Verify class type and time match exactly
- Check branch is correct
- Verify class exists on target day
- Review screenshot to see what's on the page

### "Password decryption failed"
- Verify `ENCRYPTION_KEY` matches the key used when saving credentials
- If you changed the key, you'll need to re-save all credentials

## Next Steps

1. ✅ Verify automation runs successfully
2. ✅ Monitor first few automated runs
3. ✅ Check `booking_attempts` table for results
4. ✅ Adjust Puppeteer selectors if needed for your gym website
5. ✅ Set up monitoring/alerting (optional)

## Need Help?

- [Booking Automation Guide](./BOOKING_AUTOMATION.md) - Full documentation
- [GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md) - Detailed setup
- Check workflow logs in GitHub Actions
- Review screenshots in workflow artifacts

