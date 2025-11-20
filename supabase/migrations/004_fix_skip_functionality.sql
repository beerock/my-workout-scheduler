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

-- Drop old field
ALTER TABLE recurring_classes
DROP COLUMN IF EXISTS next_skip_date;

-- Add new fields
ALTER TABLE recurring_classes
ADD COLUMN skip_next_occurrence BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN skip_target_datetime TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN recurring_classes.skip_next_occurrence IS
  'Boolean flag indicating if next booking attempt should be skipped. Cleared after skip happens.';

COMMENT ON COLUMN recurring_classes.skip_target_datetime IS
  'Full datetime (with timezone) of the class being skipped. Used for UI display. Cleared after next successful booking.';

-- Add index for performance (Inngest queries by this flag)
CREATE INDEX idx_recurring_classes_skip_flag
ON recurring_classes(skip_next_occurrence)
WHERE skip_next_occurrence = true;
