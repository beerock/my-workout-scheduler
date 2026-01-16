# YMCA Main Site Booking Flow (GroupExPro → Daxko)

## Overview

The YMCA main site (ymcawnc.org) uses a **hybrid booking system**:
- **Schedule & Login**: GroupExPro.com handles the class schedule display and authentication
- **Booking**: After login, users are redirected to **Daxko** (operations.daxko.com) for the actual reservation

**Key Insight:** The same credentials work for both GroupExPro and Daxko. Existing users do not need credential migration. We can reuse our existing Daxko booking logic after the GroupExPro login step.

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
- **Register button** → links to GroupExPro (contains class ID in URL)
- **Add to calendar** option (ICalendar, Google Calendar, Outlook)

---

## Login Flow (GroupExPro)

**Single-step login** (unlike Daxko's 2-step flow):

### Form Elements
| Element | Type | Notes |
|---------|------|-------|
| Email | text input | Same credentials as Daxko |
| Password | password input | Same credentials as Daxko |
| Login | submit button | Redirects to Daxko after success |

### Available Tabs
- Login
- Create a Login
- Forgot Password

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

*Last Updated: January 16, 2026*
*Verified via live browser testing with user credentials*
