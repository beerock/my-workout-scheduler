-- ============================================================================
-- USER DELETION SCRIPT WITH AUDIT LOGGING
-- ============================================================================
-- This script safely deletes users while preserving an audit trail
--
-- Usage:
-- 1. Review the preview queries first
-- 2. Run the entire script in Supabase SQL Editor
-- 3. Check the deleted_users_audit table to see what was removed
--
-- IMPORTANT: This creates a permanent audit log of deleted users
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
WHERE email NOT IN ('YOUR_ADMIN_EMAIL', 'cnicolewill@gmail.com')
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
  'Bulk cleanup - keeping only YOUR_ADMIN_EMAIL and cnicolewill@gmail.com',
  u.raw_user_meta_data,
  (SELECT COUNT(*) FROM recurring_classes WHERE user_id = u.id),
  (SELECT COUNT(*) FROM booking_attempts ba
   JOIN recurring_classes rc ON rc.id = ba.recurring_class_id
   WHERE rc.user_id = u.id),
  (SELECT COUNT(*) FROM gym_credentials WHERE user_id = u.id) > 0
FROM auth.users u
WHERE email NOT IN ('YOUR_ADMIN_EMAIL', 'cnicolewill@gmail.com');

-- ============================================================================
-- STEP 4: Perform the deletion
-- ============================================================================

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '=== Deleting users (CASCADE will delete related data) ===';

  DELETE FROM auth.users
  WHERE email NOT IN ('YOUR_ADMIN_EMAIL', 'cnicolewill@gmail.com');

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
