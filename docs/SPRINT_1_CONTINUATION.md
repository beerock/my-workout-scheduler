# Sprint 1 — Continuation Prompt (task 6 / post-/clear)

**For the next session after /clear.** This doc + `docs/VOICE.md` + `CLAUDE.md` are the handoff. PR #122 body is the public summary.

## Where we are

**Sprint 1 of 3** — UX + Product Polish. Branch `feature/sprint-1-ux-polish`. Worktree `../my-workout-scheduler-worktrees/sprint-1-ux-polish`. PR **#122** open against `main`.

**Completed tasks 1–5 (merged into the feature branch, deployed to preview):**

1. **Waitlist flow** — public `/signup`, waitlist_signups table (migration 016), admin review at `/admin/waitlist`, branded invite email via `supabase.auth.admin.generateLink({type:'invite'})` + Resend send path.
2. **Voice consolidation** — `docs/VOICE.md` codifies two registers + four coach tiers + section-name pattern + FROM/reply policy + canonical YMCA WNC naming. All 15 email templates rewritten to match.
3. **Onboarding + failure surface** — `NextClassCard` has a new pending state ("On deck / Opens Tue 6:00 AM" pre-window, "Watching / Checking every 15 min" post-window retry) driven by a 7-day confirmed-attempt lookback that catches early-start bookings. New `ActionItemsCard` surfaces classes needing credentials or config fixes; multi-item collapses to a compact list.
4. **RecurringClassForm polish + inline preview** — new `FirstBookingPreview` renders "Class registration opens / Sun Apr 27 · 2:15 PM / We click Reserve the second it opens." Edge case "Booking now" variant for when window is already open. Form reorganized into "What class" + "When" sections. Timezone field hidden; Time label is "Time (Eastern)" with ET-only hint. "Registration Opens" field shows "[26] hours before class" inline. Success alert echoes the preview datetime. Redirect timeout bumped to 3s.
5. **A11y + hex + mobile 320px sweep** — GetStartedBanner gradient swapped to `purple-500/600/700` tokens. Decorative SVGs + emojis `aria-hidden`. `NextClassCard` class details row uses `flex-wrap`. `TimeInput` row uses `flex-wrap` so AM/PM toggle drops below on narrow screens.

**Admin preview surfaces built (same auth-gate pattern, all four):**
- `/admin/email-preview` — all 15 email templates
- `/admin/waitlist` — waitlist signups admin table
- `/admin/dashboard-preview` — `ActionItemsCard` + `NextClassCard` variant states
- `/admin/form-preview` — RecurringClassForm variant review (copy + visual + polish options)

## Task 6 — what's left (this session's work)

**Sprint plan says:** `/frontend-design review + landing polish (2h budget)`.

### Explicit carryovers from task 5 review

These were flagged during the task 5 preview walk but deferred to task 6 as holistic design calls:

1. **Branch Select truncation at 320px** — "Hendersonville Family YMCA" gets cut off visually. Native `<select>` text doesn't truncate with ellipsis reliably. Recommended fix: swap the Branch field from the shared `Select` component to a custom dropdown (the `Combobox` component already does this for Class Name — reuse its pattern). This is a component-type decision, not pure CSS, hence task 6.

2. **Copy noise in RecurringClassForm** — at 320px, four consecutive fields each with their own helper text below reads as a wall of gray. Owner question: "do we need all four hints?" Review whether some can compress to placeholder text, tooltips, or be removed. Fields involved:
   - Class Name: "Search by name or browse the list"
   - Time (Eastern): "All YMCA WNC classes run in Eastern time, wherever you are."
   - Registration Opens: "Most are 26 — double-check the class page on the YMCA site if yours is different."
   - (Class Name combobox already has a placeholder, so its hint may be redundant.)

3. **Custom rgba shadows** (low priority) — NextClassCard dark-card shadow and GetStartedBanner purple-glow shadow don't match any existing `shadow-*` token. Left inline per the "no design system additions without permission" rule. Task 6 can decide whether to add named tokens (e.g. `shadow-card-dark`, `shadow-card-purple`) or leave them as-is.

### Original task 6 scope

- Run the `/frontend-design` skill with fresh eyes on these surfaces: `/` (landing), `/signup` (waitlist form), `/dashboard`, `/dashboard/schedule/add`, `/dashboard/account`, and the four `/admin/*` surfaces.
- Landing-page craft-showcase polish — the landing is also a portfolio artifact for prospective clients. The voice register there is "showcase" (not coach). VOICE.md has the guardrails.
- Holistic typography + hierarchy + spacing pass; not incremental edits.

## Critical infrastructure fact discovered mid-sprint

**Inngest is pointed at the feature-branch Vercel preview**, not production. This means real booking emails to real user inboxes have been going through Sprint 1 code since the first preview deploy. The "(Preview)" suffix in the FROM name is the tell — `RESEND_FROM_NAME` env var on Preview is set to "My Workout Scheduler (Preview)". Confirmed by the user receiving a "Got you in — BODYPUMP HEAVY on Wednesday" email this week (new copy, not pre-sprint). This is not a task 6 item but the next session needs to know it exists — PR #122 merge implications are different than we thought, and post-Sprint-1 cleanup should redirect Inngest to production.

## Guardrails that keep tripping

- **Zero first-person "I / I'm / I'll"** in coach-voice surfaces. Re-check any new copy.
- **Never "Asheville YMCA"** as org shorthand. Product supports "YMCA of Western North Carolina" (WNC); Asheville is one branch.
- **Section-name mapping is authoritative.** Confirmed = "Before you go". Working on it = "What's happening". Need your help = "What to do". FYI = optional "Worth knowing".
- **Never "reply to this email"** in any template. `noreply@beerock.com` is load-bearing; support routes to `help@beerock.com`.
- **Never hardcode "26 hours before class"** in user copy (only in backend/test fixtures). It's a per-class value (`booking_window_hours` column). See `feedback_no_hardcoded_booking_window.md`.
- **Admin-only gate pattern** — all four `/admin/*` routes use layout redirect + `assertAdmin()` in server actions. Don't collapse to one layer.

## How to resume

1. Read this file + `docs/VOICE.md` + `CLAUDE.md`.
2. `git -C ../my-workout-scheduler-worktrees/sprint-1-ux-polish status` should show a clean tree on `feature/sprint-1-ux-polish`.
3. Preview URL is stable: `https://my-workout-scheduler-git-feature-s-3feb2b-brock-busbys-projects.vercel.app/<path>`. Admin account required for `/admin/*` surfaces.
4. Pick up task 6. Owner expects a design pass, not just copy edits. Invoke `/frontend-design` if available. Offer variants for non-trivial choices (same pattern as tasks 3 and 4 — synthetic `/admin/*-preview` pages let the owner eyeball options before code ships).
5. ★ owner review gate at each meaningful chunk.
