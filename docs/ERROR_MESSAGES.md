# Error Messages Guide

**Last Updated:** April 1, 2026 (v2.32)

This document provides user-friendly error messages for all booking failure scenarios, categorized by the action users need to take.

---

## Quick Reference by Category

### 🟢 No Action Needed (System Handling It)

| Scenario | What's Happening |
|----------|------------------|
| Class already reserved | Successfully booked already! |
| Class is full (with retry) | System retrying every 15 minutes |
| Intentional skip | You chose to skip this class |

### 🟡 Action Recommended (Check Your Settings)

| Scenario | What to Check |
|----------|---------------|
| Class not found | Class name, time, day, and branch |
| Class disappeared after reload | Gym website for class status |
| Branch selection failed | Branch name matches gym website |
| Navigation failed | Wait and see if it resolves |
| Could not find/click booking button | May be temporary website issue |
| No RESERVE button on description | Verify class allows online booking |
| Booking result unclear | Manually check gym website |
| Unexpected error | Check error details, may need to report |

### 🔴 Action Required (Fix Something)

| Scenario | What to Fix |
|----------|-------------|
| Class cancelled | Remove or update your class schedule |
| Class has no online registration | Info email sent -- may be drop-in, special program, or paid class |
| Login failed | Update your gym credentials |
| Time conflict | Cancel conflicting class or adjust schedule |

---

## Detailed Error Messages by Scenario

### 1. Booking Window Not Open Yet

**Current (Technical):**
```
No "Reserve a Spot" or "Join the Waitlist" button found on class details page.
(After early-start wait-and-refresh exhausted 15 attempts)
```

**Improved (User-Friendly):**
```
We tried to book your class, but the booking window hasn't opened yet.

Why this happens:
• Our system arrives early and waits for the exact moment the booking window opens
• We refresh the page every 2 seconds for up to 30 seconds to catch the window
• The gym's booking window may not have opened within our refresh window

What happens next:
✓ We automatically refreshed up to 15 times over 30 seconds to catch the window
✓ If this keeps happening, it may mean the booking window time is set incorrectly

What you can do:
1. Check your class settings in the dashboard
2. Verify when the "booking window" opens on your gym website (e.g., "26 hours before class")
3. If the gym changed their booking rules, update your class settings
4. The system will automatically try again at the next scheduled time

Need further help? Contact us at help@beerock.com.
```

**Category:** 🟡 Action Recommended (if persists) / 🟢 No Action (if temporary)

---

### 2. Class Is Full (No Waitlist)

**Current (Technical):**
```
"Class is full - no waitlist option available. Will retry in case spots open up."
```

**Improved (User-Friendly):**
```
Your class is currently full, but don't worry - we've got you covered!

Why this happens:
• The class filled up before we could grab a spot
• The class list shows "Full" or the RESERVE button is unavailable
• Other members may have booked at exactly the same time

What happens next:
✓ We'll automatically keep trying every 15 minutes until the class starts
✓ If someone cancels their reservation, we'll attempt to grab that spot for you
✓ You'll get a confirmation notification if we successfully book it
✓ No action needed from you - just sit back and relax!

How long will we keep trying?
We'll keep checking until the class starts. If it's still full when the class begins, we'll stop trying and you'll see a final "failed" status.

Want a different time? You can add another class to your schedule or try a different day.
```

**Category:** 🟢 No Action Needed

---

### 3. Class Cancelled

**Current (Technical):**
```
"Class is cancelled - booking not possible"
```

**Improved (User-Friendly):**
```
This class has been cancelled by the gym and cannot be booked.

Why this happens:
• Instructor is unavailable (sick, vacation, etc.)
• Low attendance led to cancellation
• The gym permanently removed this class from their schedule
• Class was rescheduled to a different day or time

What happens next:
❌ We cannot book cancelled classes
❌ The system will not retry booking this class

What you should do:
1. Check your gym's website or app for class status updates
2. Look for the class at a different time or day and edit the class in your schedule
3. Contact your gym if you have questions about the cancellation
4. If permanently cancelled, remove this class from your schedule in the dashboard


How to remove this class:
Go to Dashboard → Schedule → Find this class → Click "Delete"
```

**Category:** 🔴 Action Required

---

### 4. No Online Registration

