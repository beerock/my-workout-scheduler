# YMCA Main Site Booking Flow (GroupExPro → Daxko)

## Overview

The YMCA main site (ymcawnc.org) uses a **hybrid booking system**:
- **Schedule & Login**: GroupExPro.com handles the class schedule display and authentication
- **Booking**: After login, users are redirected to **Daxko** (operations.daxko.com) for the actual reservation

**Key Insight:** The same credentials work for both GroupExPro and Daxko. Existing users do not need credential migration. We can reuse our existing Daxko booking logic after the GroupExPro login step.

> **Important: GroupExPro Migration to Daxko (January 2026)**
>
> GroupExPro and Daxko are the same company (Daxko is the parent). GroupExPro's website indicates they are "moving" - likely migrating fully to daxko.com. This means:
> - The current hybrid flow (GroupExPro login → Daxko booking) may change
> - YMCA may eventually use pure Daxko for both login and booking
> - **DO NOT archive existing Daxko login/booking code** - we may need it again
> - Keep both GroupExPro and Daxko login flows available in the codebase
>
> **Backup file:** `scripts/booking-automation-daxko-backup.ts` contains the full original Daxko-only flow (two-step login, branch selection, booking). If YMCA reverts to pure Daxko, reference this backup.

---

## Complete Booking Flow (Confirmed)

### Step 1: Navigate to YMCA Schedule
```
https://www.ymcawnc.org/schedules?date=YYYY-MM-DD
```

### Step 2: Click Register on Class Card
The Register link redirects to GroupExPro login:
```
https://www.groupexpro.com/gxp/reservations/start/index/{CLASS_ID}/{MM}/{DD}/{YYYY}?type=responsive
```
Which then redirects to:
```
https://www.groupexpro.com/gxp/auth/login/reservations-start-index-{CLASS_ID}-{MM}-{DD}-{YYYY}?c=1&e=0&type=responsive
```

### Step 3: Login (GroupExPro)
Single-step login form with Email + Password fields.

### Step 4: Daxko Booking Page (REDIRECT)
After successful login, redirects to Daxko:
```
https://operations.daxko.com/online/4032/GXP/ChooseMembers.mvc?class_id={DAXKO_CLASS_ID}
```

**Example:** `https://operations.daxko.com/online/4032/GXP/ChooseMembers.mvc?class_id=14747720011626`

### Step 5: Complete Reservation (Daxko)
Same UI as current automation:
- Checkbox next to member name (e.g., "Brock Busby")
- **RESERVE** or **WAITLIST** button
- Standard Daxko confirmation flow

---

## URL Structure

### Schedule Page
```
https://www.ymcawnc.org/schedules?date=YYYY-MM-DD&locations=&categories=&cn=&inst=&room=
```

**Query Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `date` | Date in YYYY-MM-DD format (use gym timezone!) | `2026-01-16` |
| `locations` | Filter by location ID | (numeric ID) |
| `categories` | Filter by category | |
| `cn` | Class name filter | |
| `inst` | Instructor filter | |
| `room` | Room filter | |

**Important:** When constructing the date parameter, use the gym's timezone (America/New_York for YMCA of WNC) to ensure the correct date is displayed.

### Date Navigation
- Arrow buttons (`<` `>`) for previous/next date pagination
- Displays current date (e.g., "Fri, Jan 16")
- Pagination available at bottom of class list

---

## Location Filter Options

Available YMCA branches (checkbox selection on schedule page):
- Asheville YMCA
- Black Mountain YMCA
- Corpening Memorial YMCA
- Ferguson Family YMCA
- Hendersonville Family YMCA
- Reuter Family YMCA
- Woodfin YMCA

---

## Class Listing Structure

Each class card displays:
- **Time** (e.g., "5:45am")
- **Duration** (e.g., "45min")
- **Class name** (e.g., "Cycle")
- **Category** (e.g., "Cardio")
- **Location** (e.g., "Reuter Family YMCA Cycle Studio")
- **Instructor name**
- **Availability** (e.g., "5 spots left")
- **CTA button** (see Class States below)
- **Add to calendar** option (ICalendar, Google Calendar, Outlook)

