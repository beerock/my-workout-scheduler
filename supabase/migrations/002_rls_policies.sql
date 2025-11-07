-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE gym_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_attempts ENABLE ROW LEVEL SECURITY;

-- gym_credentials policies
-- Users can only see and manage their own credentials
CREATE POLICY "Users can view their own gym credentials"
  ON gym_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gym credentials"
  ON gym_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gym credentials"
  ON gym_credentials FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gym credentials"
  ON gym_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- recurring_classes policies
-- Users can only see and manage their own classes
CREATE POLICY "Users can view their own recurring classes"
  ON recurring_classes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring classes"
  ON recurring_classes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring classes"
  ON recurring_classes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring classes"
  ON recurring_classes FOR DELETE
  USING (auth.uid() = user_id);

-- booking_attempts policies
-- Users can only see booking attempts for their own classes
CREATE POLICY "Users can view booking attempts for their classes"
  ON booking_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recurring_classes
      WHERE recurring_classes.id = booking_attempts.recurring_class_id
      AND recurring_classes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert booking attempts for their classes"
  ON booking_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recurring_classes
      WHERE recurring_classes.id = booking_attempts.recurring_class_id
      AND recurring_classes.user_id = auth.uid()
    )
  );

-- Note: Booking attempts are typically created by the automation system
-- Users don't need to update or delete booking attempts manually