**Status:** `no_registration` (informational, not a failure)

**Email subject:** "No Auto-Registration: {className} on {dayOfWeek}"

**Email explains this usually means:**
- Drop-in class (just show up)
- Requires in-person or phone registration
- Special program with separate enrollment

**Behavior:** Info email sent weekly (same as booking success). No retry. Respects `email_on_success` preference. User can stop by deleting/deactivating the class.

**Category:** ℹ️ Informational (blue)

---

### 5. Class Already Reserved

**Current (Technical):**
```
"Class already reserved"
```

**Improved (User-Friendly):**
```
✅ Great news! This class is already booked.

Why you're seeing this:
• We successfully booked this class in a previous attempt
• You may have manually booked it yourself
• The booking was confirmed by another automated process

What happens next:
✓ Nothing to do - you're all set!
✓ Check your gym account to confirm your reservation
✓ Show up and enjoy your class!

This is a success message, not an error. Your class is confirmed! 🎉
```

**Category:** 🟢 No Action Needed

---

### 6. Class Not Found on Schedule

**Current (Technical):**
```
"Class 'ClassName' at HH:MM not found on schedule (searched all loaded results)"
```

**Improved (User-Friendly):**
```
We couldn't find your class on the gym's schedule.

What we were looking for:
• Class name: [CLASS NAME]
• Time: [TIME]
• Day: [DAY OF WEEK]
• Branch: [BRANCH NAME]

Why this might happen:
• The class name doesn't match exactly (check for typos)
• The class time or day is incorrect
• The wrong branch is selected
• The gym no longer offers this class at this location
• The class schedule changed recently

What happens next:
❌ We cannot book classes we can't find
❌ The system will not retry (this is likely a configuration issue)

How to fix this:
1. Go to your gym's website and find the exact class listing
2. Compare the class name, time, and day with what you have in your schedule
3. Update your class settings to match EXACTLY what's on the gym website
   • Class name must match character-for-character (including spaces and capitalization)
   • Time must match
   • Day of week must be correct
   • Branch name must match
4. Save your changes and the system will try again at the next scheduled time

Tips:
• Our system handles minor typos (like "Raquetball" vs "Racquetball")
• But major differences won't work (like "BODYPUMP" vs "Body Pump 60")
• Check for extra spaces or special characters in the class name

Need help? Email help@beerock.com.
```

**Category:** 🟡 Action Recommended

---

### 7. Class Disappeared After Page Reload

**Current (Technical):**
```
"Class disappeared from schedule after page reload - may have been cancelled or removed"
```

**Improved (User-Friendly):**
```
The class was found initially, but disappeared when we refreshed the page.

Why this might happen:
• The gym just cancelled the class
• The class was removed from the schedule
• Temporary website glitch (rare)
• The class moved to a different day or time

What happens next:
❌ We cannot book classes that disappear from the schedule
❌ The system will not retry (likely permanent)

What you should do:
1. Check your gym's website or app to verify the class status
2. Look for cancellation notices or schedule changes
3. If the class was moved to a different time, update your schedule
4. If the class was cancelled, remove it from your schedule

This usually means the class was cancelled or removed by the gym. If it persists, the class may no longer be offered.
```

**Category:** 🟡 Action Recommended

---

### 8. Login Failed

**Current (Technical):**
```
"Login failed: [specific error from login function]"
```

**Improved (User-Friendly):**
```
We couldn't log into your gym account.

Why this might happen:
• Your username or password is incorrect
• You recently changed your gym password
• Your gym account is locked or suspended
• The gym's website is temporarily down
• Network connectivity issue

What happens next:
❌ We cannot book classes without logging in
❌ The system will not retry until you update your credentials

What you should do:
1. Try logging into your gym website manually to verify your credentials
2. If your password changed, update it in the dashboard:
   Dashboard → Credentials → Update your password
3. If you can't log in manually:
   • Reset your password on the gym website (e.g. Forgot Password)
   • Contact the gym if your account is locked
   • Make sure your membership is active
4. Once you can log in manually, update your credentials in our system

How to update your credentials:
Go to Dashboard → Gym Credentials → Enter your correct username and password → Save

Important: Your credentials are encrypted and secure. We only use them to automate your bookings.

Need help? Email us at help@beerock.com.
```

