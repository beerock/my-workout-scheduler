# CLAUDE.md

## Project Overview

**My Workout Scheduler** automates YMCA class reservations using Puppeteer to book classes the instant registration opens (26 hours before class time).

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase, Inngest, Puppeteer, Resend

**MVP Scope:** 5 users, 2-5 classes per user, 100% free tier services

**Current Version:** v2.27 - Email Notification System (see PRD for full version history)

---

## Key Documentation

| Doc | Purpose | When to Use |
|-----|---------|-------------|
| [PRD](docs/My%20Workout%20Scheduler%20PRD.md) | Full product spec, features, architecture | Understanding requirements, feature decisions |
| [BACKLOG.md](docs/BACKLOG.md) | Current priorities, pre-MVP tasks | What to work on next |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Colors, typography, spacing, patterns | Any UI/styling work |
| [COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) | Component APIs, usage examples | Building UI |
| [BOOKING_AUTOMATION.md](docs/BOOKING_AUTOMATION.md) | Puppeteer flow, retry logic, skip system | Automation changes |
| [PRE_LAUNCH_CHECKLIST.md](docs/PRE_LAUNCH_CHECKLIST.md) | Infrastructure tasks | Config/deployment |
| [ERROR_MESSAGES.md](docs/ERROR_MESSAGES.md) | Error catalog | Error handling |

---

## Project Structure

```
app/actions/      → Server actions (all form submissions)
app/dashboard/    → Protected pages
lib/date-utils.ts → Date calculations (CRITICAL - always use this)
lib/inngest/      → Event-driven booking functions
components/ui/    → Design system components (19 components)
scripts/          → Puppeteer automation
supabase/         → Migrations and RLS policies
```

---

## Critical Gotchas

- **Date/time:** Always use `lib/date-utils.ts`. Two `calculateBookingWindowOpen` implementations exist - use `lib/inngest/scheduler.ts` for recurring classes
- **Encryption:** AES-256-GCM for gym passwords, key in `ENCRYPTION_KEY` env var (never sent to database)
- **Inngest sync:** Manual sync required in Inngest dashboard after deploying function changes
- **Inngest events:** Delete cancels events; inactive/pause uses runtime checks (events still fire but don't book)
- **User deletion:** Inngest events NOT canceled on user delete (fail gracefully, acceptable for MVP)

---

## Workflows & Rules

### Reading Order for New Context
1. Start with [PRD](docs/My%20Workout%20Scheduler%20PRD.md) for full product understanding
2. Then [BACKLOG.md](docs/BACKLOG.md) for current priorities
3. Reference specialized docs as needed

### Before Asking User Questions
Check PRD and BACKLOG first - many decisions are already documented there.

### Always Do
- Import components from `@/components/ui`
- Use design tokens for colors (never arbitrary values)
- Use `<Footer>` on every page
- Use mobile-first responsive classes (320px base)
- Run `/frontend-design` skill for new visual design work
- Validate auth in server actions, use `revalidatePath` after mutations

### Never Do
- Create inline buttons/forms - use component library
- Use `new Date()` without timezone context
- Parse YYYY-MM-DD as UTC (causes off-by-one-day bugs)
- Use arbitrary colors - use design tokens only
- Commit `.env.local` or credentials
- Skip dry-run before real booking tests
- Update `/prototype` case study (frozen at v2.22)
- Skip auth validation in server actions

### Code Change Workflows

**Adding Features:**
1. Schema change → `supabase/migrations/`
2. Types → `lib/database.types.ts`
3. Server actions → `app/actions/`
4. Components → `app/dashboard/` or `components/`

**Database Changes:**
Migration → types → server action → component (in that order)

**After UI Changes:**
- Check mobile (320px)
- Verify Footer is present
- Confirm design tokens used (no arbitrary colors)

### Documentation Update Triggers

| Change Type | Update |
|-------------|--------|
| Version bump | CLAUDE.md version line + PRD version history |
| New feature complete | PRD version history |
| Design token/pattern | `DESIGN_SYSTEM.md` + consider `/prototype/design-system-components` |
| Component API | `COMPONENT_LIBRARY.md` + consider `/prototype/design-system-components` |
| Bug fix pattern | `ERROR_MESSAGES.md` |
| Config/infrastructure task | `PRE_LAUNCH_CHECKLIST.md` |
| Development task | `BACKLOG.md` (Pre-MVP section) |

**Note:** `/prototype` (case study) is frozen at v2.22 - do NOT update.

---

## Quick Reference

### Testing Commands
```bash
npm run test:booking-dry-run    # Safe dry-run (always run first)
npm run test:single-booking     # REAL booking!
```

### Required Env Vars
```
NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY
INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, RESEND_API_KEY
```

See `.env.example` for full template.

---

*Last Updated: January 10, 2026 (v2.27)*
