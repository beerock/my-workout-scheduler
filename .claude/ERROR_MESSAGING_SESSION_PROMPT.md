# Error Messaging & User Notifications Improvement Session

## Context

You are working on the My Workout Scheduler project - a gym class booking automation system. We've just completed a comprehensive audit of all failure scenarios and identified that our error messages need improvement for better user experience.

## Reference Documents

**Read these first:**
1. `docs/FAILURE_SCENARIOS_AUDIT.md` - Complete audit of all 16 failure scenarios
2. `docs/My Workout Scheduler PRD.md` - Product requirements
3. `CLAUDE.md` - Project context guide

## Current State

**Problem:** Error messages are technical and developer-focused
- Users must check dashboard manually (no email/SMS notifications)
- Error messages don't provide clear next steps
- No distinction between temporary vs permanent failures
- Retry status not visible to users

**Example Current Error:**
```
"Class 'Racquetball' at 12:30 not found on schedule"
```

**What's Missing:**
- Why did this happen?
- What should the user do?
- Is this temporary or permanent?
- Will the system retry?

## Your Task

Improve the user experience for booking failures by:

### Phase 1: Review & Categorize (Do This First)
1. Review all 16 failure scenarios in `docs/FAILURE_SCENARIOS_AUDIT.md`
2. Categorize each by user action needed:
   - 🟢 **No Action:** System is handling it (retrying, already booked)
   - 🟡 **Action Recommended:** Check configuration, verify settings
   - 🔴 **Action Required:** Fix credentials, remove class, contact gym

### Phase 2: Improve Error Messages
For each failure scenario, create user-friendly error messages that include:
1. **What happened** (in plain language)
2. **Why it might have happened** (common causes)
3. **What happens next** (retry behavior or manual action needed)
4. **How to fix it** (step-by-step if action required)

**Template:**
```
[Clear description of what happened]

Why this might happen:
• [Common cause 1]
• [Common cause 2]
• [Common cause 3]

What happens next:
[Automatic retry info OR manual action needed]

How to fix:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Need help? [Link to troubleshooting guide]
```

### Phase 3: Design Notification System (If Time Permits)
1. Email templates for each failure category
2. SMS templates for critical failures
3. Dashboard UI mockups for retry status
4. Real-time notification preferences

## Constraints

**MVP Scope:**
- 5 users max
- Keep it simple - don't over-engineer
- Focus on clarity over features

**Technology:**
- Email: Resend API (already integrated)
- Database: Supabase (already set up)
- Frontend: Next.js (App Router)

## Success Criteria

After this session, we should have:
- ✅ All 16 error messages rewritten in user-friendly language
- ✅ Clear categorization (no action / action recommended / action required)
- ✅ Implementation plan for notifications (email/SMS)
- ✅ Updated code with new error messages (if time permits)

## Key Questions to Answer

1. **When should we send notifications?**
   - Every failure?
   - Only permanent failures?
   - Only after retries exhausted?

2. **What should the notification include?**
   - Just error message?
   - Link to dashboard?
   - Suggested actions?
   - Retry schedule?

3. **How do we handle retry scenarios?**
   - Notify on first failure?
   - Notify when retries exhausted?
   - Notify on success after retry?

4. **What about successful bookings?**
   - Always notify?
   - Only if user opted in?
   - Summary email vs individual?

## Deliverables

Create these documents/files:
1. **Error Messages Guide** (`docs/ERROR_MESSAGES.md`)
   - All 16 scenarios with improved messages
   - Categorization by user action needed
   - Examples for each category

2. **Notification System Design** (`docs/NOTIFICATIONS_DESIGN.md`)
   - When to send notifications
   - Email templates
   - SMS templates (optional)
   - User preferences

3. **Implementation Plan** (`docs/NOTIFICATIONS_IMPLEMENTATION.md`)
   - Step-by-step implementation
   - Database changes needed
   - Code changes needed
   - Testing checklist

4. **Updated Code** (if time permits)
   - New error messages in `scripts/booking-automation.ts`
   - Email notification functions
   - User preferences in database

## Example Improved Error Message

**Before:**
```typescript
errorMessage: 'Class is full - no waitlist option available. Will retry in case spots open up.'
```

**After:**
```typescript
errorMessage: `
We couldn't book your ${className} class at ${classTime} because it's full.

Why this happened:
• The class filled up before we could book it
• Other members may have booked at the same time
• Class has limited capacity

What happens next:
✓ We'll automatically keep trying every 15 minutes until the class starts
✓ If someone cancels, we'll grab that spot for you
✓ You'll get a confirmation email if we successfully book it

No action needed - we're on it!

Want to try a different time? Update your schedule in the dashboard.
`
```

## Tips for Success

1. **Think like a user, not a developer**
   - Avoid technical jargon
   - Use friendly, conversational tone
   - Assume user doesn't understand how the system works

2. **Be specific and actionable**
   - Don't say "configuration error" - say "check that class name matches"
   - Include exact steps to fix
   - Link to help resources

3. **Set expectations**
   - Tell users what will happen next
   - Give timelines for retries
   - Be honest about limitations

4. **Reduce anxiety**
   - Reassure when system is handling it
   - Explain when manual action is truly needed
   - Provide support options

## Start Here

Begin by reading `docs/FAILURE_SCENARIOS_AUDIT.md` thoroughly, then start with the highest-impact scenarios:

**Priority Order:**
1. **Class is full** (most common, has retry logic)
2. **Booking window not open** (timing-related, has fast retry)
3. **Class not found** (config error, needs clear guidance)
4. **Login failed** (credential issue, needs immediate attention)
5. **Class cancelled** (permanent, needs clear action)

Good luck! 🚀
