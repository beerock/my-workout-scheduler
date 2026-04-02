# Architecture Decision: Booking Automation Platform

**Date:** 2025-01-XX  
**Status:** ✅ **SUPERSEDED** - Now using Inngest event-driven scheduling + early-start optimization  
**Related:** [PRD](./My%20Workout%20Scheduler%20PRD.md) Section 5.3  
**Original Decision:** GitHub Actions with 15-minute cron schedule + clock drift retry logic  
**Current Architecture:** Inngest fires events 90s before booking window; GitHub Actions runs Puppeteer; early-start wait-and-refresh replaces clock drift retries

---

## Original Problem

**Timing Gap Issue:**

The original PRD specified hourly GitHub Actions, which created a critical timing vulnerability:

1. **Scenario:** User adds a class at 2:15 PM that needs booking at 2:30 PM (15 minutes away)
2. **Last GitHub Action:** Ran at 2:00 PM
3. **Next GitHub Action:** Won't run until 3:00 PM
4. **Result:** ❌ **MISSED BOOKING WINDOW**

**Additional Concerns:**
- Maximum delay of 59 minutes between checks
- Clock drift between system and gym website clocks
- GitHub Actions minutes consumption (2,000/month free tier)

---

## Proposed Solutions

### Option 1: Vercel Cron Jobs + Immediate Triggers (Not Chosen)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Vercel Deployment (Single Codebase)        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Web UI (Next.js App Router)                            │
│  ├─ User adds/updates recurring class                   │
│  ├─ User toggles pause/active settings                  │
│  └─ → Immediately triggers booking check if needed      │
│                                                          │
│  API Routes                                              │
│  ├─ /api/book-classes (Cron Job)                       │
│  │   └─ Runs every 5-15 minutes                          │
│  │   └─ Checks all active classes for due bookings      │
│  │                                                       │
│  └─ /api/book-classes (Manual Trigger)                  │
│      └─ Called immediately when class added/updated      │
│      └─ Only processes if booking window opens soon     │
│                                                          │
│  Shared Booking Logic                                    │
│  ├─ Query Supabase for due bookings                     │
│  ├─ Decrypt gym credentials                             │
│  ├─ Launch Puppeteer (headless browser)                │
│  ├─ Navigate gym website & book class                  │
│  ├─ Update booking_attempts table                       │
│  └─ Send email notification                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/book-classes",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- Runs every 15 minutes (configurable: 5, 10, or 15 min)
- More frequent than hourly = catches bookings sooner
- Built into Vercel deployment (no separate service)

#### 2. Booking API Route

Create `/app/api/book-classes/route.ts`:

```typescript
// Handles both cron-triggered and manual-triggered bookings
export async function GET(request: Request) {
  // Check if this is a cron job or manual trigger
  const authHeader = request.headers.get('authorization')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  
  // Query database for classes needing booking
  // Launch Puppeteer for each due booking
  // Update database with results
  // Send notifications
}
```

#### 3. Immediate Trigger on Class Save

Modify `/app/actions/recurring-classes.ts`:

```typescript
export async function saveRecurringClass(data, id) {
  // ... existing save logic ...
  
  // After successful save, check if booking needed soon
  const bookingWindowOpen = calculateBookingWindowOpen(...)
  const minutesUntilBooking = (bookingWindowOpen - now) / 1000 / 60
  
  // If booking window opens within next hour, trigger immediately
  if (minutesUntilBooking > 0 && minutesUntilBooking < 60) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/book-classes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })
  }
}
```

---

## Benefits & Improvements

### 1. **Eliminates Timing Gaps**
- ✅ Immediate response when classes are added/updated
- ✅ Frequent periodic checks (every 15 min vs hourly)
- ✅ No missed booking windows due to scheduling delays

### 2. **Simplified Architecture**
- ✅ **Single codebase** - All logic in one place
- ✅ **Single deployment** - No separate GitHub Actions workflow
- ✅ **Single environment** - All env vars in Vercel dashboard
- ✅ **Easier debugging** - Logs in one place (Vercel dashboard)
- ✅ **Simpler maintenance** - One service to monitor

### 3. **Better Integration**
- ✅ **Tight coupling** - Booking logic directly integrated with web app
- ✅ **Shared utilities** - Reuse date-utils, encryption, database helpers
- ✅ **Consistent error handling** - Same patterns across codebase
- ✅ **Unified testing** - Test booking logic alongside UI

