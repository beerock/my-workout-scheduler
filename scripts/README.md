# Scripts Directory

This directory contains automation scripts, test utilities, and database management tools for the My Workout Scheduler project.

---

## 📁 Script Categories

### 🤖 Booking Automation Scripts

#### `booking-automation.ts`
Core Puppeteer automation logic for booking gym classes.

**Features:**
- Login to gym website
- Navigate to class schedule
- Find target class using fuzzy matching
- Two-step booking flow (class list → description page)
- Duplicate prevention (checks if already booked/waitlisted)
- Booking window detection
- Smart retry logic for clock drift
- Error handling and screenshot capture

**Usage:** Called by Inngest functions, not run directly.

---

#### `run-booking-automation.ts`
Manual script to run booking automation for all active classes.

**Usage:**
```bash
npm run automation:run
# or
npx tsx scripts/run-booking-automation.ts
```

**⚠️ WARNING:** Makes real booking attempts!

---

### 🧪 Testing Scripts

#### `test-booking-query.ts`
Test database query for upcoming classes (no booking attempts).

**Usage:**
```bash
npm run test:booking-query
# or
npx tsx scripts/test-booking-query.ts
```

**Safe:** Read-only, no bookings made.

---

#### `test-booking-automation-dry-run.ts`
Dry-run test showing what would be booked without making actual attempts.

**Usage:**
```bash
npm run test:booking-dry-run
# or
npx tsx scripts/test-booking-automation-dry-run.ts
```

**Safe:** No actual bookings, shows preview only.

---

#### `test-single-booking.ts`
Test booking automation for a single specific class.

**Usage:**
```bash
npm run test:single-booking
# or
npx tsx scripts/test-single-booking.ts
```

**⚠️ WARNING:** Makes a real booking attempt!

---

#### `test-database-helpers.ts`
Unit tests for database helper functions.

**Usage:**
```bash
npx tsx scripts/test-database-helpers.ts
```

**Safe:** Read-only database operations.

---

### 🗃️ Database Helper Scripts

#### `database-helpers.ts`
Reusable database query functions used by automation and Inngest functions.

**Functions:**
- `getAllActiveClasses()` - Get all active recurring classes
- `getClassById()` - Get single class by ID
- `createBookingAttempt()` - Create booking attempt record
- `updateBookingAttempt()` - Update booking attempt status
- `checkExistingBooking()` - Check for duplicate bookings
- `clearSkipDate()` - Clear next_skip_date after skipping

**Usage:** Imported by other scripts, not run directly.

---

### 🗑️ User Management Scripts

#### Template Files (Public - Safe to Commit)

**`delete-users-with-logging.sql`** - Bulk user deletion template
- Creates `deleted_users_audit` table with RLS enabled
- Shows preview before deletion
- Logs all user details to audit table
- Uses example emails (`admin@example.com`, `owner@example.com`)
- **Before use:** Copy to `scripts/private/` and replace with your actual admin emails

**`delete-single-user.sql`** - Single user deletion template
- Detailed user preview before deletion
- Audit logging with RLS
- Uses example email (`user@example.com`)
- **Before use:** Copy to `scripts/private/` and replace with actual email

**`user-deletion-queries.md`** - Quick reference template
- Preview, deletion, audit, and verification queries
- Uses example emails throughout
- **Before use:** Copy to `scripts/private/` and customize

#### Using the Templates

1. **Copy templates to private folder:**
   ```bash
   cp scripts/delete-users-with-logging.sql scripts/private/
   cp scripts/delete-single-user.sql scripts/private/
   cp scripts/user-deletion-queries.md scripts/private/
   ```

2. **Customize with your actual emails:**
   - Replace `admin@example.com` with your admin email
   - Replace `owner@example.com` with other admin email
   - Replace `user@example.com` with actual user to delete

3. **Run in Supabase SQL Editor**

