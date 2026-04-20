# Sprint 1 — Continuation Prompt (post-/clear)

**For the next session after /clear.** Paste this prompt into the new session to resume Sprint 1 without losing state.

## Where we are

**Sprint 1 of 3** — UX + Product Polish. Working on feature branch `feature/sprint-1-ux-polish` via worktree at `../my-workout-scheduler-worktrees/sprint-1-ux-polish`. PR **#122** open against `main`.

**Completed chunks (merge-ready, committed, pushed):**

1. **Waitlist flow end-to-end.** Public `/signup` landing → `waitlist_signups` table (migration 016) → admin review at `/admin/waitlist` → branded invite email via `supabase.auth.admin.generateLink({type:'invite'})` + Resend send path → waitlist-confirmation email. `InviteResult` discriminated union so Next.js 16 doesn't swallow server-action errors.
2. **Voice consolidation (docs/VOICE.md) + all 15 email templates rewritten** to coach/showcase register with four-tier calibration (Confirmed / Working on it / Need your help / FYI). Zero first-person pronouns. Section-name pattern standardized per tier (Before you go / What's happening / What to do / Worth knowing). FROM/reply policy codified: `noreply@beerock.com` load-bearing, `help@beerock.com` for actual support.
3. **Admin routes consolidated.** `/dashboard/admin/waitlist` → `/admin/waitlist`; `/prototype/email-preview` → `/admin/email-preview`. Same defense-in-depth gate (layout redirect + `assertAdmin()`). CLAUDE.md + source comments swept.
4. **Assorted UI copy edits:**
   - `GetStartedBanner` empty state: "Add one class. Skip every 4:59 AM alarm." (outcome-first, concrete benefit)
   - `NextClassCard` pending state reverted to "until class" (task 3 will design the real living-status label on booking-open time)
   - Account page: "Some alerts we always send..." Alert moved to TOP of the Emails card
   - All templates follow the tier section-name pattern; "reply to this email" removed; `help@beerock.com` surfaced

## What's left in Sprint 1

**Task 3 — Onboarding forward-motion + failure surface.** Design the `NextClassCard` pending state properly (living status, countdown to booking-open not class-start), plus the failure-surface on the dashboard for users who have a hit-a-snag or need-your-help case today. Owner wants a variant review.

**Task 4 — RecurringClassForm polish + inline preview.** The add-class form should show, before save, exactly when the first auto-book will fire (date + time in gym timezone). Anticipatory coach voice ("first booking fires Sunday at 2:15 PM — watching the list until then"). Owner to review variants.

**Task 5 — A11y + hex + mobile 320px.** Sweep: replace arbitrary hex values with design tokens, audit aria labels on the interactive surfaces touched in tasks 1–4, verify 320px mobile layout on landing + dashboard + account. No design system additions without permission.

**Task 6 — /frontend-design review + landing polish.** Run the `/frontend-design` skill with fresh eyes on the landing page (post-waitlist-flow state), waitlist form, and `/admin/*` surfaces. Owner wants a holistic review of visual hierarchy + typography tuning before sprint ends. FROM-address open question was deferred — advisor recommendation was **keep `noreply@beerock.com`, point to `help@beerock.com`** — already shipped; confirm no further ask.

## How to resume

1. Read this file, `docs/VOICE.md`, and `CLAUDE.md` first.
2. Confirm the worktree environment: `git -C ../my-workout-scheduler-worktrees/sprint-1-ux-polish status` should show a clean tree on `feature/sprint-1-ux-polish`.
3. Pick up with **task 3** (onboarding forward-motion + failure surface). Owner expects variant options, not a finished design.
4. Use the preview URL (latest Vercel feature-branch deploy) for any visual walk. Always name the URL when you hand it back.
5. ★ owner review gate at the end of every task chunk — do not proceed without explicit "go".

## Guardrails that keep tripping

- **Zero first-person "I" / "I'm" / "I'll"** in coach-voice surfaces. Re-check any new copy against VOICE.md.
- **Never use "Asheville YMCA" as org shorthand.** The product supports "YMCA of Western North Carolina" (WNC); Asheville is one branch.
- **Tier → section-name mapping is authoritative.** Confirmed = "Before you go". Working on it = "What's happening". Need your help = "What to do". FYI = optional "Worth knowing" or none.
- **Never re-add "reply to this email"** in any template. `noreply@` is load-bearing; route support to `help@beerock.com`.
- **Admin-only gate pattern:** both `/admin/*` routes use layout.tsx redirect + `assertAdmin()` in server actions. Don't collapse to one layer.

## Open owner decisions

- Task 6 may add a landing-page hero polish pass — owner has not decided scope.
- No decision yet on whether Sprint 2 resumes immediately after Sprint 1 PR merge or waits for external review.
