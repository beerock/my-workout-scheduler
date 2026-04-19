-- Migration: Waitlist Signups
-- Created: 2026-04-19
-- Description: Adds waitlist_signups table for public landing page waitlist form.
--              Anyone can submit (INSERT is public). Only the service role
--              can read or update entries (admin review via /dashboard/admin/waitlist).

-- =============================================================================
-- 1. CREATE waitlist_signups TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'invited', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_at TIMESTAMPTZ
);

COMMENT ON TABLE waitlist_signups IS 'Public waitlist submissions from the landing page form';
COMMENT ON COLUMN waitlist_signups.email IS 'Email address (unique, used to prevent duplicate signups)';
COMMENT ON COLUMN waitlist_signups.note IS 'Optional freeform note from the submitter';
COMMENT ON COLUMN waitlist_signups.status IS 'Admin-managed lifecycle state: pending (new), invited (invite sent), declined (not a fit)';
COMMENT ON COLUMN waitlist_signups.created_at IS 'When the signup was submitted';
COMMENT ON COLUMN waitlist_signups.invited_at IS 'When the invite was sent (NULL until status moves to invited)';

-- Indexes for admin list sorting / filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON waitlist_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_status ON waitlist_signups(status);

-- =============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Strategy:
--   - INSERT: public (anonymous visitors submit through the form)
--   - SELECT / UPDATE / DELETE: service-role only (admin dashboard uses service role)
--
-- The service_role bypasses RLS entirely, so no explicit service-role policy is
-- needed. The only policy we write is a narrow public INSERT policy.

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Public INSERT: anyone (anon or authenticated) can submit a waitlist entry.
-- The server action is the intended caller, but letting anon roles submit
-- directly keeps the failure mode friendly (no 500s if RLS config shifts).
CREATE POLICY "Anyone can submit to waitlist"
  ON waitlist_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT / UPDATE / DELETE policies for anon or authenticated roles.
-- Absence of policy means: denied for those roles. service_role bypasses RLS.

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Verification:
--   -- As anon, INSERT should succeed:
--   SET ROLE anon;
--   INSERT INTO waitlist_signups (email) VALUES ('test@example.com');
--
--   -- As anon, SELECT should return zero rows (RLS hides them):
--   SELECT * FROM waitlist_signups;
--
--   -- As anon, UPDATE should report 0 rows affected (RLS blocks writes):
--   UPDATE waitlist_signups SET status = 'invited' WHERE email = 'test@example.com';
--
--   RESET ROLE;