### 4. **Cost & Resource Efficiency**
- ✅ **No GitHub Actions minutes** - Free tier preserved for CI/CD
- ✅ **Vercel cron included** - No additional cost on free tier
- ✅ **Better resource usage** - Same serverless functions handle both

### 5. **Improved User Experience**
- ✅ **Instant feedback** - User sees booking attempt triggered immediately
- ✅ **Real-time updates** - Can refresh dashboard to see booking status
- ✅ **Better error handling** - Errors surface in web UI, not just logs

### 6. **Development Experience**
- ✅ **Local testing** - Can test booking logic locally with `vercel dev`
- ✅ **Faster iteration** - Changes deploy with web app, no separate workflow
- ✅ **Better tooling** - Vercel dashboard shows cron execution history

---

## Comparison Table

| Aspect | GitHub Actions (Original) | GitHub Actions (Implemented) | Vercel Cron (Not Chosen) |
|--------|---------------------------|-----------------------------|--------------------------|
| **Scheduling Frequency** | Hourly | Every 15 minutes | Every 5-15 minutes |
| **Immediate Triggers** | ❌ No | ❌ No | ✅ Yes (on class save) |
| **Timing Optimization** | ❌ No | ✅ Yes (early-start wait-and-refresh) | ❌ No |
| **Codebase Location** | Separate workflow | Separate workflow | Same Next.js app |
| **Environment Variables** | GitHub Secrets | GitHub Secrets | Vercel Dashboard |
| **Deployment** | Separate from web app | Separate from web app | Same deployment |
| **Logs & Monitoring** | GitHub Actions logs | GitHub Actions logs | Vercel Dashboard |
| **Puppeteer Compatibility** | ✅ Works | ✅ Works | ⚠️ Size/timeout limits |
| **Cost** | Free tier | ~$4-8/month (paid) | Free tier (but Puppeteer issues) |
| **Integration** | Loosely coupled | Loosely coupled | Tightly integrated |
| **Maintenance** | Two services | Two services | One service |

---

## Implementation Considerations

### Puppeteer in Vercel Serverless Functions

**Challenge:** Puppeteer requires Chrome binary, which can be large for serverless.

**Solutions:**
1. **Use `@sparticuz/chromium`** - Pre-built Chromium for AWS Lambda (works on Vercel)
2. **Use `puppeteer-core`** - Lighter weight, requires external Chrome
3. **Vercel Function Size Limits:**
   - Hobby: 50MB
   - Pro: 250MB
   - Enterprise: 1GB

**Recommendation:** Test with `@sparticuz/chromium` first. If size is an issue, consider:
- Using a lighter browser automation tool
- Running Puppeteer in a separate service (Railway, Render) that Vercel calls
- Using Vercel's Edge Functions with a different approach

### Cron Secret Security

Vercel automatically adds an `Authorization` header to cron requests. Verify it:

```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

### Rate Limiting

- Vercel cron jobs don't count against function invocation limits
- Manual triggers do count, but should be minimal (only on class save)
- Monitor usage in Vercel dashboard

### Error Handling

- Failed bookings should be logged to `booking_attempts` table
- Email notifications for failures
- Retry logic for transient failures
- User dashboard shows booking status

---

## Migration Path

If already using GitHub Actions:

1. **Phase 1:** Create Vercel cron job alongside GitHub Actions
2. **Phase 2:** Run both in parallel, compare results
3. **Phase 3:** Disable GitHub Actions once Vercel proves reliable
4. **Phase 4:** Remove GitHub Actions workflow file

---

## Alternative: Hybrid Approach

If Puppeteer proves problematic in Vercel:

- **Vercel:** Web UI + API routes for scheduling logic
- **GitHub Actions or Railway:** Puppeteer automation (called by Vercel API)
- **Best of both:** Immediate triggers from Vercel, heavy automation elsewhere

This still improves on pure GitHub Actions by adding immediate triggers.

---

### Option 2: Enhanced GitHub Actions (✅ **IMPLEMENTED**)

**Decision:** Enhanced GitHub Actions, now superseded by Inngest event-driven + early-start optimization

#### Implementation Details (Historical -> Current)

**1. Scheduling (SUPERSEDED)**
- ~~15-minute cron schedule~~ -> Inngest event-driven scheduling
- Inngest fires booking events at precise times (90s before booking window opens)
- GitHub Actions triggered via workflow_dispatch from Inngest

**2. Early-Start Optimization (replaced clock drift retries)**
- Inngest fires event 90s before booking window opens
- Puppeteer completes all prep (login, navigation, landing on class details page) before window opens
- Wait-and-refresh loop: sleeps until 2s before window, then refreshes every 2s (up to 15 attempts)
- Result: booking click within 2-4 seconds of window opening (was ~57s)

**3. Architecture (Current)**
```
Inngest Event (90s early)
  -> GitHub Actions workflow_dispatch
    -> Puppeteer:
      1. Navigate YMCA schedule
      2. Find class, click Register
      3. Login to GroupExPro
      4. Land on class details page
      5. waitForBookingWindow() - sleep + refresh loop
      6. Click "Reserve a Spot" / "Join the Waitlist"
      7. Send result event back to Inngest
