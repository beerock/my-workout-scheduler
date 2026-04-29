# Plan: booking_retry_waitlisted Email Template

## Context
When a class is full on the initial booking attempt, Inngest retries every 15 minutes. If a retry finds a "Reserve a Spot" button, a `booking_retry_successful` email is sent — distinct from the standard `booking_success` email, acknowledging the wait. However, if a retry finds only a "Join the Waitlist" button (class still full but waitlist opened up), the system falls through to the generic `booking_waitlist` email with no mention of the retry history. This feels wrong to the user — they waited through N retries and the email has no acknowledgment of that. We need a `booking_retry_waitlisted` email that mirrors the retry-success tone but reflects the waitlist outcome.

## Files to Modify

| File | Change |
|------|--------|
| `lib/email/templates/booking-retry-waitlisted.ts` | **CREATE** new template |
| `lib/email/get-email-template.ts` | Add import, type, routing, `isRetryWaitlisted` to `BookingEmailData` |
| `lib/email/send-notification.ts` | Add `booking_retry_waitlisted` to notification type union |
| `lib/inngest/functions.ts` | Compute `isRetryWaitlisted` flag, pass it to `sendBookingNotification` |
| `app/admin/email-preview.ts` | Add preview case for new template |
| `supabase/migrations/` | New migration: update `notification_log` CHECK constraint |

## Implementation Steps

### 1. New template: `lib/email/templates/booking-retry-waitlisted.ts`
Blend copy from BOTH existing templates:
- **From `booking-retry-successful.ts`:** retry context — "we checked N times while class was full, kept watching"
- **From `booking-waitlist.ts`:** waitlist explanation — "if someone drops before class starts, the YMCA moves you up automatically"
- Subject: `"On the waitlist after {retryCount} {check/checks} — {className} on {dayOfWeek}"`
- Body: e.g. "Checked {N} times while the class was full. A waitlist spot opened — we grabbed it. If someone cancels before class, the YMCA bumps you up automatically."
- Use warning severity (same as `booking-waitlist.ts`, not success green)
- Footer: "took {retryCount} check(s) to land a waitlist spot" (mirrors retry-successful footer)
- Accept same props as `BookingRetrySuccessfulEmailProps` (className, dayOfWeek, date, time, branchName, bookingTimestamp, retryCount, dashboardUrl, scheduleUrl, settingsUrl)

### 2. `lib/email/get-email-template.ts`
- Add `isRetryWaitlisted?: boolean` to `BookingEmailData` type (alongside existing `isRetrySuccess`)
- Import `bookingRetryWaitlistedEmail` and its props type
- Add `booking_retry_waitlisted` to the `notificationType` union in `EmailTemplate`
- Add routing in the `waitlisted` section (before the existing `if (data.status === 'waitlisted')` fallthrough):
  ```typescript
  if (data.status === 'waitlisted' && data.isRetryWaitlisted) {
    // → bookingRetryWaitlistedEmail
    notificationType: 'booking_retry_waitlisted'
  }
  ```

### 3. `lib/email/send-notification.ts`
- Add `'booking_retry_waitlisted'` to the `SendEmailParams` (or equivalent) notification type union
- Add `isRetryWaitlisted?: boolean` to `SendBookingNotificationParams`
- Pass it through to `getEmailTemplate`

### 4. `lib/inngest/functions.ts`
At line ~414 (where `isRetrySuccess` is computed), add:
```typescript
const isRetryWaitlisted = attemptNumber > 1 && status === 'waitlisted';
```
Then pass it in the `sendBookingNotification` call at line ~421.

### 5. `app/admin/email-preview.ts`
Following the new-email-templates checklist from CLAUDE.md:
- Import the new template function
- Add to the template type switch/case
- Add a registry entry with a preview case

### 6. Supabase migration
Create a new migration (following `014` pattern) that drops and recreates the `notification_log_notification_type_check` constraint to include `'booking_retry_waitlisted'`.

## Key Reuse / Patterns
- **Template structure:** Mirror `lib/email/templates/booking-retry-successful.ts` exactly — same props shape, same footer "took N check(s)" line, just different subject/body copy and warning (not success) severity
- **Routing guard order:** In `get-email-template.ts`, the new `isRetryWaitlisted` check must come BEFORE the general `status === 'waitlisted'` check (same pattern as `alreadyBooked` guard)
- **Migration pattern:** `supabase/migrations/014_*` — drop + recreate CHECK constraint

## Verification
1. Run `npx tsc --noEmit` — no type errors
2. Visit `/admin/email-preview` — confirm new template renders correctly with retry count
3. Confirm existing `booking_waitlist` preview case still renders (regression: the new routing guard must not swallow non-retry waitlists)
4. Confirm existing `booking_retry_successful` preview case still renders
5. Check Supabase migration applies cleanly via `supabase db push` or migration history