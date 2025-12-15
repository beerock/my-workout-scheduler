-- Migration: Fix Skip Functionality with Two-Field Approach
-- Date: 2025-11-20
-- Description:
--   Replace next_skip_date (string) with two fields:
--   - skip_next_occurrence (boolean) - flag for business logic
--   - skip_target_datetime (timestamptz) - full datetime for UI display
--
-- Benefits:
--   - Simpler business logic (boolean check, no date comparison)
--   - No timezone bugs in skip logic
--   - Proper datetime storage with timezone
--   - UI can format in gym's timezone

-- Step 1: Add new fields (before dropping old one to preserve data)
ALTER TABLE recurring_classes
ADD COLUMN skip_next_occurrence BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN skip_target_datetime TIMESTAMPTZ;

-- Step 2: Migrate existing skip data from next_skip_date to new fields
-- next_skip_date is DATE type, class_time is TIME type
-- Both cast to TEXT for concatenation (DATE -> YYYY-MM-DD, TIME -> HH:MM:SS)
UPDATE recurring_classes
SET
  skip_next_occurrence = TRUE,
  skip_target_datetime = (
    (next_skip_date::TEXT || ' ' || class_time::TEXT)::timestamp AT TIME ZONE timezone
  )
WHERE next_skip_date IS NOT NULL;

-- Step 3: Drop old field (data is now migrated)
ALTER TABLE recurring_classes
DROP COLUMN next_skip_date;

-- Add comments for documentation
COMMENT ON COLUMN recurring_classes.skip_next_occurrence IS
  'Boolean flag indicating if next booking attempt should be skipped. Cleared after skip happens.';

COMMENT ON COLUMN recurring_classes.skip_target_datetime IS
  'Full datetime (with timezone) of the class being skipped. Used for UI display. Cleared after next successful booking.';

-- Add index for performance (Inngest queries by this flag)
CREATE INDEX idx_recurring_classes_skip_flag
ON recurring_classes(skip_next_occurrence)
WHERE skip_next_occurrence = true;
