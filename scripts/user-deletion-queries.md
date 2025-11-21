# User Deletion SQL Queries

Quick reference for common user deletion operations.

## 🔍 Preview Queries (Run First!)

### Count all users
```sql
SELECT COUNT(*) as total_users FROM auth.users;
```

### List all users
```sql
SELECT
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

### Preview users that would be deleted (except the 2 keepers)
```sql
SELECT
  u.id,
  u.email,
  u.created_at,
  (SELECT COUNT(*) FROM recurring_classes WHERE user_id = u.id) as class_count,
  (SELECT COUNT(*) FROM booking_attempts ba
   JOIN recurring_classes rc ON rc.id = ba.recurring_class_id
   WHERE rc.user_id = u.id) as booking_count
FROM auth.users u
WHERE email NOT IN ('YOUR_ADMIN_EMAIL', 'cnicolewill@gmail.com')
ORDER BY u.created_at DESC;
```

### Preview specific user details
```sql
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  (SELECT COUNT(*) FROM recurring_classes WHERE user_id = u.id) as class_count,
  (SELECT COUNT(*) FROM booking_attempts ba
   JOIN recurring_classes rc ON rc.id = ba.recurring_class_id
   WHERE rc.user_id = u.id) as booking_count,
  (SELECT COUNT(*) FROM gym_credentials WHERE user_id = u.id) as has_credentials
FROM auth.users u
WHERE email = 'user@example.com';
```

---

## 🗑️ Deletion Queries (Destructive!)

### Delete all users except YOUR_ADMIN_EMAIL and cnicolewill@gmail.com
```sql
DELETE FROM auth.users
WHERE email NOT IN ('YOUR_ADMIN_EMAIL', 'cnicolewill@gmail.com');
```

### Delete a specific user by email
```sql
DELETE FROM auth.users
WHERE email = 'user@example.com';
```

### Delete a specific user by ID
```sql
DELETE FROM auth.users
WHERE id = 'user-uuid-here';
```

---

## 📊 Audit Table Queries

### View recent deletions (if using audit scripts)
```sql
SELECT
  email,
  created_at as user_created,
  deleted_at,
  total_classes,
  total_booking_attempts,
  had_gym_credentials,
  deleted_reason
FROM deleted_users_audit
ORDER BY deleted_at DESC
LIMIT 20;
```

### Count total deleted users
```sql
SELECT COUNT(*) as total_deleted FROM deleted_users_audit;
```

### Search deleted users by email
```sql
SELECT * FROM deleted_users_audit
WHERE email ILIKE '%search-term%'
ORDER BY deleted_at DESC;
```

---

## ✅ Verification Queries (Run After Deletion)

### Verify remaining users
```sql
SELECT
  email,
  created_at,
  (SELECT COUNT(*) FROM recurring_classes WHERE user_id = auth.users.id) as class_count
FROM auth.users
ORDER BY created_at DESC;
```

### Verify orphaned data (should be empty due to CASCADE)
```sql
-- Check for gym_credentials without users (should be 0)
SELECT COUNT(*) as orphaned_credentials
FROM gym_credentials gc
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = gc.user_id);

-- Check for recurring_classes without users (should be 0)
SELECT COUNT(*) as orphaned_classes
FROM recurring_classes rc
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = rc.user_id);

-- Check for user_settings without users (should be 0)
SELECT COUNT(*) as orphaned_settings
FROM user_settings us
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = us.user_id);
```

---

## 🚀 Recommended Scripts

For safer deletions with audit logging, use these scripts:

1. **Bulk deletion with logging:**
   - File: `scripts/delete-users-with-logging.sql`
   - Use when: Cleaning up multiple users
   - Features: Preview, audit log, verification

2. **Single user deletion:**
   - File: `scripts/delete-single-user.sql`
   - Use when: Removing one specific user
   - Features: Detailed preview, audit log

---

## ⚠️ Important Notes

### What Gets Deleted (CASCADE)
When you delete a user from `auth.users`, these tables automatically cascade delete:
- ✅ `gym_credentials` - User's gym login info
- ✅ `recurring_classes` - User's class schedules
- ✅ `booking_attempts` - All booking history
- ✅ `user_settings` - User settings

### What Doesn't Get Deleted
- ⚠️ **Inngest scheduled events** - Will still trigger but fail gracefully when class data is missing
- ⚠️ **Audit logs** - If using `deleted_users_audit`, records remain for historical tracking

### Safety Tips
1. **Always run preview queries first**
2. **Backup your database** before bulk deletions
3. **Test on a single user** before bulk operations
4. **Check the audit log** to verify deletions
5. **Run verification queries** to confirm cascade worked

---

## 📍 Where to Run These

### Supabase Dashboard (Recommended)
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Paste the SQL
5. Click **Run** or press `Ctrl+Enter`

### Supabase CLI
```bash
supabase db execute --db-url "your-connection-string" --file query.sql
```

---

## 🆘 Undo Deletions

**Important:** There is **NO UNDO** for deletions. Once deleted, data is gone forever unless you have backups.

**Backup before deletion:**
1. Go to Supabase Dashboard
2. Navigate to **Database** → **Backups**
3. Or export users to CSV first:
   ```sql
   COPY (SELECT * FROM auth.users) TO '/path/to/users_backup.csv' CSV HEADER;
   ```