**Why this approach?**
- ✅ Templates are safe to commit (example emails only)
- ✅ Team members can easily copy and customize
- ✅ Private folder stays gitignored (contains real emails)
- ✅ No risk of exposing admin identities publicly

**Security Features:**
- `deleted_users_audit` table created with RLS enabled
- Only service role can access audit logs
- Cascade deletion for all related data
- Preview queries before destructive operations

---

## 🚀 Quick Start Commands

```bash
# Test what would be booked (safe)
npm run test:booking-dry-run

# Test database query (safe)
npm run test:booking-query

# Run full automation (makes real bookings!)
npm run automation:run

# Test single booking (makes real booking!)
npm run test:single-booking
```

---

## ⚙️ NPM Scripts

These scripts are defined in `package.json`:

```json
{
  "test:booking-query": "tsx scripts/test-booking-query.ts",
  "test:booking-dry-run": "tsx scripts/test-booking-automation-dry-run.ts",
  "test:single-booking": "tsx scripts/test-single-booking.ts",
  "automation:run": "tsx scripts/run-booking-automation.ts"
}
```

---

## 🔐 Environment Variables Required

All scripts require these environment variables (set in `.env.local`):

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Security
ENCRYPTION_KEY=...

# Automation (for Inngest triggers)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# GitHub (for workflow triggers)
GITHUB_TOKEN=...
GITHUB_REPOSITORY=...
```

---

## 📊 Database Impact

### What Gets Created
- `booking_attempts` records (for all booking scripts)
- `deleted_users_audit` records (for deletion scripts)

### What Gets Deleted
User deletion scripts cascade delete:
- ✅ `gym_credentials`
- ✅ `recurring_classes`
- ✅ `booking_attempts`
- ✅ `user_settings`

**Note:** Inngest scheduled events are NOT canceled (fail gracefully).

---

## 🛡️ Safety Guidelines

### Before Running Destructive Scripts

1. **Backup your database:**
   - Supabase Dashboard → Database → Backups
   - Or export to CSV

2. **Run preview queries first:**
   - Use queries from `user-deletion-queries.md`
   - Verify what will be deleted

3. **Test on a single user first:**
   - Use `delete-single-user.sql` for one test user
   - Verify cascade deletion works correctly

4. **Check audit logs after:**
   - Query `deleted_users_audit` table
   - Verify records were logged

### Testing Best Practices

1. **Use dry-run tests first:**
   ```bash
   npm run test:booking-dry-run
   ```

2. **Test database queries:**
   ```bash
   npm run test:booking-query
   ```

3. **Verify credentials before booking:**
   - Check gym website is accessible
   - Verify login credentials are correct

4. **Check screenshots on failure:**
   - Look in `screenshots/` directory
   - Analyze what went wrong

---

## 🐞 Troubleshooting

### "Class not found" error
- Class may have been deleted from database
- Verify class exists: `SELECT * FROM recurring_classes WHERE id = 'class-id'`

### "User not authenticated" error
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify environment variables are loaded

### Puppeteer timeout
- Gym website may be slow or down
- Increase timeout in `booking-automation.ts`
- Check screenshots for clues

### Deletion script doesn't work
- Ensure you have admin/service role access
- Check RLS policies aren't blocking deletion
- Verify foreign key constraints have `ON DELETE CASCADE`

---

## 📚 Related Documentation

- **Main docs:** `/docs/`
- **Booking automation:** `/docs/BOOKING_AUTOMATION.md`
- **Testing guide:** `/docs/TESTING_BOOKINGS.md`
- **Database setup:** `/docs/DATABASE_SETUP.md`
- **Environment variables:** `/docs/ENVIRONMENT_VARIABLES_STRATEGY.md`

---

## 🆘 Need Help?

1. Check the documentation in `/docs/`
2. Review the CLAUDE.md file in project root
3. Check Supabase logs in Dashboard → Logs
4. Check Inngest logs in Inngest Dashboard
5. Look for screenshots in `screenshots/` directory

---

**Last Updated:** November 21, 2025
