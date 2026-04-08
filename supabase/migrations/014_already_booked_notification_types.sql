-- Migration: Add already-booked notification types
-- Created: 2026-04-08
-- Description: Adds 'booking_already_registered' and 'booking_already_waitlisted'
--              notification types for when the system detects a user is already
--              registered or waitlisted for a class.

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
