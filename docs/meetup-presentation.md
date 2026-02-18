# My Workout Scheduler — Lenny's Newsletter Meetup Presentation

**Brock Busby · 2026**
**Format:** 10 min presentation + 5 min Q&A
**Tool:** Gamma.app — paste full content, prompt: *"Dark background (#0f0f0f or similar dark navy/charcoal). Primary accent: electric blue (#1a6fff). Secondary accent: deep orange (#ff5722). Typography: Sora for headings, DM Sans for body. Card-based layouts with subtle shadows. Bold, confident, energetic — inspired by Peloton and ClassPass. Status colors: green for confirmed, amber for pending/retrying, red for failed. Keep tables and bullets as-is. Minimal text per slide."*

---

## Slide 1 — Title

**My Workout Scheduler**
*Automating gym class reservations so I don't have to babysit my phone*

Brock Busby · Lenny's Newsletter Meetup · 2026

---

## Slide 2 — The Problem

**Every Sunday at 2:15 PM, my phone owned me.**

- My gym opens reservations exactly 26 hours before class
- Popular classes (Monday 4:15 PM) fill in under a minute
- I was stopping hikes, stepping away from breweries, watching the clock — every single week
- Miss the window? No class. No exceptions.

> "I shouldn't have to be glued to my phone for this."

---

## Slide 3 — The Goal & KPI

**Automate it. Free. For a handful of friends.**

| Goal | Target |
|------|--------|
| Book a class | **< 60 seconds** after window opens |
| Infrastructure cost | **$0/month** |
| Users | 5 |
| Reliability | Book it or know exactly why it failed |

---

## Slide 4 — [DEMO]

**Live walkthrough**

- Dashboard — next class countdown, booking status at a glance
- Schedule management — adding a recurring class, skip next occurrence, global pause
- Booking history — Confirmed / Waitlisted / Retrying / Failed with filter pills
- **Show a real notification email** — the full loop: booked while you're not watching

> "I'm at a brewery Sunday afternoon. This email lands. I don't have to think about it."

---

## Slide 5 — The Plot Twist

**We hit our KPI. The class still fills up.**

- **v1:** Automation books in ~90–95 seconds. Works great.
- **New Year's:** Resolution crowd hits. Monday 4:15 PM starts filling in under 60 seconds.
- **v2:** Optimized with Claude down to **under 60 seconds**. Still hitting it.
- **Reality:** The class fills anyway — people are mashing the app the instant it opens.

> I solved the technical problem and hit a market problem. That's a real product story.

*Next step: Pick a less popular class? Or optimize further?*

---

## Slide 6 — Stack & Architecture

**All free tier. Event-driven. Zero servers to manage.**

```
User schedules a class
       ↓
  Inngest schedules event for exact booking window time
       ↓
  GitHub Actions spins up → Puppeteer logs in & books
       ↓
  Result written to Supabase → Email via Resend
```

| Layer | Tool | Why |
|-------|------|-----|
| Frontend + API | Next.js + Vercel | Full-stack, free hosting |
| Database + Auth | Supabase | Postgres + RLS, free tier |
| Scheduling | Inngest | Event-driven, precise timing |
| Automation | Puppeteer + GitHub Actions | Headless browser, free CI |
| Email | Resend | Transactional email, free tier |

**$0/month. Every service on its free tier.**

---

## Slide 7 — Harder Than It Looks

**"Just click the button" — famous last words.**

Puppeteer has to handle 16 failure scenarios:

| Scenario | Response |
|----------|----------|
| Booking window not open yet | Fast retry: 9 × 5s polling loop |
| Class full | Retry every 15 min until class starts |
| Class cancelled | Stop immediately, notify user |
| Not reservable | Permanent failure, no retry |
| Already booked | Idempotency check — skip silently |
| Class name typo in my database | Fuzzy matching (Levenshtein distance) |
| Button rendered off-screen | `scrollIntoView` before clicking |
| Multiple users booking simultaneously | Parallel execution, independent sessions |

> Every one of these was a real bug I hit in production.

---

## Slide 8 — Closing the Loop: Email Notifications

**You set it and forget it. The app tells you what happened.**