### Class States (CTA Buttons)

The class card CTA indicates booking availability. These states map directly to our existing Daxko automation logic in `scripts/booking-automation.ts`:

| # | YMCA Site Detection | Daxko State (existing code) | Action |
|---|---------------------|----------------------------|--------|
| 1 | **"Register"** CTA | `"Reserve"` button | Click → proceed to booking |
| 2 | **"Waitlist Only"** CTA | `"Reserve"` + waitlist text | Click → join waitlist |
| 3 | **"Full"** CTA | `"Class Full"` | Cannot book, skip |
| 4 | **No CTA present** | `"Not Reservable"` | Cannot book, skip |
| 5 | **"CANCELED: ..."** prefix in class name | `"Canceled"` | **Do NOT click CTA** - see warning below |

→ Refer to existing Daxko automation code (`scripts/booking-automation.ts`) for state-to-email trigger logic.

---

### ⚠️ Critical: Cancelled Class Behavior (State 5)

**Important Discovery:** On YMCA site, cancelled classes are deceptive:

1. Class name shows: `"CANCELED: BODYPUMP"` or `"CANCELED: Cycle"` (prefix + actual class name)
2. **"Register" CTA is still present and clickable**
3. Clicking Register → GroupExPro login works
4. Login → Daxko Reserve page works
5. Select member checkbox → works
6. **Click Reserve → ERROR:** `"Cannot add exercisers to BODYPUMP as the class has been cancelled."`

**Automation MUST check class name for `"CANCELED: "` prefix BEFORE clicking CTA** to avoid wasted Puppeteer flow (login, navigation, error).

**Use Fuzzy Matching:** Staff may type variations like "CANCELED:", "Canceled:", "CANCELLED -", etc. Use regex pattern:
```typescript
const cancelledPattern = new RegExp(`cancel[led]*[:\\s\\-]*${classTypeLower}`, 'i');
```

---

### Detection Order for YMCA Site Automation

Since we already parse class name to find/match the class, checking for `"CANCELED: "` is essentially free:

```
1. Find class on schedule by matching name/time/location (class name already parsed)
2. IF class name starts with "CANCELED: " → STOP, return "cancelled" (do NOT click CTA)
3. ELSE check CTA:
   - "Register" → Bookable, proceed with flow
   - "Waitlist Only" → Join waitlist
   - "Full" → Unbookable (no waitlist)
   - No CTA → Unbookable (not reservable)
```

**Alternative approach:** Check CTA first, then only check `"CANCELED: "` if CTA is "Register". Either works since we already have the class name - the current order prioritizes catching the cancelled edge case early.

---

### Pagination Note

When paginating through classes on the same day (pagination at bottom of list):
- Page does NOT auto-scroll to top after pagination
- Automation must scroll to top of class list after each pagination click
- Otherwise may miss classes at top of next page

**Reusable Logic:** The state detection mirrors our existing Daxko `ChooseMembers.mvc` page logic where we check for "Reserve" vs "Waitlist" vs disabled button states.

---

## Login Flow (GroupExPro → Daxko)

**Key Discovery (Jan 18, 2026):** GroupExPro login page is a **redirect service** - don't enter credentials there!

### Correct Flow
1. Click "Register" on YMCA schedule → redirects to GroupExPro login page
2. **Click "Login" button on GroupExPro (do NOT enter credentials)**
3. Redirects to Daxko login page (`operations.daxko.com/.../find_account`)
4. Complete Daxko 2-step login:
   - Enter email → Click "Submit"
   - Enter password → Click "Login"
   - **Do NOT check "Keep me logged in"** (can cause issues)
5. Redirects to `ChooseMembers.mvc` for booking

### Why This Works
- GroupExPro and Daxko are the same company
- Clicking Login on GroupExPro triggers SSO-style redirect to Daxko
- Daxko handles actual authentication
- Same credentials work because it's ultimately Daxko auth

### Common Mistake
Entering credentials directly on GroupExPro login form will fail or behave unexpectedly. Always click through to Daxko.

---

## Key Differences: Current Daxko Flow vs YMCA Main Site Flow

