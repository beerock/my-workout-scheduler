# Database Backup Guide

This guide explains how to backup and restore your Supabase database on the **free tier**.

---

## Quick Start

### 1. Get Your Database Password

**⚠️ Important:** Supabase only shows the database password once when the project is created. If you don't have it saved, you'll need to reset it.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** → **Database**
3. Scroll to **Database password** section
4. Click **Reset database password**
5. **Copy the new password immediately** (you won't be able to see it again!)
6. Save it securely (password manager recommended)

The password will look something like: `your-long-random-password-here`

**Note:** Resetting the password will invalidate any existing connections using the old password. Update all services that connect to your database.

### 2. Add Password to Environment Variables

Add to your `.env.local` file:

```env
SUPABASE_DB_PASSWORD=your_actual_password_here
```

**⚠️ IMPORTANT:** Never commit this password to git! (`.env.local` is already in `.gitignore`)

### 3. Install PostgreSQL Client Tools

The backup script uses `pg_dump`, which requires PostgreSQL client tools:

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**macOS:**
```bash
brew install postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### 4. Run Backup

```bash
npm run backup
```

This creates a backup file in the `backups/` directory with a timestamp:
```
backups/backup_2025-11-22_14-30-00.sql
```

---

## Restoring a Backup

### Option 1: Using psql (Command Line)

```bash
# Replace [PASSWORD] with your database password
# Replace [PROJECT-REF] with your project reference
# Replace [BACKUP-FILE] with your backup filename

psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" < backups/backup_2025-11-22_14-30-00.sql
```

### Option 2: Using Supabase Dashboard

1. Go to **Database** → **SQL Editor**
2. Open your backup SQL file in a text editor
3. Copy the SQL contents
4. Paste into SQL Editor
5. Click **Run**

**Note:** For large backups, the command line method is recommended.

---

## Backup Best Practices

### When to Backup

Create backups:
- ✅ Before major schema changes or migrations
- ✅ Before testing new features that modify data
- ✅ Before user deletion operations
- ✅ Weekly (for regular snapshots)
- ✅ Before deploying to production

### Storage Recommendations

**Local Development:**
- Backups are saved to `backups/` directory (gitignored)
- Keep at least 3-7 recent backups
- Manually delete old backups to save disk space

**Production:**
- Store backups in a secure location (cloud storage, external drive)
- Consider automated backup scheduling (cron job)
- Keep backups for at least 30 days

### Security

- ✅ Backup files contain sensitive data (user emails, gym credentials, etc.)
- ✅ Never commit backup files to git
- ✅ Encrypt backups if storing remotely
- ✅ Restrict access to backup files

---

## Automated Backups (Optional)

For regular automated backups, you can set up a cron job:

### Linux/macOS (crontab)

```bash
# Edit crontab
crontab -e

# Add this line for weekly backups (Sundays at 2 AM)
0 2 * * 0 cd /path/to/my-workout-scheduler && npm run backup
```

### GitHub Actions (Alternative)

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PostgreSQL client
        run: sudo apt-get install postgresql-client

      - name: Create backup
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: npm run backup

      - name: Upload backup
        uses: actions/upload-artifact@v4
        with:
          name: database-backup-${{ github.run_number }}
          path: backups/*.sql
          retention-days: 30
```

**Note:** Add `SUPABASE_DB_PASSWORD` to GitHub Secrets (Settings → Secrets and variables → Actions).

---

## Troubleshooting

### Error: "pg_dump: command not found"

**Solution:** Install PostgreSQL client tools (see step 3 above)

### Error: "password authentication failed"

**Solutions:**
1. Verify `SUPABASE_DB_PASSWORD` is correct in `.env.local`
2. Get fresh password from Supabase Dashboard → Settings → Database
3. Ensure no extra spaces in the password

### Error: "could not translate host name"

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct in `.env.local`
2. Check internet connection
3. Ensure Supabase project is active (not paused)

### Error: "permission denied"

**Solutions:**
1. Check file permissions on `backups/` directory
2. Ensure you have write access to the project directory

### Backup file is empty or very small

**Solutions:**
1. Check database actually has data (Supabase Dashboard → Table Editor)
2. Verify connection string is correct
3. Check for error messages in the output

---

## FAQ

### Q: How large will my backup files be?

**A:** Depends on your data:
- Empty database: ~5-10 KB
- MVP (5 users, 20 classes, 100 bookings): ~50-100 KB
- Text-based data compresses well (consider gzip for storage)

### Q: Can I backup to a different location?

**A:** Yes, modify `scripts/backup-database.ts`:
```typescript
const backupsDir = '/path/to/your/backup/location'
```

### Q: Should I backup on production too?

**A:** Free tier only allows backups via pg_dump. For production:
- Consider upgrading to Supabase Pro ($25/month) for automatic daily backups
- Or set up automated pg_dump backups (cron job or GitHub Actions)

### Q: Can I restore to a different Supabase project?

**A:** Yes! Just change the connection string when restoring:
```bash
psql "postgresql://postgres:[PASSWORD]@db.[NEW-PROJECT-REF].supabase.co:5432/postgres" < backup.sql
```

### Q: Will this backup Supabase Auth users?

**A:** No. `pg_dump` only backs up the `public` schema by default. Auth users are in the `auth` schema. To include auth users:

```bash
# Backup all schemas
pg_dump --schema=public --schema=auth "postgresql://..." > backup.sql
```

**Note:** Restoring auth users may require service role access and careful handling.

---

## Related Documentation

- **Environment Variables:** `ENVIRONMENT_VARIABLES_STRATEGY.md`
- **Database Setup:** `DATABASE_SETUP.md`
- **User Deletion:** `scripts/delete-users-with-logging.sql`

---

**Last Updated:** November 22, 2025
