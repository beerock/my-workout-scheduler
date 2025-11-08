-- ============================================================================
-- SCHEDULE MANAGEMENT & PAUSE FEATURES
-- ============================================================================

-- Add next_skip_date to recurring_classes table
ALTER TABLE recurring_classes
ADD COLUMN next_skip_date DATE;

-- Create user_settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update booking_attempts status enum to include 'skipped'
ALTER TABLE booking_attempts
DROP CONSTRAINT IF EXISTS booking_attempts_status_check;

ALTER TABLE booking_attempts
ADD CONSTRAINT booking_attempts_status_check
CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'failed', 'skipped'));

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_recurring_classes_next_skip_date ON recurring_classes(next_skip_date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Apply updated_at trigger to user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users don't need to delete settings (cascade delete handles it)

