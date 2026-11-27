-- Migration: Cleanup Orphaned Pending Attempts
-- Created: 2026-11-27
-- Description: One-time cleanup of duplicate booking_attempts rows.
--              Until v2.39 every booking wrote two rows: Inngest's row (left
--              'pending' forever) and the GitHub Actions script's row (holds
--              the real result). Booking emails were logged against the
--              orphaned Inngest row. This migration:
--                1. Repoints notification_log links from each orphan to its
--                   real sibling row.
--                2. Deletes the orphans.
--              An orphan is a 'pending' row that has a non-pending row for the
--              same recurring_class_id within 10 minutes after it. Pending rows
--              with no such sibling are left untouched. Rows from the last hour
--              are skipped so an in-flight booking is never touched.
--              Deleting (not marking 'failed') is deliberate: 'failed' rows
--              appear in booking history and count against the success rate.
--

-- =============================================================================
-- 1. Map each orphan to its sibling (earliest non-pending row in the window)
-- =============================================================================

CREATE TEMP TABLE orphan_attempt_map AS
SELECT p.id AS orphan_id, s.id AS sibling_id
FROM booking_attempts p
CROSS JOIN LATERAL (
  SELECT o.id
  FROM booking_attempts o
  WHERE o.recurring_class_id = p.recurring_class_id
    AND o.status <> 'pending'
    AND o.attempt_timestamp >= p.attempt_timestamp
    AND o.attempt_timestamp <= p.attempt_timestamp + INTERVAL '10 minutes'
  ORDER BY o.attempt_timestamp ASC
  LIMIT 1
) s
WHERE p.status = 'pending'
  AND p.attempt_timestamp < NOW() - INTERVAL '1 hour';

-- =============================================================================
-- 2. Repoint notification_log links to the sibling row
-- =============================================================================

UPDATE notification_log nl
SET booking_attempt_id = m.sibling_id
FROM orphan_attempt_map m
WHERE nl.booking_attempt_id = m.orphan_id;

-- =============================================================================
-- 3. Delete the orphans
-- =============================================================================

DELETE FROM booking_attempts ba
USING orphan_attempt_map m
WHERE ba.id = m.orphan_id;

DROP TABLE orphan_attempt_map;
