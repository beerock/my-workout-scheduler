# Sprint 1.1 — Frontend-Design Review Polish

**Last Updated:** April 23, 2026

**Status:** Planned
**Parent:** Sprint 1 (merged via PR #122, hotfixes via PR #123 + #124 + #125)
**Source plan:** `~/.claude/plans/frolicking-wishing-lighthouse.md` (Sprint 1 task 6)

---

## Resumption prompt (copy-paste after `/clear`)

Paste the single block between the marker lines below into a freshly `/clear`'d session. Everything between `▶▶▶ PROMPT START ▶▶▶` and `◀◀◀ PROMPT END ◀◀◀` is the prompt body — do not include the marker lines themselves.

```
▶▶▶ PROMPT START ▶▶▶

Start Sprint 1.1 — Frontend-Design Review Polish.

Read these first, in this order:
1. docs/plans/SPRINT_1.1.md (this plan — authoritative scope)
2. docs/VOICE.md (voice registers + tier taxonomy + section-name mapping)
3. CLAUDE.md (Critical Gotchas, especially: Inngest routing, VOICE.md guardrails, admin-preview pattern, hydration mount-flag pattern)

Secondary references (read only if SPRINT_1.1.md doesn't answer a scoping question):
- ~/.claude/plans/frolicking-wishing-lighthouse.md — original 3-sprint audit. Sprint 1 task 6 (line 230 onward) scoped a holistic /frontend-design review that was NOT executed — Sprint 1.1 is that deferred review pass.
- docs/plans/SPRINT_1.5.md — parallel follow-up sprint (credential testing, realtime retry, NextClassCard discriminated-union refactor, ActionItemsCard edge-case debugging). If you notice work that belongs there, punt don't absorb.

Sprint 1 shipped and is live in production at https://myworkout.beerock.com. Summary of what exists for Sprint 1.1 to review:
- docs/VOICE.md (two registers + four coach tiers + section-name map + FROM/reply policy)
- 17 email templates rewritten to match VOICE.md; preview at /admin/email-preview
- Waitlist flow (/signup + /admin/waitlist + branded invite email)
- Dashboard failure surface (ActionItemsCard + NextClassCard unified pending states)
- RecurringClassForm with inline FirstBookingPreview + section headers
- Landing page redesign, footer rewrite, eyebrow badge
- a11y + 320px mobile sweep, Combobox searchable={false} mode, TimeInput mobile fit
- Admin preview surfaces: /admin/email-preview, /admin/dashboard-preview, /admin/form-preview, /admin/landing-preview, /admin/waitlist
- Three post-merge hotfix PRs (#123, #124, #125) addressing production feedback

What Sprint 1 (specifically task 6) did NOT do: invoke /frontend-design for a coherent written review across email voice, modal a11y, landing craft motion polish, and form→confirmation transition. THAT is the entire point of Sprint 1.1, and P0 (email voice coherence) is the first chunk.

Then:
- Confirm git state: `git status` should show main at the latest merged commit (Sprint 1 + hotfix PRs #123, #124, #125 all merged). If on a worktree, confirm you're not on main.
- Create a worktree for this sprint: `git worktree add -b feature/sprint-1.1-design-review ../my-workout-scheduler-worktrees/sprint-1.1 main` then `npm install --prefix ../my-workout-scheduler-worktrees/sprint-1.1` and copy `.env.local` over.
- Run the pre-sprint baseline: `npm run test:booking-dry-run` as the admin account (brockbusby@gmail.com). Save the output for comparison at sprint close.

Work plan (priority-ordered, ★ owner review gate at each chunk close):

P0 — Email voice coherence review across all 17 templates.
  Invoke the `/frontend-design` skill with: docs/VOICE.md, the deployed /admin/email-preview URL, and the 17 template file paths under lib/email/templates/. Ask for a written review covering tier consistency per template, section-name coherence, the showcase→coach handoff on waitlist-confirmation, FROM/reply policy adherence, and any drift between templates. Present findings; owner triages "fix now" vs BACKLOG at ★ gate. Estimate 2–3h.

P1 — Modal a11y audit (4 modals: BookNowDialog, skip-clear modal in RecurringClassForm, deactivated-class modal in RecurringClassForm, delete-confirmation modal in ScheduleList). Audit each for role="dialog", aria-modal="true", focus trap, aria-labelledby, escape key closes, focus returns to trigger on close. Fix inline. Estimate 1–1.5h.

P2 — Landing craft-polish (2-hour HARD CAP). Invoke /frontend-design on the deployed landing + waitlist pages. Review covers first-impression calibration, micro-interactions, entrance animation pacing, feature-card hover states, transition choreography. Owner picks top N fixes within the budget. Estimate 2h cap.

P3 — Form → confirmation transition choreography on the waitlist. Current transition is an abrupt state swap; apply a choreographed transition (skill recommends). Keep it tasteful — showcase voice, restrained. Estimate 30–60min.

Workflow rules (same as Sprint 1):
- Follow the ★ owner review gate at each P-chunk close. Do NOT proceed to the next chunk without explicit owner greenlight.
- Use the admin-preview-surface pattern (/admin/*-preview) for non-trivial variant decisions.
- Walk the dev server at 320px for every UI change. Walk /admin/email-preview for every email edit.
- Commit in small themed chunks with conventional-commit prefixes. Push after each verified chunk.
- Inngest auto-syncs to the most recent Vercel deploy — feature-branch commits WILL redirect real users' booking-email FROM routing until merge. Known tech debt (BACKLOG: "Separate Inngest Apps per Environment"), not blocking but visible.

Do NOT:
- Start P1 before owner ★ on P0.
- Change VOICE.md rules without explicit owner approval (the guide is authoritative — new copy conforms to it, not the other way around).
- Touch booking-automation logic, Inngest routing, or any Sprint 2 items (see SPRINT_1.1.md "Out of scope").
- Skip the pre-sprint booking-dry-run baseline.

Pause at P0 ★ review gate and report findings before proceeding. Begin by reading the three docs above.

◀◀◀ PROMPT END ◀◀◀
```

---

## Context

Sprint 1 tasks 1–6 shipped and merged (PR #122 + hotfix PRs #123/#124/#125). Sprint 1 is live in production at https://myworkout.beerock.com.

**What Sprint 1 delivered** (Sprint 1.1 reviews this work, doesn't redesign it):
- `docs/VOICE.md` — two voice registers (coach + showcase), four coach-voice tiers, section-name pattern, canonical YMCA WNC naming, FROM/reply policy
- 17 email templates rewritten to match VOICE.md; preview at `/admin/email-preview`
- Waitlist flow: public `/signup` + `waitlist_signups` table + `/admin/waitlist` review + branded invite email
- Dashboard failure surface: `ActionItemsCard` + `NextClassCard` with unified pending states (pre-window / within-window / actively-retrying)
- `RecurringClassForm` with inline `FirstBookingPreview`, hidden timezone field, section headers
- Landing page redesign (headline, feature cards, CTAs, eyebrow badge); footer rewrite
- a11y + hex-token + 320px mobile sweep; `Combobox` `searchable={false}` mode; `TimeInput` mobile fit
- Admin preview surfaces: `/admin/email-preview`, `/admin/dashboard-preview`, `/admin/form-preview`, `/admin/landing-preview`, `/admin/waitlist`
- Post-merge hotfix PRs #123 (5 production issues), #124 (NextClassCard state unification), #125 (React #418 hydration fixes + /review-pr follow-ups)

**What task 6 did NOT do, and why Sprint 1.1 exists:** the original plan (`~/.claude/plans/frolicking-wishing-lighthouse.md`, Sprint 1 task 6 at line 230 onward) scoped a single coherent `/frontend-design` review pass covering email voice coherence, modal a11y, landing craft motion polish, and form→confirmation transition. During task 6 the owner asked for the skill's input on individual decisions (headline phrasing, footer layout, feature-card framing) and got good feedback — but the holistic written review across all four axes never happened as one pass.

**Sprint 1.1 is that deferred review, priority-ordered into four P-chunks.** P0 (email voice coherence) is the first pickup of task 6's deferred work.

**Related:** `docs/plans/SPRINT_1.5.md` is an independent parallel follow-up covering credential testing, realtime retry status, NextClassCard discriminated-union refactor, and ActionItemsCard edge-case debugging. If Sprint 1.1 work surfaces items from Sprint 1.5's scope, punt rather than absorb.

---

## Scope

**In scope** — four priority-ordered chunks. Each invokes `/frontend-design` with explicit context, receives a written review, and the owner triages findings into "fix now" vs "BACKLOG" at a ★ review gate.

### P0 — Email voice coherence review (all 17 templates)

**This is the first pickup of task 6's deferred `/frontend-design` review pass.** Task 2 rewrote 17 templates to match VOICE.md, but the skill has never reviewed them as a *set* — checking tier consistency, section-name coherence, the showcase→coach handoff on the waitlist-confirmation email, FROM/reply policy adherence, and any drift between templates. The owner explicitly called this out as the highest-priority deferred item at Sprint 1 wrap-up.

**Deliverables:**
- Invoke `/frontend-design` with: `docs/VOICE.md`, `/admin/email-preview` URL, the 17 template file paths under `lib/email/templates/`, and the 4 coach-voice tiers + section-name mapping from VOICE.md.
- Receive written review covering:
  - Voice tier consistency per template (is each template in the tier VOICE.md assigns it?)
  - Section-name coherence (are "Before you go" / "What's happening" / "What to do" / "Worth knowing" used as VOICE.md maps them?)
  - Showcase→coach handoff on the waitlist-confirmation email (does the register transition land?)
  - FROM/reply policy adherence (no "reply to this email", help@ surfaced correctly)
  - Drift between templates (same feeling worded differently? same phrase doing different work?)
- Owner triages findings; high-priority fixes land in commits; low-priority to BACKLOG.

**Estimate:** 2–3 hours depending on volume of findings.

**Acceptance:** Every one of the 17 templates passes the VOICE.md tier+section matrix, or the exception is documented with reasoning.

---

### P1 — Modal a11y audit

The original plan flagged this as a specific finding (line 224) that was deferred into task 6's review pass. Four modals in the product to audit:

- `BookNowDialog` (`components/BookNowDialog.tsx`)
- Skip-clear confirmation modal (inside `RecurringClassForm.tsx`)
- Deactivated-class confirmation modal (inside `RecurringClassForm.tsx`)
- Delete confirmation modal (inside `ScheduleList.tsx`)

**Deliverables:**
- Audit each modal for:
  - Explicit `role="dialog"` + `aria-modal="true"` on the modal root
  - Focus trap (tab cycles within modal, no bleed to page behind)
  - `aria-labelledby` pointing at the modal title
  - Escape key closes
  - Focus returns to the triggering element on close
- Fix inline (most fixes are 1–3 line additions).
- Verify with keyboard-only nav + a screen reader (VoiceOver on macOS, NVDA on Windows).

**Estimate:** 1–1.5 hours total (mostly audit, fixes are small).

**Acceptance:** All four modals satisfy the checklist above; keyboard-only flow works; screen reader announces modal title on open.

---

### P2 — Landing craft-polish (2-hour hard cap)

Plan line 234 specifies a "2-hour craft-polish budget for landing + waitlist specifically." That budget was intended for the highest-impact motion/interaction polish surfaced by the skill — not shipped in Sprint 1 task 6 because the copy + layout work consumed the available time.

**Deliverables:**
- Invoke `/frontend-design` with the deployed landing URL + waitlist page + VOICE.md.
- Receive written review covering:
  - First-impression calibration (badge → headline → subtitle → CTA rhythm)
  - Micro-interactions (hover states on feature cards + CTAs, input focus choreography on waitlist form)
  - Entrance animation pacing (current `animate-fade-in-up` with staggered delays — is the timing right?)
  - Feature-card hover state (currently a single translate-y lift — worth more?)
  - Transition state choreography: form → "You're on the waitlist" confirmation state (currently abrupt)
- Owner picks top N findings within the 2-hour budget.
- Implement; anything else → BACKLOG.

**Estimate:** 2 hours hard cap. If the review surfaces more than fits, stop at 2 hours and BACKLOG the rest.

**Acceptance:** Landing feels intentional as a portfolio artifact, not just functional. Owner ★ review approves the polish pass.

---

### P3 — Form → confirmation transition choreography (waitlist)

A smaller craft moment that fits inside or immediately after the P2 budget. The current `/signup` WaitlistForm transitions from form → "You're on the waitlist" confirmation state with an abrupt swap — the plan flagged this as a transition worth choreographing.

**Deliverables:**
- Review current transition (likely just a state swap with conditional rendering).
- Apply a choreographed transition (fade, slide, scale, or layered — skill recommends).
- Keep it tasteful — this is showcase voice, restrained, not hype-y.

**Estimate:** 30–60 min.

**Acceptance:** Submitting the waitlist form transitions smoothly to the confirmation state. Feels deliberate, not broken.

---

## Deferred / lower-priority (graduate to BACKLOG at sprint close)

These items from the task 6 deferral list are lower-leverage given the work already done in Sprint 1. Move to `docs/BACKLOG.md` at sprint close unless the skill review surfaces something urgent:

- **Hero scroll orchestration** beyond existing `animate-fade-in-up` delays — only relevant if the landing grows beyond a single viewport of content.
- **Typography rhythm holistic review** — current rhythm is acceptable; only revisit if a finding in P2 surfaces a specific drift.
- **Onboarding-confirmation flow review** (signup → verify-email → first dashboard view) — implicitly addressed by the individual component work in Sprint 1. Only revisit if user feedback surfaces confusion.
- **Visual/brand consistency pass across all surfaces** — broad scope, no specific finding yet. Can be its own small sprint if needed later.

---

## Out of scope

- Anything in the Sprint 2 list (pre-existing plan line 238–244).
- Sprint 1.5 items (credential testing, dashboard realtime retry — separate follow-up per plan line 236).
- Any non-frontend-design work (infrastructure, database, Inngest redirect — those belong in their own tracks).

---

## Workflow rules

Same as Sprint 1 (see `~/.claude/plans/frolicking-wishing-lighthouse.md` workflow rules section):

- **Pre-sprint baseline:** `npm run test:booking-dry-run` as admin, save output before starting.
- **★ review gates** at each P-chunk close. Skill review → owner triage → implementation → owner ★ → next chunk.
- **Admin preview pattern:** use `/admin/*-preview` surfaces for non-trivial variant decisions (same pattern as Sprint 1 tasks 3-4).
- **Commit in small themed chunks**, push to the feature branch when each is verified.
- **Walk `/admin/email-preview`** for every email edit.
- **Walk the dev server at 320px** for every UI change.
- **Update docs** per CLAUDE.md "Documentation Update Triggers" table at sprint close.

---

## Handoff / continuation

**Session start:**
1. Read this file + `docs/VOICE.md` + `CLAUDE.md`.
2. Check git state: if Sprint 1 PR #122 has merged, branch off `main` with `feature/sprint-1.1-design-review`. If not yet merged, resume on `feature/sprint-1-ux-polish` and open Sprint 1.1 commits there.
3. Pre-sprint baseline: `npm run test:booking-dry-run` as admin.
4. Pick up P0 (email voice coherence) first — highest-leverage.

**Per-chunk process:**
1. Invoke `/frontend-design` with the chunk's specific context.
2. Present the written review to the owner; triage at ★ gate.
3. Implement approved fixes; log deferred findings to BACKLOG.
4. Commit with a descriptive message per chunk.
5. Move to next chunk only after owner ★.

**Sprint close:**
1. All four P-chunks closed or explicitly paused.
2. Doc updates per CLAUDE.md triggers + "Last Updated" stamps.
3. PR update (same PR #122 if unmerged, or new PR against main if Sprint 1 already merged).
4. Final owner ★ walk before merge.

---

## Critical context inherited from Sprint 1

- **Inngest routes to the most recent Vercel deployment.** The moment Sprint 1.1 pushes its first commit to a feature branch, Inngest auto-swings away from production (where it landed after the Sprint 1 merge) and starts routing events to the preview deploy — meaning real users receive booking emails with `(Preview)` in the FROM name for the entire duration of the sprint. This is a known tech-debt item (see `docs/BACKLOG.md` → "Separate Inngest Apps per Environment") but isn't in Sprint 1.1 scope. Be aware: any P0 email copy work shipped to preview will reach real inboxes until Sprint 1.1 merges.
- **VOICE.md is authoritative** — two registers (coach + showcase), four coach tiers, section-name mapping, naming rules ("YMCA of Western NC" / "YMCA WNC", never "Asheville YMCA" as org name), FROM/reply policy.
- **Admin-only preview surfaces** at `/admin/email-preview`, `/admin/dashboard-preview`, `/admin/form-preview`, `/admin/landing-preview`, `/admin/waitlist`. All use the layout + `assertAdmin()` defense-in-depth pattern.
- **Preview URL** for Sprint 1 branch: `https://my-workout-scheduler-git-feature-s-3feb2b-brock-busbys-projects.vercel.app/<path>`. New branch after merge will get a new preview URL.
- **Test account:** always admin (brockbusby@gmail.com, uid `a02ef692-1933-46b0-a77c-7258a577a5b5`). Never use other users' credentials.
