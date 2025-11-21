-- ============================================================================
-- DELETE SINGLE USER BY EMAIL (WITH AUDIT LOGGING)
-- ============================================================================
-- This script safely deletes a single user while preserving an audit trail
--
-- Usage:
-- 1. Replace 'user@example.com' with the actual email address
-- 2. Run the entire script in Supabase SQL Editor
-- 3. Check the deleted_users_audit table to see the deletion record
--
-- IMPORTANT: This permanently deletes the user and all their data
-- ============================================================================

-- ============================================================================
-- CONFIGURATION: Set the email address to delete
-- ============================================================================

DO $$
DECLARE
  email_to_delete TEXT := 'user@example.com'; -- ⚠️ CHANGE THIS EMAIL
  user_exists BOOLEAN;
  user_record RECORD;
BEGIN
  -- Check if user exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = email_to_delete
  ) INTO user_exists;

  IF NOT user_exists THEN
    RAISE NOTICE '❌ User with email "%" does not exist', email_to_delete;
    RETURN;
  END IF;

  RAISE NOTICE '=== Deleting user: % ===', email_to_delete;

  -- Get user details for logging
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.raw_user_meta_data,
    (SELECT COUNT(*) FROM recurring_classes WHERE user_id = u.id) as class_count,
    (SELECT COUNT(*) FROM booking_attempts ba
     JOIN recurring_classes rc ON rc.id = ba.recurring_class_id
     WHERE rc.user_id = u.id) as booking_count,
    (SELECT COUNT(*) FROM gym_credentials WHERE user_id = u.id) as has_creds
  INTO user_record
  FROM auth.users u
  WHERE email = email_to_delete;

  -- Preview what will be deleted
  RAISE NOTICE '';
  RAISE NOTICE '=== USER DETAILS ===';
  RAISE NOTICE 'Email: %', user_record.email;
  RAISE NOTICE 'User ID: %', user_record.id;
  RAISE NOTICE 'Created: %', user_record.created_at;
  RAISE NOTICE 'Last sign in: %', user_record.last_sign_in_at;
  RAISE NOTICE 'Recurring classes: %', user_record.class_count;
  RAISE NOTICE 'Booking attempts: %', user_record.booking_count;
  RAISE NOTICE 'Has gym credentials: %', (user_record.has_creds > 0);
  RAISE NOTICE '';

  -- Ensure audit table exists
  CREATE TABLE IF NOT EXISTS deleted_users_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_reason TEXT,
    user_metadata JSONB,
    total_classes INTEGER,
    total_booking_attempts INTEGER,
    had_gym_credentials BOOLEAN
  );

  -- Log to audit table
  INSERT INTO deleted_users_audit (
    user_id,
    email,
    created_at,
    deleted_reason,
    user_metadata,
    total_classes,
    total_booking_attempts,
    had_gym_credentials
  ) VALUES (
    user_record.id,
    user_record.email,
    user_record.created_at,
    'Manual deletion via delete-single-user.sql',
    user_record.raw_user_meta_data,
    user_record.class_count,
    user_record.booking_count,
    user_record.has_creds > 0
  );

  RAISE NOTICE '✅ Logged to audit table';

  -- Delete the user (CASCADE will handle related data)
  DELETE FROM auth.users WHERE email = email_to_delete;

  RAISE NOTICE '✅ User deleted successfully';
  RAISE NOTICE '';
  RAISE NOTICE '=== CASCADE DELETED ===';
  RAISE NOTICE '✅ Gym credentials';
  RAISE NOTICE '✅ Recurring classes';
  RAISE NOTICE '✅ Booking attempts';
  RAISE NOTICE '✅ User settings';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: Scheduled Inngest events will still trigger but fail gracefully';

END $$;