**Category:** 🔴 Action Required

---

### 9. Branch Selection Failed

**Current (Technical):**
```
"Branch selection failed: [specific error]"
```

**Improved (User-Friendly):**
```
We couldn't select the correct gym branch.

Why this might happen:
• The branch name doesn't match what's on the gym website
• The branch was renamed or closed
• The gym website structure changed
• Temporary website loading issue

What happens next:
❌ We cannot book classes at the wrong branch
❌ The system will not retry until the branch name is corrected

What you should do:
1. Log into your gym website and check the branch dropdown
2. Note the EXACT branch name as it appears (including any prefixes like "Asheville YMCA")
3. Update your class settings with the correct branch name:
   Dashboard → Schedule → Edit class → Update branch name
4. Save and the system will try again at the next scheduled time

Common branch name issues:
• Missing prefix: "Woodfin" vs "Woodfin YMCA"
• Different format: "YMCA Asheville" vs "Asheville YMCA"
• Abbreviations: "Asheville Y" vs "Asheville YMCA"

Tip: Copy the exact branch name as shown on your gym website to ensure accuracy.

Need help? Email help@beerock.com.
```

**Category:** 🟡 Action Recommended

---

### 10. Navigation Failed (Day Selection)

**Current (Technical):**
```
"Navigation failed: [specific error]"
```

**Improved (User-Friendly):**
```
We had trouble navigating to the correct day on the gym's schedule.

Why this might happen:
• The gym's website structure changed recently
• The page didn't load completely due to slow network
• Temporary website issue or maintenance
• The day calculation was incorrect (rare)

What happens next:
⏳ This is usually temporary
✓ The system will try again at the next scheduled booking time
✓ If it works next time, no action needed from you

What you should do:
1. Wait to see if the issue resolves on the next attempt
2. If this happens repeatedly (3+ times in a row):
   • Verify your class day and time settings are correct
   • Check your timezone setting matches your gym's location
   • Report the issue to help@beerock.com (we may need to update our automation code)

When to take action:
• If this error happens once or twice: Don't worry, it's likely temporary
• If it happens consistently: Check your class configuration or report the issue

This is often a temporary glitch that resolves itself. We'll keep trying!

Need help? Email help@beerock.com.
```

**Category:** 🟡 Action Recommended (if persists)

---

### 11. Could Not Find or Click Booking Button

**Current (Technical):**
```
"Could not find or click booking button for the class"
```

**Improved (User-Friendly):**
```
We found your class, but couldn't click the booking button.

Why this might happen:
• The gym's website changed its button layout
• The booking button has a different ID or style
• JavaScript didn't fully load on the page
• Network slowness prevented the button from appearing
• The button requires special interaction we don't recognize

What happens next:
⏳ This might be temporary
✓ The system will try again at the next scheduled booking time
✓ If it works next time, no action needed

What you should do:
1. Try manually booking the class to verify the button exists and works
2. If you can book manually but our system can't:
   • Report this issue to help@beerock.com (we may need to update our automation)
   • Include the class name, time, and gym location
4. If you can't book manually either:
   • The class may not allow online booking (see "Class Not Reservable")

When to report:
• If this happens once: Wait for next attempt
• If it happens consistently: Report the issue with screenshots

We're working on making our automation more adaptable to website changes!

Need help? Email help@beerock.com.
```

**Category:** 🟡 Action Recommended (if persists)

---

### 12. No RESERVE Button on Class Description Page

**Current (Technical):**
```
"No RESERVE button found on class description page"
```

**Improved (User-Friendly):**
```
We navigated to the class details page, but couldn't find a RESERVE or WAITLIST button to complete your booking.

Why this might happen:
• The class doesn't allow online reservations
• The gym's website changed its booking flow
• We clicked on the wrong class by mistake (similar name/time)

What happens next:
❌ We cannot complete bookings without a RESERVE or WAITLIST button
❌ The system will not retry (this is likely a configuration or booking flow issue)

What you should do:
1. Try manually booking this class through the gym website
2. If you can book manually:
   • The website structure may have changed
   • Report this issue to help@beerock.com so we can update our automation
3. If you can't book manually:
   • Verify the class allows online booking
   • Check if special registration or prerequisites are required
   • Contact the gym to ask about booking requirements

Possible solutions:
• Verify the class name and time are exactly correct
• Check if the class requires in-person registration
• Look for special requirements (membership level, program enrollment, etc.)

Need help? Email help@beerock.com.
```

