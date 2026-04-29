-- Migration: Add booking_retry_waitlisted notification type
-- Created: 2026-04-28
-- Description: Adds 'booking_retry_waitlisted' notification type for when a
--              previously full class opens a waitlist spot during retries and
--              the system successfully adds the user to the waitlist.

-- =============================================================================
-- 1. UPDATE notification_log type constraint
-- =============================================================================

ALTER TABLE notification_log
DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;

ALTER TABLE notification_log
ADD CONSTRAINT notification_log_notification_type_check
CHECK (notification_type IN (
  'booking_success',
  'booking_waitlist',
  'booking_already_registered',
  'booking_already_waitlisted',
  'booking_retry_successful',
  'booking_retry_waitlisted',
  'booking_failure_critical',
  'booking_failure_config',
  'booking_failure_technical',
  'booking_failure_retrying',
  'booking_failure_retrying_4hr',
  'booking_failure_final',
  'booking_no_registration',
  'welcome',
  'first_booking_success',
  'credentials_updated',
  'daily_digest',
  'pause_reminder',
  'admin_custom_class'
));
