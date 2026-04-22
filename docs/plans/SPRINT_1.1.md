# Sprint 1.1 — Frontend-Design Review Polish

**Last Updated:** April 22, 2026

**Status:** Planned
**Parent:** Sprint 1 (PR #122, branch `feature/sprint-1-ux-polish`)
**Source plan:** `~/.claude/plans/frolicking-wishing-lighthouse.md` (Sprint 1 task 6)

---

## Context

Sprint 1 tasks 1–6 shipped. Task 6 did the landing variant work, the three explicit carryovers (Branch field Combobox, helper-text trim, shadow backlog), a findings triage across user-facing pages, and the footer redesign.

What task 6 **did not** do: invoke the `/frontend-design` skill for the holistic review pass the original plan scoped. Throughout task 6 the owner asked for the skill's input on individual decisions (headline phrasing, footer layout, feature-card framing) and got good feedback, but the plan's actual task 6 deliverable — a written review across email voice, landing craft, onboarding clarity, form microcopy, visual/brand consistency — never happened as one coherent pass.

Sprint 1.1 is that review pass, scoped tight so it doesn't block Sprint 1 from merging.

**Sprint 1 PR #122 can and should merge before Sprint 1.1 begins.** Sprint 1.1 opens a fresh branch off the merged `main`.

---

## Scope

**In scope** — four priority-ordered chunks. Each invokes `/frontend-design` with explicit context, receives a written review, and the owner triages findings into "fix now" vs "BACKLOG" at a ★ review gate.

### P0 — Email voice coherence review (all 17 templates)

The owner explicitly called this out as the highest-priority deferred item. Task 2 rewrote 17 templates to match VOICE.md, but the skill has never reviewed them as a *set* — checking tier consistency, section-name coherence, the showcase→coach handoff on the waitlist-confirmation email, FROM/reply policy adherence, and any drift between templates.

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