**Category:** 🟡 Action Recommended

---

### 13. Time Conflict (Existing Reservation)

**Current (Technical):**
```
"Cannot book - you already have a class scheduled at this time (conflicts with existing reservation)"
```

**Improved (User-Friendly):**
```
You already have another class booked at this time.

Why this happens:
• You manually booked an overlapping class
• Another automated booking in your schedule conflicts with this one
• You have a previous reservation that's still active

What happens next:
❌ Gyms don't allow double-booking the same time slot
❌ The system will not retry until you resolve the conflict

What you should do:

**Option 1: Cancel the conflicting class**
1. Log into your gym account
2. Find your existing reservation at this time
3. Cancel it if you prefer this class instead
4. The system will book this class on the next attempt

**Option 2: Adjust your schedule**
1. Go to Dashboard → Schedule
2. Remove or disable the class that's causing the conflict
3. Or change it to a different day/time that doesn't overlap

**Option 3: Keep both classes**
If you want to keep both classes in your schedule for different weeks:
1. Use the "Skip Next Occurrence" feature to alternate between them
2. Or set one class to inactive when you don't want it booked

Need help? Email brock@beerock.com.
```

**Category:** 🔴 Action Required

---

### 14. Booking Result Unclear

**Current (Technical):**
```
"Booking result unclear after clicking RESERVE button - check screenshots"
```

**Improved (User-Friendly):**
```
We clicked the RESERVE button, but couldn't tell if the booking succeeded.

Why this might happen:
• The gym's confirmation page changed its format
• Unexpected website response after booking
• Network issue during the final confirmation step
• New booking flow that we don't recognize yet

What happens next:
❓ We don't know if you're booked or not
❌ The system will not retry automatically (to avoid duplicate bookings)

What you should do RIGHT NOW:
1. **Check your gym account immediately:**
   • Log into your gym website
   • Go to "My Reservations" or "My Schedule"
   • Look for this class in your upcoming reservations
2. **Check the screenshots:**
   • Dashboard → Booking History → Find this attempt → View Screenshots
   • Look at the final screenshot to see what happened
3. **Take action based on what you find:**
   • If booked: Great! You're all set (you can ignore this error)
   • If not booked: Try booking manually or check why it failed

**If the class WAS successfully booked:**
• No action needed - you're confirmed!
• Please report this to help@beerock.com so we can improve our confirmation detection

**If the class was NOT booked:**
• Try booking manually through the gym website
• Check if there's an error message in the screenshots
• Report the issue with screenshots so we can fix it

This is a rare scenario that requires manual verification. We apologize for the inconvenience!

Need help? Email help@beerock.com.
```

**Category:** 🟡 Action Recommended (immediate manual verification)

---

### 15. Unexpected Error (Try-Catch)

**Current (Technical):**
```
"Unexpected error: [error message]"
```

**Improved (User-Friendly):**
```
Something unexpected went wrong during the booking process.

What happened:
We encountered an error we didn't anticipate: [TECHNICAL ERROR DETAILS]

Common causes:
• Network timeout or connectivity issue
• The gym's website crashed or is under maintenance
• Browser automation issue
• Memory or system resource problem
• Bug in our code (rare, but possible)

What happens next:
⏳ This might be a one-time glitch
✓ The system will try again at the next scheduled booking time
✓ If it was a temporary issue, the next attempt may succeed

What you should do:

**If this happens once:**
• Wait for the next scheduled attempt
• Check if the gym website is accessible
• No immediate action needed

**If this happens repeatedly (3+ times):**
1. Check the error details in booking history
2. Try manually booking the class to verify it works
3. Report the issue to help@beerock.com with these details:
   • Class name and time
   • Exact error message
   • When it occurred
   • Screenshots from booking history

**Immediate steps:**
1. Verify the class hasn't been booked manually by checking your gym account
2. Check if the gym website is working normally
3. Look at screenshots in booking history for clues

We log all errors automatically, but reporting helps us prioritize fixes!

Need help? Email help@beerock.com.
```

**Category:** 🟡 Action Recommended (if persists)

