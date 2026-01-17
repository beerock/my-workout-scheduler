# CLAUDE.md

## Project Overview

**My Workout Scheduler** automates gym class reservations using Puppeteer to book classes the instant registration opens (e.g. 26 hours before class time).

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase, Inngest, Puppeteer, Resend

**MVP Scope:** 5 users, 2-5 classes per user, 100% free tier services

**Current Version:** v2.30 - Retry Exhausted Notifications (see PRD for full version history)

---

## Mandatory Pre-Flight Checklist

**STOP. Before ANY action, verify:**

1. **Branch** - Not on main? (See Git Branch Safety)
2. **Prior decisions** - Checked PRD/BACKLOG first?
3. **UI work** - Using component library + design tokens?

**If adding to BACKLOG.md** - Follow strict format below

**If unsure about ANY rule** - Ask user before proceeding

---

## Key Documentation

| Doc | Purpose | When to Use |
|-----|---------|-------------|
| [README.md](README.md) | Project overview, setup, tech stack | Onboarding, external-facing info |
| [PRD](docs/My%20Workout%20Scheduler%20PRD.md) | Full product spec, features, architecture | Understanding requirements, feature decisions |
| [BACKLOG.md](docs/BACKLOG.md) | Current priorities, pre-MVP tasks | What to work on next |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Colors, typography, spacing, patterns | Any UI/styling work |
| [COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) | Component APIs, usage examples | Building UI |
| [BOOKING_AUTOMATION.md](docs/BOOKING_AUTOMATION.md) | Puppeteer flow, retry logic, skip system | Automation changes |
| [PRE_LAUNCH_CHECKLIST.md](docs/PRE_LAUNCH_CHECKLIST.md) | Infrastructure tasks | Config/deployment |
| [ERROR_MESSAGES.md](docs/ERROR_MESSAGES.md) | Error catalog | Error handling |

**Reading order:** Start with PRD, then BACKLOG, then specialized docs as needed.

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

### Git Branch Safety (CRITICAL)

**At the start of EVERY new session**, before making any file changes (code, docs, configs, migrations, etc.) in any environment (VS Code, Cursor, CLI/terminal, etc.):

1. **Check current branch** using `git branch --show-current`

2. **If on `main` or `master`:**
   - STOP and alert the user: "You are currently on the main branch."
   - Show available branches: `git branch -a`
   - Ask the user to choose:
     - **Use existing branch:** Select from the list
     - **Create new branch:** Suggest a descriptive name based on the current task (e.g., `feature/add-email-notifications`, `fix/timezone-bug`, `docs/update-readme`). User can accept the suggestion or provide their own name.
     - **Continue on main (emergency only):** Requires explicit confirmation ("I confirm this is a hotfix/emergency")

3. **If on a feature branch:**
   - Show current branch: "You are on branch `feature/xyz`"
   - Ask: "Continue on this branch, or switch?"
   - Options: Continue on current branch, switch to existing branch, or create new branch

4. **Once confirmed:** Proceed with changes for the rest of the session without re-prompting

**Branch naming conventions:** `feature/`, `fix/`, `docs/`, `refactor/`, `security/`

### Always Do (MANDATORY)
- Check PRD and BACKLOG before asking user questions - many decisions are already documented
- Import components from `@/components/ui`
- Use design tokens for colors (never arbitrary values)
- Use `<Footer>` on every page
- Use mobile-first responsive classes (320px base)
- Run `/frontend-design` skill for new visual design work
- Validate auth in server actions, use `revalidatePath` after mutations
- Update `/prototype/design-system-components` when adding/modifying components
- Update `/prototype/email-preview` when adding/updating email templates

### Never Do (VIOLATIONS REQUIRE USER PERMISSION)
- Create inline buttons/forms - use component library
- Use `new Date()` without timezone context
- Parse YYYY-MM-DD as UTC (causes off-by-one-day bugs)
- Use arbitrary colors - use design tokens only
- Commit `.env.local` or credentials
- Skip dry-run before real booking tests
- Update `/prototype` or `/prototype/scheduler-v2` case studies (frozen at v2.22)
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
| Version bump | CLAUDE.md version line + PRD version history + README.md version |
| New feature complete | PRD version history |
| Tech stack change | README.md tech stack section |
| Design token/pattern | `DESIGN_SYSTEM.md` + `/prototype/design-system-components` |
| Component API | `COMPONENT_LIBRARY.md` + `/prototype/design-system-components` |
| Bug fix pattern | `ERROR_MESSAGES.md` |
| Config/infrastructure task | `PRE_LAUNCH_CHECKLIST.md` |
| Development task | `BACKLOG.md` (appropriate section) |
| Major architecture change | README.md (features, automation, structure sections) |

### BACKLOG.md Structure (STRICT)

**ALWAYS follow this format.** If you believe additional detail is essential, ASK the user before adding it.

**Sections (in order):**
1. **Pre-MVP Required** - Must complete before launch
2. **Post-MVP: High Priority** - Near-term after launch
3. **Post-MVP: Low Priority** - Nice-to-have
4. **Completed (Summary)** - 3-4 line summaries only
5. **Archived** - Deprioritized/unlikely with brief reason
6. **Operational Notes** - Key deployment info

**Required entry format:**
```
### Feature Name
**Status:** [status] | **Priority:** [High/Medium/Low]

One paragraph description (2-3 sentences max).

**Requirements:** (3-5 bullets max)
**Dependencies:** (if any)
**Last Updated:** [date]
```

**Rules:**
- New features → Add to appropriate priority section using format above
- Completed → Move to "Completed (Summary)", collapse to 3-4 lines with completion date
- Abandoned → Move to "Archived" with one-line reason
- **NEVER add:** code examples, testing checklists, implementation details, alternative approaches
- **If detail seems necessary:** Ask user: "This feature may need more detail than standard format. Should I add [specific thing]?"

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

*Last Updated: January 14, 2026 (v2.30)*
