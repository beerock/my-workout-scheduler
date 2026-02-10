# CLAUDE.md

## Project Overview

**My Workout Scheduler** automates gym class reservations using Puppeteer to book classes the instant registration opens (e.g. 26 hours before class time).

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase, Inngest, Puppeteer, Resend

**MVP Scope:** 5 users, 2-5 classes per user, 100% free tier services

**Current Version:** v2.30 - Retry Exhausted Notifications (see PRD for full version history)

---

## Mandatory Pre-Flight Checklist

**STOP. Before ANY action, verify:**

1. **Worktree** - Right branch/worktree? (See Git Worktree Safety)
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
.claude/hooks/    → PreToolUse hooks (e.g., block .env edits)
.claude/agents/   → Custom subagents (security-reviewer)
.claude/skills/   → Custom skills (/create-migration)
.mcp.json         → MCP server configs (Supabase)
```

---

## Critical Gotchas

- **Date/time:** Always use `lib/date-utils.ts`. Use `calculateBookingWindowOpen` from `lib/inngest/scheduler.ts` for booking window calculations
- **Encryption:** AES-256-GCM for gym passwords, key in `ENCRYPTION_KEY` env var (never sent to database)
- **Inngest sync:** Manual sync required in Inngest dashboard after deploying function changes
- **Inngest events:** Delete cancels events; inactive/pause uses runtime checks (events still fire but don't book)
- **User deletion:** Inngest events NOT canceled on user delete (fail gracefully, acceptable for MVP)
- **Linting:** `npm run lint` is broken (Next.js config issue). Use `npx tsc --noEmit` for type checking.
- **Inngest auth:** SDK auto-validates `INNGEST_SIGNING_KEY` — no explicit check needed in route handler

---

## Workflows & Rules

### Git Worktree Safety (CRITICAL)

**At the start of EVERY new session**, before making any file changes (code, docs, configs, migrations, etc.):

1. **Detect environment** using `git worktree list` and `git branch --show-current`

2. **If on `main` in the main repo:**
   - STOP and alert the user: "You are in the main repo on the main branch."
   - Show existing worktrees: `git worktree list`
   - Ask: "Do you need a worktree for this task, or is a branch sufficient?"
     - **Create new worktree:** Suggest a branch name based on the task. Run Worktree Auto-Setup (below).
     - **Create branch only:** `git checkout -b <branch>` for lightweight tasks (doc edits, config tweaks).
     - **Use existing worktree/branch:** List options for the user to choose from.
     - **Continue on main (emergency only):** Requires explicit confirmation ("I confirm this is a hotfix/emergency")

3. **If in a worktree (on a feature branch):**
   - Show current worktree and branch: "You are in worktree `<path>` on branch `<branch>`"
   - Ask: "Continue working here, or do you need a different worktree?"

4. **Once confirmed:** Proceed with changes for the rest of the session without re-prompting

#### Mid-Session Migration

If the user says "let's move this to a worktree" at any point during the session:
1. Create worktree + run auto-setup
2. Switch to using absolute paths targeting the worktree directory for all file operations
3. Continue the session — no restart needed, all context is preserved

#### Worktree Auto-Setup

When creating a new worktree, run from the main repo directory:
```bash
MAIN_REPO=$(pwd)
git worktree add ../my-workout-scheduler-worktrees/<branch> -b <branch>
cd ../my-workout-scheduler-worktrees/<branch>
npm install
cp "$MAIN_REPO/.env.local" .env.local
```

For an existing branch, omit the `-b` flag:
```bash
git worktree add ../my-workout-scheduler-worktrees/<branch> <branch>
```

After setup, continue working in the same session using absolute paths to the worktree.

#### Worktree Reference

- **What travels automatically:** `.claude/`, `.mcp.json`, all tracked source files
- **What needs per-worktree setup:** `node_modules/`, `.env.local`, `.next/`
- **Port conflicts:** Use `PORT=3001 npm run dev` for concurrent dev servers

#### Worktree Cleanup

After a branch is merged (from the main repo directory):
```bash
git worktree remove ../my-workout-scheduler-worktrees/<branch>
git branch -d <branch>
```

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
- Edit `.env` files directly (blocked by PreToolUse hook - user must edit these manually)
- Edit lock files directly (blocked by PreToolUse hook - run `npm install` instead)
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
Migration → types → server action → component (in that order). Use `/create-migration <name>` to scaffold.

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

### Dev Commands
```bash
npm run dev                     # Start dev server (localhost:3000)
npm run build                   # Production build
npm run lint                    # ESLint check
npx tsc --noEmit                # TypeScript type check
```

### Testing Commands
```bash
npm run test:booking-dry-run    # Safe dry-run (always run first)
npm run test:single-booking     # REAL booking!
```

### Database Commands
```bash
npm run backup                  # Backup database (data only)
npm run backup:full             # Backup database (schema + data)
npm run restore                 # Restore from backup
```

### Required Env Vars
```
NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY
INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, RESEND_API_KEY
```

See `.env.example` for full template.

---

*Last Updated: February 10, 2026 (v2.30)*