---

### 16. Skipped (Intentional)

**Current (Technical):**
```
"Skipped: next_skip_date equals today (YYYY-MM-DD)"
```

**Improved (User-Friendly):**
```
✓ This class was intentionally skipped as requested.

Why you're seeing this:
• You clicked "Skip Next Occurrence" for this class
• The skip date matched today's date
• This is working exactly as intended

What happens next:
✓ The skip has been cleared automatically
✓ Your regular class schedule will resume next week
✓ No action needed from you

This is NOT an error - it's confirmation that your skip request worked!

Want to skip another occurrence?
Go to Dashboard → Schedule → Find the class → Click "Skip Next"

Your class will automatically resume on the next scheduled day. Enjoy your break! 🏖️
```

**Category:** 🟢 No Action Needed

---

## Error Message Template

When creating new error messages, use this template:

```
[Clear description of what happened in 1-2 sentences]

Why this might happen:
• [Common cause 1]
• [Common cause 2]
• [Common cause 3]

What happens next:
[✓ Automatic retry info OR ❌ No retry - manual action needed]

What you should do:
1. [Step 1]
2. [Step 2]
3. [Step 3]

[Optional: Additional tips, shortcuts, or helpful links]

Need help? Email help@beerock.com.
```

---

## Writing Guidelines

### Voice and Tone
- **Conversational:** Write like you're talking to a friend
- **Reassuring:** Reduce anxiety, especially for temporary issues
- **Actionable:** Always provide clear next steps
- **Honest:** Don't sugarcoat permanent failures

### Structure
- **Start with what happened** (user perspective, not technical)
- **Explain why** (common causes they can relate to)
- **Tell them what happens next** (automated or manual action)
- **Give clear steps** (numbered, specific, achievable)

### Use Emojis Strategically
- ✓ = Success or automated action
- ❌ = Failure or no retry
- ⏳ = Temporary, waiting
- ⚠️ = Warning or caution
- 🟢 = No action needed
- 🟡 = Action recommended
- 🔴 = Action required

### Avoid
- ❌ Technical jargon (API, DOM, selector, etc.)
- ❌ Developer terms (retry loop, idempotency, etc.)
- ❌ Blaming the user ("You entered the wrong...")
- ❌ Vague advice ("Check your settings")
- ❌ Too much detail (keep it scannable)

### Include
- ✓ Specific field names and locations
- ✓ Expected vs actual values when helpful
- ✓ Links to relevant dashboard pages
- ✓ Timeline expectations (how long, when to act)
- ✓ Escalation path (when to report)

---

## Category Definitions

### 🟢 No Action Needed
**User state:** Relieved, informed
**System state:** Handling automatically or already succeeded
**Message focus:** Reassurance and explanation
**Examples:** Already reserved, class full (retrying), intentional skip

### 🟡 Action Recommended
**User state:** Curious, wants to understand
**System state:** May resolve on its own, but user can help
**Message focus:** Investigation steps and optional fixes
**Examples:** Class not found, navigation failed, unclear result

### 🔴 Action Required
**User state:** Needs to fix something
**System state:** Cannot proceed without user intervention
**Message focus:** Clear fix-it steps and urgency
**Examples:** Login failed, class cancelled, credentials invalid

---

## Testing Checklist

When testing new error messages:

- [ ] Message is under 300 words (scannable)
- [ ] First sentence clearly states what happened
- [ ] Causes are relatable (not technical)
- [ ] Next steps are automatic OR manual (clearly stated)
- [ ] Action steps are numbered and specific
- [ ] Includes WHERE to go (dashboard links, page names)
- [ ] Includes WHEN to act (now, next attempt, after 3 failures)
- [ ] Tone is appropriate for severity
- [ ] Uses emojis to aid scanning
- [ ] Tested with non-technical user
- [ ] No technical jargon

---

## Related Documentation
- `docs/FAILURE_SCENARIOS_AUDIT.md` - Technical details of all scenarios
- `docs/NOTIFICATIONS_DESIGN.md` - Email and SMS notification templates
- `docs/NOTIFICATIONS_IMPLEMENTATION.md` - Implementation plan for notifications
- `scripts/booking-automation.ts` - Code implementation

---

**Questions or suggestions?** Open an issue on GitHub!