Notifications sent automatically:
- ✅ **Booking Confirmed** — class is booked, you're good
- ⏳ **Waitlisted** — on the list, fingers crossed
- 🔄 **Class Full — Retrying** — didn't get it yet, retrying every 15 min
- ❌ **Retries Exhausted** — class stayed full until it started, sorry
- ⚠️ **Action Required** — something needs your attention (credentials expired, etc.)

Each email respects user preferences — one toggle controls retry emails.

> The "Retries Exhausted" email was v2.30 — users were getting "Retrying" and then silence. That's a bad UX. Closure matters.

---

## Slide 9 — The Design Story

**Production-quality UI. Solo builder. No design background.**

- 19 reusable components built with Claude: Button, Card, Badge, Modal, Toast, Skeleton, StatCard...
- Full design system: color tokens, typography (Sora + DM Sans), spacing scale, shadows
- Inspired by Peloton, ClassPass, Strava — not "generic AI app"
- DESIGN_SYSTEM.md + COMPONENT_LIBRARY.md kept in sync as living docs

> The trick: treat Claude like a senior designer. Give it reference apps, principles, and constraints — not just "make it look good."

---

## Slide 10 — Claude Code Power User Tips

**The setup that made this possible as a solo builder**

**Two-tier CLAUDE.md — Claude's persistent memory**
- **Global** (`~/.claude/CLAUDE.md`) — platform, environment, git conventions, global skills. Applies to every project.
- **Per-project** (`CLAUDE.md`) — stack, patterns, gotchas, "always do / never do" rules
- Reading order defined: PRD → BACKLOG → specialized docs. Claude reads before touching anything.

**Worktree session safety — no more accidental commits to main**
- Every session starts: Claude checks branch + worktree, alerts if on main, stops work
- Auto-creates worktrees and branches with full setup (npm install, .env copy, port conflict warning)
- Mandatory cleanup after merge — no stale branches left behind

**Auto-documentation updates**
- Change type → exact docs that update. Coded into CLAUDE.md as a trigger table.
- New component → DESIGN_SYSTEM.md + COMPONENT_LIBRARY.md updated automatically
- Feature complete → PRD version history + BACKLOG entry moved to completed

**Skills — reusable prompt pipelines**
- `/ship` → audit → fix → doc-sync → commit → push → PR. One command.
- `/create-migration` → scaffolds numbered Supabase migrations
- `/claude-md-improver` → end-of-session: audits CLAUDE.md, fills gaps, prunes stale entries
- `/frontend-design` → generates distinctive, production-grade UI — avoids generic AI aesthetics

**Hooks — guardrails that run automatically**
- Block `.env` edits (PreToolUse) — can't accidentally commit credentials
- Auto-typecheck after every file save (PostToolUse) — catch errors immediately

---

## Slide 11 — Lessons Learned

**What I wish I knew at the start**

1. **Write CLAUDE.md on day one** — not after the codebase gets complex. It compounds.
2. **"Never do" rules matter as much as "always do"** — Claude needs constraints, not just goals
3. **Build your component library early** — pay the cost once, not on every feature
4. **Dry-run before real automation** — `npm run test:booking-dry-run` saved me multiple times
5. **Free tier has real limits** — GitHub Actions cron can be delayed; event-driven precision matters
6. **The KPI was right, the market was wrong** — measure what you can control

---

## Slide 12 — Q&A

**Links & Resources**

- App: `my-workout-scheduler.vercel.app`
- Claude Code: `docs.anthropic.com/claude-code`
- Inngest: `inngest.com`
- Gamma (for decks like this): `gamma.app`

*[your contact / LinkedIn / Twitter here]*

---

## Pacing Notes

| Slide | Time |
|-------|------|
| 1 Title | 15 sec |
| 2 Problem | 1 min |
| 3 Goal & KPI | 30 sec |
| 4 Demo | 2–3 min |
| 5 Plot Twist | 1 min |
| 6 Stack | 1.5 min |
| 7 Harder Than It Looks | 1 min |
| 8 Email Notifications | 30 sec |
| 9 Design Story | 1 min |
| 10 Power User Tips | 1–2 min |
| 11 Lessons Learned | 30 sec |
| 12 Q&A | 5 min |

**Flex points:** Slides 10 and 11 can be compressed or flow into Q&A if running long. Slide 4 (demo) can be shortened if needed.
