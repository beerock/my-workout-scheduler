-- Migration: Email Notification System
-- Created: 2025-12-23
-- Description: Adds user notification preferences, notification logging, and digest queue tables

-- =============================================================================
-- 1. EXTEND user_settings TABLE
-- =============================================================================
-- Add notification preference columns to existing user_settings table

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'immediate'
  CHECK (notification_frequency IN ('immediate', 'daily_digest', 'critical_only', 'off')),
ADD COLUMN IF NOT EXISTS email_on_success BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_on_waitlist BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_on_failure BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_on_retry BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS daily_digest_time TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

COMMENT ON COLUMN user_settings.notification_email IS 'Master toggle for all email notifications';
COMMENT ON COLUMN user_settings.notification_frequency IS 'How often user receives emails: immediate, daily_digest, critical_only, or off';
COMMENT ON COLUMN user_settings.email_on_success IS 'Send email when booking confirmed (immediate mode only)';
COMMENT ON COLUMN user_settings.email_on_waitlist IS 'Send email when waitlisted (immediate mode only)';
COMMENT ON COLUMN user_settings.email_on_failure IS 'Send email when booking fails (immediate mode only)';
COMMENT ON COLUMN user_settings.email_on_retry IS 'Send email on first retry when class full (immediate mode only)';
COMMENT ON COLUMN user_settings.daily_digest_time IS 'Time of day to send daily digest (in user timezone)';
COMMENT ON COLUMN user_settings.timezone IS 'User timezone for daily digest scheduling (IANA timezone identifier)';

-- =============================================================================
-- 2. CREATE notification_log TABLE
-- =============================================================================
-- Tracks all sent notifications for audit trail and delivery tracking

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_attempt_id UUID REFERENCES booking_attempts(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL
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
      'daily_digest'
    )),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent'
    CHECK (delivery_status IN ('sent', 'delivered', 'bounced', 'failed')),
  email_subject TEXT,
  email_body TEXT,
  resend_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notification_log IS 'Audit trail of all email notifications sent to users';
COMMENT ON COLUMN notification_log.user_id IS 'User who received the notification';
COMMENT ON COLUMN notification_log.booking_attempt_id IS 'Related booking attempt (NULL for non-booking notifications)';
COMMENT ON COLUMN notification_log.notification_type IS 'Type of notification sent';
COMMENT ON COLUMN notification_log.sent_at IS 'When the email was sent';
COMMENT ON COLUMN notification_log.delivery_status IS 'Email delivery status from Resend';
COMMENT ON COLUMN notification_log.email_subject IS 'Email subject line (for debugging)';
COMMENT ON COLUMN notification_log.email_body IS 'Email HTML body (for debugging)';
COMMENT ON COLUMN notification_log.resend_id IS 'Resend API email ID for tracking';
COMMENT ON COLUMN notification_log.error_message IS 'Error details if delivery failed';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_booking ON notification_log(booking_attempt_id) WHERE booking_attempt_id IS NOT NULL;

-- =============================================================================
-- 3. ROW LEVEL SECURITY (RLS) for notification_log
-- =============================================================================

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notification_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert notifications (Inngest background jobs)
CREATE POLICY "Service role can insert notifications"
  ON notification_log
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway, but explicit for clarity

-- Policy: Service role can update notifications (delivery status updates)
CREATE POLICY "Service role can update notifications"
  ON notification_log
  FOR UPDATE
  USING (true);

-- =============================================================================
-- 4. CREATE notification_digest_queue TABLE (Post-MVP)
-- =============================================================================
-- Queue for batching notifications into daily digest emails

CREATE TABLE IF NOT EXISTS notification_digest_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_attempt_id UUID REFERENCES booking_attempts(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  class_name TEXT NOT NULL,
  class_date DATE NOT NULL,
  status TEXT NOT NULL,
  error_summary TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ
);

COMMENT ON TABLE notification_digest_queue IS 'Queue for batching notifications into daily digest emails';
COMMENT ON COLUMN notification_digest_queue.user_id IS 'User to receive the digest';
COMMENT ON COLUMN notification_digest_queue.booking_attempt_id IS 'Related booking attempt';
COMMENT ON COLUMN notification_digest_queue.notification_type IS 'Type of notification (for categorization in digest)';
COMMENT ON COLUMN notification_digest_queue.class_name IS 'Class name for display in digest';
COMMENT ON COLUMN notification_digest_queue.class_date IS 'Date of the class';
COMMENT ON COLUMN notification_digest_queue.status IS 'Booking status (confirmed, waitlisted, failed, etc.)';
COMMENT ON COLUMN notification_digest_queue.error_summary IS 'Short error message if failed (truncated for digest)';
COMMENT ON COLUMN notification_digest_queue.queued_at IS 'When notification was queued for digest';
COMMENT ON COLUMN notification_digest_queue.processed IS 'Whether this item has been included in a digest email';
COMMENT ON COLUMN notification_digest_queue.processed_at IS 'When this item was processed into a digest';

-- Create indexes for digest processing
CREATE INDEX IF NOT EXISTS idx_digest_queue_user ON notification_digest_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_queue_processed ON notification_digest_queue(processed, queued_at);
CREATE INDEX IF NOT EXISTS idx_digest_queue_user_unprocessed ON notification_digest_queue(user_id, processed, queued_at)
  WHERE processed = FALSE;

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) for notification_digest_queue
-- =============================================================================

ALTER TABLE notification_digest_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own digest queue items
CREATE POLICY "Users can view own digest queue"
  ON notification_digest_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage digest queue (Inngest background jobs)
CREATE POLICY "Service role can insert digest items"
  ON notification_digest_queue
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update digest items"
  ON notification_digest_queue
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete digest items"
  ON notification_digest_queue
  FOR DELETE
  USING (true);

-- =============================================================================
-- 6. DATA MIGRATION - Set defaults for existing users
-- =============================================================================
-- Existing users in user_settings will automatically get default values
-- due to DEFAULT constraints, but let's be explicit for clarity

UPDATE user_settings
SET
  notification_email = COALESCE(notification_email, TRUE),
  notification_frequency = COALESCE(notification_frequency, 'immediate'),
  email_on_success = COALESCE(email_on_success, TRUE),
  email_on_waitlist = COALESCE(email_on_waitlist, TRUE),
  email_on_failure = COALESCE(email_on_failure, TRUE),
  email_on_retry = COALESCE(email_on_retry, TRUE),
  daily_digest_time = COALESCE(daily_digest_time, '08:00:00'::TIME),
  timezone = COALESCE(timezone, 'America/New_York')
WHERE
  notification_email IS NULL
  OR notification_frequency IS NULL
  OR email_on_success IS NULL
  OR email_on_waitlist IS NULL
  OR email_on_failure IS NULL
  OR email_on_retry IS NULL
  OR daily_digest_time IS NULL
  OR timezone IS NULL;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary of changes:
--   1. Extended user_settings with 8 notification preference columns
--   2. Created notification_log table with RLS policies
--   3. Created notification_digest_queue table with RLS policies (post-MVP)
--   4. Added indexes for query performance
--   5. Applied default values to existing users
--
-- Verification queries:
--   SELECT * FROM user_settings LIMIT 1; -- Check new columns
--   SELECT * FROM notification_log LIMIT 1; -- Should be empty initially
--   SELECT * FROM notification_digest_queue LIMIT 1; -- Should be empty initially
