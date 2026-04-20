# VOICE.md — My Workout Scheduler Style Guide

**Last Updated:** April 19, 2026 (v2.36 — Sprint 1)

This guide codifies the product's voice across every user-facing surface: app copy, email templates, form states, landing page, and waitlist. It exists so that new copy lands consistent with what already ships, and so future coat-on-top edits don't drift the tone.

**Who this is for:** anyone (human or agent) writing user-facing text in this codebase.

**How to use this:** read this doc before editing any user-facing string. When a tier's rule and your instinct disagree, follow the rule. When adding new copy, match the register and tier first, then polish.

---

## Two registers

The product speaks in **two distinct voices**, chosen by context — never mixed within a single surface.

### Register 1 — Logged-in coach voice

**Where it lives:** everything inside the app after sign-in (dashboard copy, form feedback, banners, alerts, action items) plus every booking email triggered on behalf of an authenticated user.

**Posture:** Energetic. Active-verb. On your side. The product is the user's coach, not their butler. A good coach is specific, calibrated to the moment, and doesn't apologize when nothing is their fault.

**Calibration:** Four tiers, calibrated to what the user needs to do right now. See [Coach voice tiers](#coach-voice-tiers) below for full tier guidance.

**Hard rules:**
- **Zero first-person singular pronouns.** No "I", "I'm", "I'll", "me", or "my" in product-facing copy. Reason: first-person anthropomorphizes a software product and ages poorly on failure states — an "I'll book it" message that then fails reads as broken promise, not broken code. Prefer active verbs ("Watching for a spot") or "we/our" when a voice is required.
- **Active verb over passive construction.** "Watching for the first opening" not "The class is being watched." "Grabbing your seat" not "A seat will be grabbed."
- **Never exclamation-heavy on failure.** Zero exclamation marks in any "Need your help" or "FYI" tier. Exclamation marks are reserved for genuine confirmations.
- **Never self-blaming passive voice.** "The booking hit a snag" not "We failed to book your class."
- **Never compliance/corporate jargon.** "Some alerts we always send" not "Critical alerts are always sent as transactional emails."
- **Never generic-fitness-app cliché.** "Ready to Start Your Fitness Journey?" is banned. "Your Wellness Adventure" is banned. Anything that could ship in a motivational poster is banned.

### Register 2 — Landing-page showcase voice

**Where it lives:** the public landing page (`app/page.tsx`), the waitlist form, the waitlist-confirmation state, and the first beat of the waitlist-confirmation email (the "Thanks for joining the waitlist" template). Any surface a non-authenticated visitor sees.

**Posture:** Confident. Restrained. Shows craft. The landing is also a portfolio artifact for prospective clients, so the voice has to read as an intentional product decision — not a scrappy beta apology, not a hype-y growth-hack funnel.

**Hard rules:**
- **Never self-deprecating.** "Currently invite-only — join the waitlist" reads as intentional. "Sorry, we're closed right now" does not.
- **Never hype-y.** "Join the revolution" is banned. "Automate your fitness" is banned. Anything that sounds like Series-A growth copy is banned.
- **Short over clever.** One line should tell the visitor what the product is and what to do next. No paragraphs of positioning.
- **Specific over scalable-sounding.** "Auto-books your YMCA class the instant registration opens" beats "Reclaim your time with intelligent fitness automation."

### The hand-off between registers

The waitlist-confirmation email is the one place both voices appear in sequence. It opens in showcase voice (the sender is a product, not yet "your coach") and warms into coach voice by the closing line as the reader mentally crosses from prospect to user-in-waiting.

Concrete example:

> **Subject:** You're on the waitlist
>
> Thanks for signing up. *(showcase voice — brief, confident, no exclamation)*
>
> We'll reach out as soon as an invite opens up. In the meantime, nothing's expected of you. *(still showcase)*
>
> When your invite lands, we'll get your first class on the schedule in under two minutes. *(warming toward coach voice)*

Every other email is coach voice end-to-end. Every landing surface is showcase voice end-to-end.

---

## Coach voice tiers

The coach speaks in **four tiers**, distinguished by whether the user needs to do something in response.

| Tier | User action required? | Feeling | Use for |
|------|----------------------|---------|---------|
| **Confirmed** | No. Just good news. | Warm, specific, no hype. | Successful bookings, successful retries, waitlist joins, already-registered confirmations. |
| **Working on it** | No, but the system is actively doing something on their behalf. | Warm-coach, on-your-side, active verb. | Class is full and retrying; transient technical failure that will retry; mid-retry status updates. |
| **Need your help** | Yes — a concrete step, right now. | Calm-and-action. Short. Fix-forward. No self-blame. | Credentials invalid; no-online-registration class; one-shot technical failure with no retry. |
| **FYI** | No. Informational, might want to double-check. | Briefer than coach voice elsewhere. Earnest. Factual. | Class cancelled by the gym. Pause reminders. Weekly digests. |

### Tier mapping for booking outcomes

This is the authoritative mapping. When in doubt, pin the tier based on "what does the user have to do next?"

| Booking outcome | Tier | Example line |
|----------------|------|--------------|
| Successfully booked | **Confirmed** | "Got you in — Monday 4:15 BODYPUMP at Woodfin." |
| Added to waitlist | **Confirmed** | "On the waitlist for Monday 4:15 BODYPUMP. We'll let you know if a spot opens up." |
| Already registered | **Confirmed** | "You're already on the list for Monday 4:15 — no action needed." |
| Class full, retrying | **Working on it** | "Class is packed right now — watching for the first opening." |
| Generic technical failure, retryable | **Working on it** | "Hit a snag — running it back. Nothing you need to do." |
| Credentials bad / login failed | **Need your help** | "Your gym login isn't working. Quick fix: re-save your credentials and booking resumes. Call [branch phone] if you need a hand." |
| No-online-registration class | **Need your help** | "This class doesn't offer online booking. Call [branch phone] to reserve in person." |
| Generic technical failure, one-shot | **Need your help** | "Couldn't confirm your seat for Monday 4:15. Try again from the dashboard, or call [branch phone] to reserve over the phone." |
| Class cancelled by gym | **FYI** | "Heads up — the gym cancelled your Monday 4:15. Branch number: [phone] if you want to double-check." |
| Final retry exhausted | **Need your help** | "Couldn't get you into Monday 4:15 BODYPUMP — the class filled before a spot opened. Check the dashboard for the next one." |

---

## Per-tier phrasing guide

Each tier has its own rhythm. Use the "prefer" and "avoid" lists as spot-checks.

### Confirmed

**Feeling:** A good teammate delivering good news. Specific. Zero hype.

**Prefer:**
- "Got you in."
- "You're confirmed — [class] [day] [time] at [branch]."
- "On the waitlist for [class]. We'll let you know if a spot opens."
- Single exclamation mark max — usually zero is better.

**Avoid:**
- "🎉🎉🎉 YOU'RE IN!!!"
- "Booking successful." (flat, corporate — no warmth)
- "We have successfully reserved your spot." (formal, passive, lifeless)
- Multiple exclamation marks.
- Clapping/fire/muscle emoji.

### Working on it

**Feeling:** Warm coach, quietly confident, actively doing the thing. The user should feel taken care of — not talked at.

**Prefer:**
- "Class is packed right now — watching for the first opening."
- "Taking another swing at it. Nothing you need to do."
- "Hit a snag — running it back. You'll get a confirmation when it lands."
- Active verbs: watching, grabbing, standing by, retrying, handling.

**Avoid:**
- "I'm retrying the booking now." (first-person — banned)
- "Please wait while we attempt to secure your spot." (corporate, passive)
- "Don't worry!" (never tell the user how to feel)
- "Unfortunately, the class is currently full." (passive, apologetic when no apology is owed)

### Need your help

**Feeling:** Calm, concrete, fix-forward. No apologizing. No panic. The next sentence tells them what to do.

**Structure:**
1. One sentence stating the problem in plain terms.
2. One sentence telling the user the fix.
3. A fallback: usually the branch phone for human help.

**Prefer:**
- "Your gym login isn't working. Quick fix: re-save your credentials on the credentials page — booking resumes automatically. Call [phone] if you need a hand."
- "This class doesn't offer online booking. Call [phone] to reserve in person."
- "Couldn't confirm your seat. Try again from the dashboard, or call [phone] to book over the phone."

**Avoid:**
- "🔴 Action Required: ERROR." (screaming)
- "We apologize for the inconvenience." (self-blaming, corporate)
- "Unfortunately, an error has occurred while attempting to process your booking." (passive, wordy, bureaucratic)
- Exclamation marks. None.
- Dead-ends with no recovery action.

### FYI

**Feeling:** The briefer, flatter sibling of the coach voice. Earnest, factual, respects the reader's time. The user doesn't need to act — they might just want to know.

**Prefer:**
- "Heads up — the gym cancelled your Monday 4:15. Branch number: [phone] if you want to double-check."
- "You paused booking through May 3. Everything resumes automatically after that."
- "Here's the week: 2 classes confirmed, 1 still pending."

**Avoid:**
- "FYI:" as a literal prefix (it's a posture, not a label).
- Excess warmth on a factual note — don't sell the cancellation.
- Dramatic language. "Important:", "Please note:", "Attention:" — all cut.

---

## Craft examples: before → after

These are the exact transforms Sprint 1 applies. Use them to calibrate.

| Before (current) | After (this guide) | Why |
|------------------|-------------------|-----|
| "Sign-ups are currently closed. If you'd like access, please reach out to the team for an invite." | "Currently invite-only. Add your email and we'll reach out when a spot opens." | Landing showcase voice — intentional, not apologetic. |
| "Ready to Start Your Fitness Journey?" | "One class added, and your Sundays go quiet. Let's set the first one." | Coach voice over fitness-app cliché; outcome-first framing. |
| "Critical alerts like login failures are always sent." | "Some alerts we always send — login problems, cancelled classes. The rest you control below." | Coach voice over compliance-speak. |
| "[X] hrs until class" | "Booking opens Sunday 2:15 PM · watching the list" | Living status over dead countdown. |
| "Class booking failed. Please try again." | "Couldn't confirm your seat for Monday 4:15. Try again from the dashboard, or call [phone] to book over the phone." | Need-your-help tier: problem, fix, fallback. |

---

## Naming: how to refer to the gym

The product supports **the YMCA of Western North Carolina** (ymcawnc.com), which has multiple branches — Asheville, Woodfin, Black Mountain, Hendersonville, Corpening Memorial, Reuter Family, and Ferguson Family. "Asheville YMCA" is **one branch among several**, not shorthand for the whole organization. Using it as an org name erases every other branch's users.

**Canonical forms, in order of preference:**

| Context | Use | Example |
|---------|-----|---------|
| First mention in a body of copy (hero subtitle, email body, docs) | **"YMCA of Western North Carolina"** (full name) | "a small, invite-only beta for the YMCA of Western North Carolina" |
| Subsequent mentions in the same surface, or compact UI (badges, buttons, menu items, page titles) | **"YMCA WNC"** or **"YMCA of Western NC"** | "Invite-only · YMCA of Western NC beta" |
| Specific branch (correct usage) | The branch's actual name from `lib/constants/ymca.ts` | "Asheville YMCA", "Woodfin YMCA", "Black Mountain YMCA" |
| Never | "Asheville YMCA" as org shorthand, "the YMCA" (too generic), "Asheville's YMCA" | — |

Pick whichever compact form (WNC vs Western NC) reads better in the layout you're editing — consistency *within* a single surface matters more than which compact form you picked.

### Hero badge, landing page

The badge above the hero headline is the first line of copy a prospective client reads. It has to signal intentional product scope.

**Prefer:** "Invite-only · YMCA of Western NC beta" (current shipped copy) / "Currently invite-only · YMCA of Western NC" / "A YMCA of Western NC beta · Invite-only" / something in that shape.

**Avoid:** "Automated booking for YMCA classes" (generic, scalable-sounding, no scope signal). "Built for fitness enthusiasts" (cringe). "AI-powered automation" (hype, irrelevant).

### Waitlist form

The form itself and its confirmation state both live in showcase voice.

**Form prompt:** brief and confident. No "please." No explanation of why an email is needed — it's self-evident.

**Confirmation:** "You're on the waitlist. We'll reach out when a seat opens up." No celebration, no multi-paragraph reassurance, no "check your inbox!" nudge.

### Waitlist-confirmation email

One-screen email. Opens in showcase voice ("Thanks for signing up"), names the product's scope ("the YMCA of Western North Carolina" — see the naming rule below), warms into coach voice on the closing line ("When your invite lands, we'll get your first class on the schedule in under two minutes"). No CTA — there's nothing to click yet. No unsubscribe language — they signed up for exactly this.

---

## Surfaces and which voice they use

| Surface | Voice | Tier (if coach) |
|---------|-------|----------------|
| Landing page (`app/page.tsx`) | Showcase | — |
| Waitlist form (`/signup`) | Showcase | — |
| Waitlist confirmation state | Showcase | — |
| Waitlist-confirmation email | Showcase → Coach | closing in Confirmed |
| Login page | Minimal / functional | — |
| Dashboard, all banners & cards | Coach | varies by state |
| `NextClassCard` pending state | Coach | Working on it |
| `ActionItems` / failure surface | Coach | Need your help (usually) |
| `GetStartedBanner` | Coach | Working on it |
| `PauseBanner` | Coach | FYI |
| Welcome email | Coach | Confirmed opening, Working on it for the forward-motion beat |
| `booking-success` email | Coach | Confirmed |
| `booking-retry-successful` email | Coach | Confirmed (with context that earlier attempts didn't land) |
| `booking-waitlist` email | Coach | Confirmed |
| `booking-already-registered` email | Coach | Confirmed |
| `booking-already-waitlisted` email | Coach | Confirmed |
| `booking-failure-retrying` email | Coach | Working on it |
| `booking-failure-technical` (generic variant) email | Coach | Working on it (the retry beat) |
| `booking-failure-technical` (ymca_system_error variant) email | Coach | Need your help |
| `booking-failure-critical` email | Coach | Need your help |
| `booking-failure-final` email | Coach | Need your help |
| `booking-failure-config` email | Coach | Need your help |
| `booking-no-registration` email | Coach | Need your help |
| `pause-reminder` email | Coach | FYI |
| `daily-digest` email | Coach | FYI |
| `admin-custom-class` email | Coach (internal) | FYI |
| `RecurringClassForm` inline preview | Coach | Working on it (anticipatory) |
| Account page / notification prefs | Coach | FYI |
| Toast / inline `<Alert>` copy | Coach | per context |

---

## Quick checklist before shipping any copy

- [ ] Which register? (Coach if logged-in/booking-email; Showcase if landing/waitlist)
- [ ] If coach: which tier? Does the tier match what the user has to do next?
- [ ] Zero first-person "I"/"I'm"/"I'll"?
- [ ] Active verb over passive construction?
- [ ] No corporate compliance-speak? No generic-fitness cliché?
- [ ] Failure state: problem → fix → fallback, in that order?
- [ ] Success state: specific and warm, not hype-y?
- [ ] Exclamation mark appropriate? (Almost never on failure. Rarely on success.)
- [ ] Would this line still read right if the user got it for the tenth time?
