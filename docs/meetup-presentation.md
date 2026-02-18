# My Workout Scheduler - Lenny's Newsletter Meetup Presentation

**Brock Busby - 2026**
**Format:** 10 min presentation + 5 min Q&A
**Tool:** Gamma.app -- paste slides below, prompt: *"Dark background (#0f0f0f or similar dark navy/charcoal). Primary accent: electric blue (#1a6fff). Secondary accent: deep orange (#ff5722). Typography: Sora for headings, DM Sans for body. Card-based layouts with subtle shadows. Bold, confident, energetic -- inspired by Peloton and ClassPass. Status colors: green for confirmed, amber for pending/retrying, red for failed. Keep tables and bullets as-is. Minimal text per slide."*

---

## Slide 1 -- Title

**My Workout Scheduler**
*Automating gym class reservations so I don't have to babysit my phone*

Brock Busby - Lenny's Newsletter Meetup - 2026

---

## Slide 2 -- The Problem

**Every Sunday at 2:15 PM, my phone owned me.**

- My gym opens reservations exactly 26 hours before class
- Popular classes (Monday 4:15 PM) fill in under a minute
- I was stopping hikes, stepping away from breweries, watching the clock -- every single week
- Miss the window? No class. No exceptions.

> "I shouldn't have to be glued to my phone for this."

---

## Slide 3 -- The Goal & KPI

**Automate it. Free. For a handful of friends.**

| Goal | Target |
|------|--------|
| Book a class | **< 60 seconds** after window opens |
| Infrastructure cost | **$0/month** |
| Users | 5 |
| Reliability | Book it or know exactly why it failed |

---

## Slide 4 -- The Plot Twist

**We hit our KPI. The class still fills up.**

- **v1:** Automation books in ~90-95 seconds. Works great.
- **New Year's:** Resolution crowd hits. Monday 4:15 PM starts filling in under 60 seconds.
- **v2:** Optimized with Claude down to **under 60 seconds**. Still hitting it.
- **Reality:** The class fills anyway -- people are mashing the app the instant it opens.

> I solved the technical problem and hit a market problem. That's a real product story.

*Next step: Pick a less popular class? Or optimize further?*

---

## Slide 5 -- Stack & Architecture

**All free tier. Event-driven. Zero servers to manage.**

```
User schedules a class
       |
  Inngest schedules event for exact booking window time
       |
  GitHub Actions spins up -> Puppeteer logs in & books
       |
  Result written to Supabase -> Email via Resend
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

## Slide 6 -- Automation: Harder Than It Looks

**"Just click the button" -- famous last words.**

16 failure scenarios. Every one a real production bug.

| Scenario | Response |
|----------|----------|
| Booking window not open yet | Fast retry: 9 x 5s polling loop |
| Class full | Retry every 15 min until class starts |
| Class cancelled | Stop immediately, notify user |
| Already booked | Idempotency check -- skip silently |
| Class name typo | Fuzzy matching (Levenshtein distance) |
| Button off-screen | scrollIntoView before clicking |

**Closing the loop -- email notifications:**
- Booking Confirmed / Waitlisted / Class Full Retrying / Retries Exhausted / Action Required
- One toggle controls all retry emails
- "Retries Exhausted" added in v2.30 -- silence after "Retrying" is bad UX

---

## Slide 7 -- The Design Story

**Production-quality UI. Solo builder. No design background.**

- 19 reusable components built with Claude: Button, Card, Badge, Modal, Toast, Skeleton, StatCard...
- Full design system: color tokens, typography (Sora + DM Sans), spacing scale, shadows
- Inspired by Peloton, ClassPass, Strava -- not "generic AI app"
- `/frontend-design` skill generates distinctive UI -- avoids generic AI aesthetics

> The trick: treat Claude like a senior designer. Give it reference apps, principles, and constraints -- not just "make it look good."

---

## Slide 8 -- Claude Code Power User Tips

**The setup that made this possible as a solo builder**

**Two-tier CLAUDE.md -- Claude's persistent memory**
- Global (`~/.claude/CLAUDE.md`) -- platform, git conventions, global skills. Applies to every project.
- Per-project (`CLAUDE.md`) -- stack, patterns, gotchas, "always do / never do" rules
- Reading order defined: PRD -> BACKLOG -> specialized docs

**Worktree session safety**
- Every session: Claude checks branch + worktree, alerts if on main, stops work
- Auto-creates worktrees with full setup (npm install, .env copy, port conflict warning)

**Auto-documentation updates**
- Change type maps to exact docs that update -- coded as a trigger table in CLAUDE.md
- New feature complete -> PRD version history + BACKLOG updated automatically

**Skills -- reusable prompt pipelines**
- `/ship` -> audit -> fix -> doc-sync -> commit -> push -> PR
- `/claude-md-improver` -> end-of-session CLAUDE.md audit and cleanup
- `/frontend-design` -> production-grade UI components
- `/create-migration` -> scaffolds numbered Supabase migrations

**Hooks -- guardrails that run automatically**
- Block `.env` edits (PreToolUse) -- can't accidentally commit credentials
- Auto-typecheck after every file save (PostToolUse)

---

## Slide 9 -- Q&A

**Links & Resources**

- App: `my-workout-scheduler.vercel.app`
- Claude Code: `docs.anthropic.com/claude-code`
- Inngest: `inngest.com`

*[brockbusby@gmail.com / https://www.linkedin.com/in/brockbusby/]*
