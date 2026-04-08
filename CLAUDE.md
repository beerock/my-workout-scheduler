# CLAUDE.md

## Project Overview

**My Workout Scheduler** automates gym class reservations using Puppeteer to book classes the instant registration opens (e.g. 26 hours before class time).

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase, Inngest, Puppeteer, Resend

**MVP Scope:** 5 users, 2-5 classes per user, 100% free tier services

**Current Version:** v2.34 - No Auto-Registration Detection (see PRD for full version history)

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
lib/constants/    → Shared reference data (YMCA branches, master class list)
components/ui/    → Design system components (18 components)
scripts/          → Puppeteer automation
supabase/         → Migrations and RLS policies
.claude/          → Hooks, agents, and skills
.mcp.json         → MCP server configs (Supabase)
```

### Claude Code Customizations
- **`/audit`**, **`/doc-sync`**, **`/ship`** — global skills in `~/.claude/skills/`
- **`/create-migration`** — project-specific skill for Supabase migrations
- Skills are prompt templates (SKILL.md files), not callable functions
- **PreToolUse hooks**: Block `.env` and lock file edits
- **PostToolUse hooks**: Auto-lint, auto-typecheck, main-branch warning on Edit/Write

---

## Critical Gotchas

- **Signups disabled:** Invite-only private beta. Disabled at 3 layers: signup page UI, `signupWithTurnstile` server action, and Supabase dashboard (Authentication > Sign In / Providers > Email). Re-enable all three when adding invite codes.
- **Date/time:** Always use `lib/date-utils.ts`. Use `calculateBookingWindowOpen` from `lib/inngest/scheduler.ts` for booking window calculations
- **date-fns `format()` on Vercel:** `format()` uses server timezone (UTC on Vercel), not the gym's timezone. Always use `formatInTimeZone()` from `date-fns-tz` for date strings. Same applies to `startOfWeek`/`endOfWeek` -- pass `toZonedTime()` result.
- **`getClassById` (database-helpers.ts):** Does NOT filter on `active` -- Inngest functions need access to deactivated classes for skip cleanup. Don't re-add an active filter.
- **Encryption:** AES-256-GCM for gym passwords, key in `ENCRYPTION_KEY` env var (never sent to database)
- **Inngest sync:** Auto-syncs on Vercel deploy (configured via Inngest dashboard). No manual sync needed.
- **Inngest endpoint update:** To change the app's endpoint URL (e.g. after domain migration), use **Add App → Sync with Vercel** — there is no edit button on existing apps
- **Supabase keep-alive:** Daily scheduler (`0 0 * * *`) queries DB every day — primary protection against free-tier pause. `supabaseKeepAliveFunction` (every 3 days) is the independent safety net.
- **Supabase head query:** Use `.select('*', { count: 'exact', head: true })` for a count-only query with no data transfer (HTTP HEAD request — useful for health checks/pings).
- **Inngest events:** Delete cancels events; inactive/pause uses runtime checks (events still fire but don't book)
- **Skip/pause interaction:** Pause and skip are fully independent. Pausing does NOT touch skip fields. Skips persist across pause/unpause and are only cleared by the user or consumed by the booking function at runtime. Deactivate (`toggleRecurringClassActive`) always clears both skip fields with user confirmation dialog.
- **Booking flow:** YMCA schedule -> GroupExPro login (direct auth, no Daxko) -> GroupExPro class details -> Reserve a Spot / Join the Waitlist. Daxko is no longer in the flow. Early-start optimization fires 90s early and waits on class details page.
- **Supabase URL Configuration path:** Authentication → URL Configuration (NOT Settings → Add Ons → Custom Domain, which is a paid feature)
- **VERCEL_URL vs custom domain:** `VERCEL_URL` is always a Vercel-generated hostname (e.g. `*.vercel.app`), never a custom domain — custom domain only comes through `NEXT_PUBLIC_SITE_URL`
- **User deletion:** Inngest events NOT canceled on user delete (fail gracefully, acceptable for MVP)
- **Linting:** `npm run lint` is broken (Next.js config issue). Use `npx tsc --noEmit` for type checking.
- **Dead code:** TypeScript type-checks unreachable code (after early returns). Remove dead code entirely rather than leaving it below a return — Vercel builds will fail on type errors even in unreachable paths.
- **Inngest auth:** SDK auto-validates `INNGEST_SIGNING_KEY` — no explicit check needed in route handler
- **Inngest `ts` field:** Setting `ts` on `inngest.send()` delays event delivery until that timestamp. Dashboard "Duration" includes queue wait time, not just execution time.
- **Testing:** Always use admin account (YOUR_ADMIN_EMAIL, uid: `YOUR_ADMIN_USER_ID`) for booking tests. Never use other users' classes or credentials.
- **GH Actions inputs:** Never use `${{ inputs.* }}` directly in `run:` commands (shell injection risk). Assign to `env:` block first, reference as `$ENV_VAR` in shell.
- **Puppeteer `waitUntil`:** Use `domcontentloaded` for refresh loops checking text presence/absence. Use `networkidle2` for navigation where JS-rendered content is needed. `completeGroupExProBooking` has its own `waitForFunction` for buttons.
- **Puppeteer `page.content()` timing:** Always capture `page.content()` AFTER `waitForFunction` completes, not before. Content captured before the wait may miss JS-rendered text (e.g., "filled to capacity" banner on GroupExPro).
- **Puppeteer `page.evaluate()` types:** Returns `any` -- TypeScript won't catch type mismatches inside evaluate blocks. Keep `YMCAClassSearchResult` and other Puppeteer return types manually synced when adding new statuses.
- **Early-start constant:** `EARLY_START_MS` is exported from `lib/inngest/scheduler.ts` at module scope. Change there to adjust the early-start buffer (currently 90s).
- **Supabase Studio URLs:** Table editor uses numeric table IDs, not names (`/editor/17486` not `/editor/table/recurring_classes`). Filter syntax: `filter=column%3Aoperator%3Avalue` (colons, not equals). Find table ID from the URL when navigating in the dashboard.
- **Email template XSS:** `_base-template.ts` renders `preheader` as raw HTML. Always pass `escapeHtml()` output for any user-provided content in preheader, subject, or body. The `body` prop is also raw HTML - templates must escape user content before interpolating.
- **New email templates checklist:** Template file + `get-email-template.ts` (import, type, routing) + `send-notification.ts` (type union) + `email-preview.ts` (import, type, switch case, registry) + migration for `notification_log` CHECK constraint.
- **notification_log CHECK constraint:** Adding new email notification types requires a Supabase migration to update the `notification_log_notification_type_check` constraint. Without this, email logging will fail at runtime. See migration 014 for the pattern (drop + recreate).
- **Toast vs Alert:** `useToast()` / `Toast` component is unverified in production — use inline `<Alert>` for form feedback instead.
- **Custom class dedup:** `custom_class_names` table deduplicates admin notification emails. Only one email per unique normalized class name. Clear the table to allow re-notification of the same name.
- **No-registration classes:** Classes without a Register/Waitlist button on the YMCA schedule return `status: 'no_registration'` (not `'failed'`). This skips retry logic and sends a friendly info email instead of a critical failure. Re-detected weekly -- if the class ever gains online registration, normal booking takes over. Respects `email_on_success` preference.
- **New booking status checklist:** `BookingResult` + `YMCAClassSearchResult` (booking-automation.ts), `BookingAttemptPartial` + `createBookingAttempt` + `updateBookingAttempt` (database-helpers.ts), `BookingEmailData` + `EmailTemplate.notificationType` (get-email-template.ts), `SendEmailParams` (send-notification.ts), `SendBookingNotificationParams` (send-booking-notification.ts), `BookingStatus` + `StatusCounts` + `VISIBLE_STATUSES` (booking-history.ts), `FilterCounts` (BookingHistory.tsx), `statusConfig` (BookingHistoryCard.tsx), plus 2 DB CHECK constraints (booking_attempts + notification_log).
- **`criticalKeywords` triplicate:** Three independent `criticalKeywords` arrays exist: `get-email-template.ts` (email routing), `booking-error-utils.ts` (dashboard display), `send-booking-notification.ts` (preference filtering). Keep all three in sync when adding/removing error categories.

---

## Workflows & Rules

### Git Worktree Safety (CRITICAL)

**At the start of EVERY new session**, before making any file changes:

1. **Detect environment** using `git worktree list` and `git branch --show-current`
2. **If on `main`:** STOP, alert user, suggest worktree or branch
3. **If in a worktree:** Confirm and proceed
4. **Once confirmed:** No further prompting needed

**Worktree paths:** `../my-workout-scheduler-worktrees/<branch-name>`

See `~/.claude/CLAUDE.md` for full worktree conventions (auto-setup, cleanup, mid-session migration).

### Always Do
- Check PRD and BACKLOG before asking user questions — many decisions are already documented
- Import components from `@/components/ui`
- Use design tokens for colors (never arbitrary values)
- Use `<Footer>` on every page
- Use mobile-first responsive classes (320px base)
- Run `/frontend-design` skill for new visual design work
- Validate auth in server actions, use `revalidatePath` after mutations
- Update `/prototype/design-system-components` when adding/modifying components
- Update `/prototype/email-preview` when adding/updating email templates

### Never Do
- Create inline buttons/forms — use component library
- Use `new Date()` without timezone context
- Parse YYYY-MM-DD as UTC (causes off-by-one-day bugs)
- Use arbitrary colors — use design tokens only
- Commit `.env.local` or credentials
- Edit `.env` files directly (blocked by PreToolUse hook)
- Edit lock files directly (blocked by PreToolUse hook — run `npm install` instead)
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
3. **Post-MVP: Medium Priority** - Important but not urgent
4. **Post-MVP: Low Priority** - Nice-to-have
5. **Completed (Summary)** - 3-4 line summaries only
6. **Archived** - Deprioritized/unlikely with brief reason
7. **Operational Notes** - Key deployment info

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
- **NEVER add:** code examples, testing checklists, implementation details, alternative approaches (bug notes with file paths/line numbers/fix suggestions belong in a separate entry, not appended inline)
- **If detail seems necessary:** Ask user: "This feature may need more detail than standard format. Should I add [specific thing]?"

---

## Quick Reference

### Dev Commands
```bash
npm run dev                     # Start dev server (localhost:3000)
npm run build                   # Production build
npm run lint                    # BROKEN — use npx tsc --noEmit instead
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

### Optional Env Vars
```
ADMIN_USER_IDS    # Comma-separated Supabase auth UUIDs for admin notifications
```

See `.env.example` for full template.

---

*Last Updated: April 8, 2026 (v2.34)*
