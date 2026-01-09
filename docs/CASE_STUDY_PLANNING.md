# Case Study Planning

This document captures ideas for future case studies, following the format established by the Design System v2 case study.

---

## Existing Case Study: Design System v2

**Location:** `/prototype` hub with sub-pages

**Pages:**
- `/prototype` ([app/prototype/page.tsx](../app/prototype/page.tsx)) - Main case study narrative
- `/prototype/scheduler-v2` ([app/prototype/scheduler-v2/page.tsx](../app/prototype/scheduler-v2/page.tsx)) - Design system applied to product
- `/prototype/design-system-components` ([app/prototype/design-system-components/page.tsx](../app/prototype/design-system-components/page.tsx)) - Component library showcase

**Structure (for reference):**
1. Hero - The Hook (challenge statement)
2. It Started With 3 Directions (exploration)
3. The Journey (evolution timeline v1.0 → v2.22)
4. From Exploration to Iteration (process steps)
5. The Diagonal Badge: A Signature Element (creative contribution)
6. The Results (metrics + key decisions)
7. See It In Action (CTAs to prototypes)

**What made it effective:**
- Visual direction cards showing rejected alternatives
- Timeline showing version evolution
- "Key insight" callouts after each section
- Interactive elements (badges, buttons, shadows)
- Code snippet showing the signature clip-path formula
- Metrics grid with diagonal corner cuts
- Dark mode achievement card for visual variety

---

## Planned Case Study: Email Notification System

**Target Location:** `/prototype/email-notifications` (new page)

**Status:** Planning phase - to be built in future session

**Plan File Reference:** `C:\Users\brock\.claude\plans\elegant-skipping-charm.md`

### The Story Arc

**1. The Problem Statement**
- Booking system runs in background - users had no visibility into results
- Failures were silent - users didn't know about login issues until bookings stopped
- No way to distinguish between "class full" (temporary) vs "login failed" (action required)

**2. Phase 0: Error Analysis**
- Started by auditing all possible booking outcomes
- Created error matrix: 16 failure scenarios → categorized into 3 types
- Decision: Critical (user must act) vs Config (check settings) vs Technical (we'll retry)

**3. The Template Design Journey**
- Initial approach: Premium redesign with gradients, VML, status heroes
- User feedback: "Too complex for MVP"
- Pivot: Simple, functional templates - iterate on design post-MVP
- Key decision: Ship working emails, polish later

**4. User Preference System**
- Question: Which emails can users unsubscribe from?
- Answer: Success emails yes, critical emails never
- Removed "Off" option - users shouldn't miss login failures
- Simplified UI: Removed daily digest (not implemented), kept immediate mode

**5. The UX Details**
- Unsubscribe link behavior (grey, links to Account page with info alert)
- Conditional CTAs (login errors → credentials page, others → dashboard)
- Smart routing: Success emails → schedule page, not just dashboard

**6. The Results**
- 8 email templates (welcome, pause reminder, 6 booking types)
- User preference UI with 4 toggles
- Inngest integration for automated sending
- Pause reminder with 7-day delay and auto-cancel

### Key Narrative Beats

| Beat | What Happened | The Lesson |
|------|--------------|------------|
| Error categorization | 16 scenarios → 3 categories | Complexity for users ≠ complexity for system |
| Template pivot | Premium → Simple | Ship working first, polish later |
| Unsubscribe debate | Which emails are mandatory? | Security trumps user preference |
| CTA routing | Generic dashboard → specific pages | Every click should have clear intent |
| Pause reminder | 24h → 7 days | Helpful nudge vs annoying nag |

### Visual Elements to Include

**Error Categorization Matrix:**
```
Critical (Red)     Config (Yellow)    Technical (Orange)
├── Login failed   ├── Class not found  ├── Unexpected error
├── Class cancelled ├── Branch mismatch  ├── Navigation failed
├── Not reservable ├── Wrong class      └── Button not found
└── Time conflict  └── Class disappeared
```

**Email Template Showcase:**
- Screenshot gallery of all 8 templates
- Interactive preview (similar to `/prototype/email-preview`)
- Before/after of CTA improvements

**Decision Flow:**
```
Booking Result
    ↓
Check user preferences
    ↓
Is this a failure? → Is it critical? → Always send
    ↓                        ↓
No                    Config/Technical → Check email_on_failure toggle
    ↓
Success/Waitlist → Check individual toggles
```

**Metrics:**
- 8 email templates
- 4 notification toggles
- 3 failure categories
- 7-day pause reminder delay
- 0 emails for skipped classes

### Files for Context

When building the case study, reference:
- `lib/email/templates/` - All 8 email templates
- `lib/email/get-email-template.ts` - Categorization logic
- `lib/notifications/send-booking-notification.ts` - Preference checking
- `components/NotificationPreferencesForm.tsx` - User UI
- `supabase/migrations/010_notification_system.sql` - Database schema
- `docs/ERROR_MESSAGES.md` - User-friendly error messages source

### Implementation Notes

**Page Structure (suggested):**
1. Hero: "Keeping Users Informed Without Spamming Them"
2. The Invisible Problem (before: silent failures)
3. Categorizing Chaos (error matrix)
4. Template Design Decisions (simple vs premium)
5. The Preference Paradox (what can users disable?)
6. UX Polish (CTA routing, unsubscribe flow)
7. The Results (metrics, screenshots)
8. See the Emails (link to email preview prototype)

**Components to Reuse:**
- Editorial dividers from `/prototype`
- Diagonal badge system for metrics
- Dark card for "Key Decisions" section
- Animation delays for staggered reveal

---

## Future Case Study Ideas

### 1. Booking Automation Deep Dive
- The 26-hour booking window
- Fuzzy matching algorithm
- Retry logic and duplicate prevention
- YMCA Daxko two-step booking flow

### 2. Skip/Pause/Inactive System
- Three-zone cleanup logic
- Immediate scheduling on state change
- Skip edit confirmation UX
- Inngest event cancellation patterns

### 3. Form Validation Journey
- Password strength meter evolution
- Email validation timing (blur vs keystroke)
- Confirm password matching UX
- Form reset key pattern

---

## How to Use This Document

When starting a case study session:
1. Read this document for context
2. Reference the plan file for detailed decisions
3. Follow the existing `/prototype` page structure
4. Use the design system components (diagonal badges, editorial dividers)
5. Include "Key insight" callouts after each section
6. End with metrics and CTAs to related pages
