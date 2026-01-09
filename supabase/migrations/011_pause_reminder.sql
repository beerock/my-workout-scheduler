-- Migration: Add Pause Reminder Email Preference
-- Created: 2026-01-08
-- Description: Adds pause reminder preference and notification type for 7-day pause reminder emails

-- =============================================================================
-- 1. ADD PAUSE REMINDER PREFERENCE TO user_settings
-- =============================================================================

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS email_on_pause_reminder BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN user_settings.email_on_pause_reminder IS 'Send email reminder 7 days after pausing schedule';

-- =============================================================================
-- 2. UPDATE notification_log CHECK CONSTRAINT
-- =============================================================================
-- Need to drop and recreate the constraint to add 'pause_reminder' type

-- Drop existing constraint
ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;

-- Recreate with pause_reminder added
ALTER TABLE notification_log
ADD CONSTRAINT notification_log_notification_type_check
CHECK (notification_type IN (
  'booking_success',
  'booking_waitlist',
  'booking_retry_successful',
  'booking_failure_critical',
  'booking_failure_config',
  'booking_failure_technical',
  'welcome',
  'first_booking_success',
  'credentials_updated',
  'daily_digest',
  'pause_reminder'
));

-- =============================================================================
-- 3. DATA MIGRATION - Set defaults for existing users
-- =============================================================================

UPDATE user_settings
SET email_on_pause_reminder = TRUE
WHERE email_on_pause_reminder IS NULL;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary of changes:
--   1. Added email_on_pause_reminder boolean column to user_settings (default TRUE)
--   2. Extended notification_type check constraint to include 'pause_reminder'
--
-- Verification queries:
--   SELECT email_on_pause_reminder FROM user_settings LIMIT 1;
--   SELECT enumlabel FROM pg_enum WHERE enumtypid = 'notification_type'::regtype; -- if using enum
