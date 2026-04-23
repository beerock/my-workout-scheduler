# Sprint 1.5 — Short Follow-up Sprint (post-Sprint-1)

**Last Updated:** April 23, 2026

**Status:** Planned
**Parent:** Sprint 1 (merged via PR #122, hotfixes via PR #123 + #124)
**Source plan:** `~/.claude/plans/frolicking-wishing-lighthouse.md` (section "Sprint 1.5 — Credential Testing + Realtime Retry")

---

## Context

Sprint 1.5 was originally scoped as a short follow-up after Sprint 1 merges, covering two items that exceeded Sprint 1's scope:

1. **Credential testing on the credentials page** — a "test my login" button that runs a Puppeteer flow against YMCA/GroupExPro to verify saved credentials work without triggering a real booking.
2. **Dashboard realtime retry status** — show a live indicator during `in_progress` / `retrying` windows so users can see the system actually working (today they only find out after-the-fact via email).

Post-Sprint-1 production testing surfaced additional debugging items for `ActionItemsCard` and a handful of smaller state-machine edge cases the owner chose to defer rather than chase in hotfix PRs. Those are grouped here.

Sprint 1.5 opens off a fresh branch after the current hotfix PR (#124) merges.

---

## Scope

### P0 — Credential testing on the credentials page
**Carried from the original plan.** Add a "Test login" button on `/dashboard/credentials` that runs the Puppeteer login flow (login → verify GroupExPro dashboard reachable → logout) without booking anything. Surfaces credential failures immediately instead of at the next booking cycle.

**Requirements:**
- Button on credentials page, only shown when credentials exist
- Server action triggers a Puppeteer-only login test via GH Actions (new workflow or existing one with a `--test-only` flag)
- UI shows "Testing..." → "Works" / "Login failed: [reason]"
- Rate-limited (e.g. 1 test per 30 seconds) to avoid spam-testing YMCA

### P1 — Dashboard realtime retry status
**Carried from the original plan.** During an attempt's `in_progress` / `retrying` window (up to 15 min for a full-class retry loop), the dashboard shows nothing — user only learns the outcome via email. Add a live indicator.

**Requirements:**
- Dashboard polls `booking_attempts` for the next upcoming class every ~30s when an attempt is in flight
- `NextClassCard` or a new inline indicator shows "Booking now…" / "Retrying — checking every 15 min" in real time
- Stops polling once status resolves (confirmed / waitlisted / failed-terminal)
- Supabase realtime preferred; short-poll fallback acceptable

### P2 — ActionItemsCard edge-case debugging (new, deferred from post-Sprint-1 testing)
The card's Sprint 1 implementation works for the common case but has untested states that need design treatment. Parking here rather than chasing individual bugs in hotfixes.

**Known debugging / open questions:**
- How does the card render when there's a mix of credential failures and config failures?
- Does the severity order match user expectation, or should credential issues always sort first?
- The "Review all" CTA destination (`/dashboard/schedule`) doesn't filter or highlight the problem classes — is a dedicated `/dashboard/schedule?filter=action-needed` route worth adding?
- Does the card need a "dismiss this item for now" escape hatch when the user fixed the issue out-of-band and the card hasn't refreshed?
- How does the card behave when the same class has multiple consecutive failures of different types?

**Not in scope:** redesigning the card structure or voice — the Sprint 1 shape is working. This is debugging state-machine edge cases and filling in missing interactions.

### P3 — `NextClassCard` state-matrix verification (new)
Sprint 1 + the two hotfix PRs (#123, #124) reworked the pending states substantially:
- "On deck — pre-window" (bookingOpensAt set)
- "On deck — within-window, no active retry" (default pending)
- "Watching — actively retrying class-full loop" (isRetrying=true)
- "Booked" (confirmed)
- "Waitlist" (waitlisted)

Do a systematic walk through each state in both preview (`/admin/dashboard-preview`) and production data. Verify:
- Every state renders correctly at 320px, 375px, desktop
- Transitions between states behave correctly (skip → unskip, post-window natural transition to next week's pre-window, class-full → retry → confirmed)
- The `isRetrying` detection in `dashboard-stats.ts` correctly distinguishes class-full retries from other failed statuses (no false positives)

---

## Out of scope

- Anything from Sprint 2 (security + tech-debt cleanup)
- Sprint 1.1 items (holistic `/frontend-design` skill review pass)
- Booking-automation logic changes — the booking pipeline is frozen until Sprint 2

---

## Workflow rules

Same as Sprint 1 (see `~/.claude/plans/frolicking-wishing-lighthouse.md`):

- Pre-sprint baseline: `npm run test:booking-dry-run` as admin.
- ★ owner review gates at each P-chunk close.
- Admin preview pattern for non-trivial design decisions.
- Commit in small themed chunks, push to feature branch when each is verified.
- Walk the dev server at 320px for every UI change.

---

## Handoff / continuation

**Session start:**
1. Read this file + `docs/VOICE.md` + `CLAUDE.md`.
2. Verify the current hotfix PR has merged.
3. Branch off `main`: `feature/sprint-1.5-followup` (or per-item branches if each P-chunk ships separately).
4. Pre-sprint baseline: `npm run test:booking-dry-run`.
5. Pick up P0 (credential testing) first — largest scope, highest user value.

**Sprint close:**
1. P0 and P1 shipped. P2 / P3 either shipped or explicitly punted to Sprint 2 / BACKLOG.
2. Doc updates per CLAUDE.md triggers.
3. PR → review → merge to main.

---

## Inherited critical context

- **Inngest auto-syncs to most recent Vercel deploy.** Feature-branch commits redirect production email routing until merge. See BACKLOG entry "Separate Inngest Apps per Environment" for the structural fix.
- **VOICE.md is authoritative** for any user-facing copy (ActionItemsCard debugging, NextClassCard labels, credential-test success/failure messages). The `isRetrying` → "Watching / Checking every 15 min" copy is preserved for the one case we genuinely know: class-full retry loops.
- **Admin account for testing:** brockbusby@gmail.com (uid `a02ef692-1933-46b0-a77c-7258a577a5b5`).