```

**Files Modified:**
- `.github/workflows/booking-automation.yml` - Workflow dispatch (triggered by Inngest)
- `scripts/booking-automation.ts` - Puppeteer automation with early-start wait-and-refresh
- `lib/inngest/scheduler.ts` - Event scheduling (fires 90s early)
- `lib/inngest/functions.ts` - Orchestration (triggers GH Actions, handles retries)

#### Benefits

1. ✅ **Precise Timing** - Inngest fires events at exact booking window time (minus 60s for prep)
2. ✅ **Early-Start Optimization** - Booking click within 2-4s of window opening
3. ✅ **Proven Platform** - GitHub Actions reliable for Puppeteer
4. ✅ **No Size Limits** - Puppeteer works without constraints
5. ✅ **Event-Driven** - No polling; each class gets its own precisely-timed event
6. ✅ **Simple Architecture** - Inngest handles scheduling, GH Actions handles execution

#### Trade-offs

- ❌ Requires paid tier (not free)
- ❌ Separate from web app codebase
- ❌ No immediate triggers (15-minute minimum delay)
- ❌ Environment variables in GitHub Secrets

---

## Decision: Enhanced GitHub Actions

**Why GitHub Actions was chosen over Vercel Cron:**

1. ✅ **Puppeteer Compatibility** - Vercel free tier has 10s timeout and 50MB size limit, insufficient for full Puppeteer booking process
2. ✅ **Proven Solution** - GitHub Actions already working; now triggered precisely by Inngest
3. ✅ **Cost Acceptable** - ~$4-8/month is reasonable for MVP
4. ✅ **Early-Start Optimization** - Arrives before booking window, refreshes at exact moment
5. ✅ **Reliability** - GitHub Actions proven stable for long-running Puppeteer scripts

**Risk Mitigation:**
- ✅ Inngest event-driven scheduling eliminates polling delays
- ✅ Early-start wait-and-refresh handles timing edge cases (up to 30s coverage)
- ✅ Monitoring via GitHub Actions logs + Inngest dashboard
- ✅ Class full retries every 15 minutes via Inngest

---

## Implementation Status

✅ **COMPLETED:**

1. ✅ Migrated from 15-minute cron to Inngest event-driven scheduling
2. ✅ Replaced clock drift retry logic with early-start optimization (v2.32)
3. ✅ Updated PRD to reflect current architecture
4. ✅ Migrated from Daxko to GroupExPro booking flow

**Current Implementation:**
- Inngest scheduling: `lib/inngest/scheduler.ts` (fires events 90s before booking window)
- Inngest orchestration: `lib/inngest/functions.ts` (triggers GH Actions, handles retries)
- GitHub Actions workflow: `.github/workflows/booking-automation.yml` (workflow_dispatch)
- Puppeteer automation: `scripts/booking-automation.ts` (with `waitForBookingWindow()`)

## Future Considerations

**Backlog Items:**
- Playwright migration (replace Puppeteer for better stability)
- Immediate triggers on class save (would require Vercel or separate service)

---

## References

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Serverless Function Limits](https://vercel.com/docs/functions/serverless-functions/runtimes)
- [Puppeteer on Vercel](https://vercel.com/guides/deploying-puppeteer-with-vercel)
- Current PRD: [My Workout Scheduler PRD.md](./My%20Workout%20Scheduler%20PRD.md)

