-- Migration: Fix Class Full Notification Deduplication
-- Created: 2026-01-11
-- Description: Adds columns for proper deduplication of "class full" retry emails
--              and adds new notification type for retrying emails

-- =============================================================================
-- 1. ADD notification_type 'booking_failure_retrying'
-- =============================================================================
-- Update the CHECK constraint to include the new notification type

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
  'welcome',
  'first_booking_success',
  'credentials_updated',
  'daily_digest'
));

COMMENT ON COLUMN notification_log.notification_type IS 'Type of notification sent. booking_failure_retrying is sent when class is full and system is retrying.';

-- =============================================================================
-- 2. ADD recurring_class_id AND class_date COLUMNS
-- =============================================================================
-- These columns enable deduplication by class instance (not booking attempt)

ALTER TABLE notification_log
ADD COLUMN IF NOT EXISTS recurring_class_id UUID REFERENCES recurring_classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS class_date DATE;

COMMENT ON COLUMN notification_log.recurring_class_id IS 'The recurring class this notification is for (for deduplication)';
COMMENT ON COLUMN notification_log.class_date IS 'The specific date of the class instance (for deduplication)';

-- =============================================================================
-- 3. CREATE INDEX for efficient deduplication queries
-- =============================================================================
-- Index for looking up existing notifications by class instance

CREATE INDEX IF NOT EXISTS idx_notification_log_class_dedup
ON notification_log(user_id, recurring_class_id, class_date, notification_type)
WHERE recurring_class_id IS NOT NULL AND class_date IS NOT NULL;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary of changes:
--   1. Added 'booking_failure_retrying' and 'booking_failure_retrying_4hr' to notification_type
--   2. Added recurring_class_id and class_date columns for deduplication
--   3. Added index for efficient deduplication queries
--
-- This enables the system to:
--   - Send ONE initial "class full" email per class instance (not per retry)
--   - Send ONE 4-hour update email per class instance
--   - Properly track which class instances have been notified
