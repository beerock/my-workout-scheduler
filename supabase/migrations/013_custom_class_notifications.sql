-- Migration: Custom Class Name Notifications
-- Adds deduplication table for custom class name admin notifications
-- and extends notification_log type constraint

-- =============================================================================
-- 1. CREATE custom_class_names TABLE (deduplication for admin notifications)
-- =============================================================================

CREATE TABLE IF NOT EXISTS custom_class_names (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  normalized_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by_email TEXT,
  submitted_by_name TEXT,
  recurring_class_id UUID REFERENCES recurring_classes(id) ON DELETE SET NULL,
  branch TEXT,
  day_of_week INTEGER,
  class_time TEXT,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: service role only (no user-facing access needed)
ALTER TABLE custom_class_names ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE custom_class_names IS 'Tracks custom class names submitted by users for admin notification deduplication';
COMMENT ON COLUMN custom_class_names.normalized_name IS 'Normalized class name for deduplication (lowercase, stripped special chars)';
COMMENT ON COLUMN custom_class_names.display_name IS 'Original display name as entered by user';
COMMENT ON COLUMN custom_class_names.submitted_by IS 'User who first submitted this custom class name';
COMMENT ON COLUMN custom_class_names.recurring_class_id IS 'Link to the recurring class entry that triggered the notification';

-- =============================================================================
-- 2. UPDATE notification_log type constraint to include admin_custom_class
-- =============================================================================
-- Note: Also re-adds 'pause_reminder' which was accidentally dropped in migration 012

ALTER TABLE notification_log
DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;

ALTER TABLE notification_log
ADD CONSTRAINT notification_log_notification_type_check
CHECK (notification_type IN (
  'booking_success',
  'booking_waitlist',
  'booking_retry_successful',
  'booking_failure_critical',
  'booking_failure_config',
  'booking_failure_technical',
  'booking_failure_retrying',
  'booking_failure_retrying_4hr',
  'booking_failure_final',
  'welcome',
  'first_booking_success',
  'credentials_updated',
  'daily_digest',
  'pause_reminder',
  'admin_custom_class'
));

-- =============================================================================
-- Summary of changes:
--   1. Created custom_class_names table for deduplicating admin notifications
--   2. Extended notification_type check constraint to include 'admin_custom_class'
--   3. Re-added 'pause_reminder' and added 'booking_failure_final' to constraint
--
-- Verification queries:
--   SELECT * FROM custom_class_names LIMIT 1;
--   INSERT INTO notification_log (user_id, notification_type, delivery_status)
--     VALUES ('...', 'admin_custom_class', 'sent'); -- should succeed
-- =============================================================================