| Aspect | Current Daxko Flow | YMCA Main Site Flow |
|--------|-------------------|---------------------|
| Schedule URL | operations.daxko.com | ymcawnc.org/schedules |
| Login Platform | Daxko (2-step) | GroupExPro (1-step) |
| Booking Platform | Daxko | **Daxko** (same!) |
| Login URL | /Online/4032/Security/login.mvc | groupexpro.com/gxp/auth/login/... |
| Branch Selection | Dropdown on schedule page | Checkboxes on YMCA site |
| Class ID in URL | Not visible | Visible in Register link |
| **Credentials** | **Same** | **Same** |
| **Booking UI** | **ChooseMembers.mvc** | **ChooseMembers.mvc** (same!) |

---

## Confirmed Working (Jan 18, 2026)

- ✅ **Cycle 9:00am Monday @ Asheville YMCA** - Booked successfully via YMCA hybrid flow

---

## Working Selectors

These selectors are confirmed working as of Jan 18, 2026:

| Element | Selector | Notes |
|---------|----------|-------|
| Class card container | `.schedules-data__row` | Each class is a row |
| Register/Waitlist CTA | `a.btn-primary[href*="groupexpro"]` | Links to GroupExPro |
| Daxko email field | `input[type="text"], input[type="email"]` | First step of 2-step login |
| Daxko password field | `input[type="password"]` | Second step of 2-step login |
| Daxko Submit button | `button[type="submit"], input[type="submit"]` | After email entry |
| Daxko Login button | `button:has-text("Login"), input[value="Login"]` | After password entry |

**Selector Gotcha:** Don't use `[class*="class"]` for finding class cards - it matches the page container element, not individual class rows.

---

## Implementation Notes

### Credentials
- **Confirmed:** Same credentials work for both GroupExPro and Daxko
- No credential migration needed for existing users
- Most YMCA of WNC users are initially onboarded via GroupExPro
- **Recommendation:** New users should verify their credentials work on groupexpro.com before saving in our system
- **Backlog Item:** See "Credential Testing on Credentials Page" in `BACKLOG.md` for planned UX to test credentials within the app

### Timezone Considerations
When constructing schedule URLs with date parameters:
- Always use the gym's timezone (America/New_York for YMCA of WNC)
- Use `lib/date-utils.ts` for date calculations
- Incorrect timezone could show wrong day's classes

### Puppeteer Automation Strategy
Since the booking happens on Daxko after GroupExPro login:
1. Navigate to YMCA schedule page
2. Find target class by name/time
3. Extract class ID from Register link href
4. Navigate to GroupExPro login URL with class ID
5. **NEW:** Handle GroupExPro single-step login (email + password)
6. **REUSE:** Existing Daxko booking logic (ChooseMembers.mvc)
   - Check member checkbox
   - Click Reserve/Waitlist
   - Detect confirmation

### Class ID Extraction
The Register link contains the class ID:
```html
<a href="https://www.groupexpro.com/gxp/reservations/start/index/14747720/01/16/2026?type=responsive">REGISTER</a>
```
Class ID: `14747720`

After login, Daxko uses a different format: `14747720011626` (appears to append date info)

---

## Daxko ChooseMembers Page (Post-Login)

After GroupExPro login, the Daxko page shows:

**Class Info:**
- Class name and location
- Date, time, duration
- Availability (e.g., "5 of 18 open")

**Booking UI:**
- "Select Group Members for Reservation"
- Checkbox next to each "Active Members" name
- **BACK** button
- **RESERVE** button (or WAITLIST if full)

This is the same UI as our current automation, so existing booking logic can be reused.

---

## Open Questions (Resolved)

| Question | Answer |
|----------|--------|
| Do credentials work for both systems? | **Yes** - same credentials work |
| Where does booking happen? | **Daxko** - after GroupExPro login |
| Can we reuse existing code? | **Yes** - Daxko booking logic is reusable |
| Is there a booking window? | **TBD** - likely same as Daxko (26 hours) |

---

*Last Updated: January 18, 2026*
*Verified via live booking test - Cycle 9:00am Monday @ Asheville YMCA*
