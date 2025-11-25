-- ============================================================================
-- USER DELETION SCRIPT WITH AUDIT LOGGING - UID VERSION (TEMPLATE)
-- ============================================================================
-- This script safely deletes users by UID while preserving an audit trail
--
-- ⚠️ IMPORTANT: This is a TEMPLATE with example UUIDs
-- Before using:
-- 1. Copy this file to scripts/private/ (gitignored)
-- 2. Find your admin user UIDs (see query below)
-- 3. Replace example UUIDs with your actual admin UIDs
-- 4. Run the customized script in Supabase SQL Editor
--
-- HOW TO FIND YOUR ADMIN UIDs:
-- Run this query first to get your admin user IDs:
--   SELECT id, email FROM auth.users WHERE email IN ('your-admin@email.com', 'other-admin@email.com');
--
-- Usage:
-- 1. Review the preview queries first
-- 2. Run the entire script in Supabase SQL Editor
-- 3. Check the deleted_users_audit table to see what was removed
-- ============================================================================

-- ============================================================================
-- STEP 1: Create audit table (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deleted_users_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_reason TEXT,
  user_metadata JSONB,
  -- Statistics at time of deletion
  total_classes INTEGER,
  total_booking_attempts INTEGER,
  had_gym_credentials BOOLEAN
);

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_deleted_users_audit_email ON deleted_users_audit(email);
CREATE INDEX IF NOT EXISTS idx_deleted_users_audit_deleted_at ON deleted_users_audit(deleted_at);

-- Enable RLS for security (service role only access)
ALTER TABLE deleted_users_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: PREVIEW - See what will be deleted
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== PREVIEW: Users that will be deleted ===';
END $$;

SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  (SELECT COUNT(*) FROM recurring_classes WHERE user_id = u.id) as class_count,
  (SELECT COUNT(*) FROM booking_attempts ba
   JOIN recurring_classes rc ON rc.id = ba.recurring_class_id
   WHERE rc.user_id = u.id) as booking_attempt_count,
  (SELECT COUNT(*) FROM gym_credentials WHERE user_id = u.id) as has_credentials
FROM auth.users u
WHERE id NOT IN (
  '00000000-0000-0000-0000-000000000001'::uuid,  -- ⚠️ REPLACE WITH YOUR ADMIN UID
  '00000000-0000-0000-0000-000000000002'::uuid   -- ⚠️ REPLACE WITH YOUR ADMIN UID
)
ORDER BY u.created_at DESC;

-- ============================================================================
-- STEP 3: Log users before deletion
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Logging users to audit table ===';
END $$;

INSERT INTO deleted_users_audit (
  user_id,
  email,
  created_at,
  deleted_reason,
  user_metadata,
  total_classes,
  total_booking_attempts,
  had_gym_credentials
)
SELECT
  u.id,
  u.email,
  u.created_at,
  'Bulk cleanup - keeping only admin users by UID', -- ⚠️ UPDATE THIS IF DESIRED
  u.raw_user_meta_data,
  (SELECT COUNT(*) FROM recurring_classes WHERE user_id = u.id),
  (SELECT COUNT(*) FROM booking_attempts ba
   JOIN recurring_classes rc ON rc.id = ba.recurring_class_id
   WHERE rc.user_id = u.id),
  (SELECT COUNT(*) FROM gym_credentials WHERE user_id = u.id) > 0
FROM auth.users u
WHERE id NOT IN (
  '00000000-0000-0000-0000-000000000001'::uuid,  -- ⚠️ REPLACE WITH YOUR ADMIN UID
  '00000000-0000-0000-0000-000000000002'::uuid   -- ⚠️ REPLACE WITH YOUR ADMIN UID
);

-- ============================================================================
-- STEP 4: Perform the deletion
-- ============================================================================

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '=== Deleting users (CASCADE will delete related data) ===';

  DELETE FROM auth.users
  WHERE id NOT IN (
    '00000000-0000-0000-0000-000000000001'::uuid,  -- ⚠️ REPLACE WITH YOUR ADMIN UID
    '00000000-0000-0000-0000-000000000002'::uuid   -- ⚠️ REPLACE WITH YOUR ADMIN UID
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % users', deleted_count;
END $$;

-- ============================================================================
-- STEP 5: Verify deletion
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Verification: Remaining users ===';
END $$;

SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  (SELECT COUNT(*) FROM recurring_classes WHERE user_id = u.id) as class_count,
  (SELECT COUNT(*) FROM gym_credentials WHERE user_id = u.id) as has_credentials
FROM auth.users u
ORDER BY u.created_at DESC;

-- ============================================================================
-- STEP 6: Show audit log
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Audit Log: Recently deleted users ===';
END $$;

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

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

DO $$
DECLARE
  remaining_users INTEGER;
  deleted_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_users FROM auth.users;
  SELECT COUNT(*) INTO deleted_users FROM deleted_users_audit;

  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY ===';
  RAISE NOTICE 'Remaining users: %', remaining_users;
  RAISE NOTICE 'Total deleted (audit log): %', deleted_users;
END $$;

-- ============================================================================
-- HELPER QUERY: Find your admin user IDs
-- ============================================================================
-- Uncomment and run this first to find your UIDs:
--
-- SELECT id, email, created_at
-- FROM auth.users
-- WHERE email IN ('your-admin@email.com', 'other-admin@email.com');
--
-- Copy the 'id' values and replace the example UUIDs above
-- ============================================================================
