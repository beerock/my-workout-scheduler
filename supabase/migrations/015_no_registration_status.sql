-- Migration: Add no_registration booking status and notification type
-- Created: 2026-04-08
-- Description: Adds 'no_registration' status for classes that don't offer online
--              registration (drop-in, special programs, paid programs, etc.)
--              and 'booking_no_registration' notification type.

-- =============================================================================
-- 1. UPDATE booking_attempts status constraint
-- =============================================================================

ALTER TABLE booking_attempts
DROP CONSTRAINT IF EXISTS booking_attempts_status_check;

ALTER TABLE booking_attempts
ADD CONSTRAINT booking_attempts_status_check
CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'failed', 'skipped', 'no_registration'));

-- =============================================================================
-- 2. UPDATE notification_log type constraint
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
  'booking_no_registration',
  'welcome',
  'first_booking_success',
  'credentials_updated',
  'daily_digest',
  'pause_reminder',
  'admin_custom_class'
));
