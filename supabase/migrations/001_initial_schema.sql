-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- gym_credentials table
CREATE TABLE gym_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_url TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  default_branch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create recurring_classes table
CREATE TABLE recurring_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  class_time TIME NOT NULL,
  class_type TEXT NOT NULL,
  branch TEXT NOT NULL,
  booking_window_hours INTEGER NOT NULL DEFAULT 26,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create booking_attempts table
CREATE TABLE booking_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_class_id UUID NOT NULL REFERENCES recurring_classes(id) ON DELETE CASCADE,
  attempt_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'failed')),
  branch_used TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_gym_credentials_user_id ON gym_credentials(user_id);
CREATE INDEX idx_recurring_classes_user_id ON recurring_classes(user_id);
CREATE INDEX idx_recurring_classes_active ON recurring_classes(active);
CREATE INDEX idx_booking_attempts_recurring_class_id ON booking_attempts(recurring_class_id);
CREATE INDEX idx_booking_attempts_attempt_timestamp ON booking_attempts(attempt_timestamp);
CREATE INDEX idx_booking_attempts_status ON booking_attempts(status);
-- Composite index for common queries (e.g., "show all failed attempts for this class")
CREATE INDEX idx_booking_attempts_class_status ON booking_attempts(recurring_class_id, status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_gym_credentials_updated_at
  BEFORE UPDATE ON gym_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_classes_updated_at
  BEFORE UPDATE ON recurring_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

