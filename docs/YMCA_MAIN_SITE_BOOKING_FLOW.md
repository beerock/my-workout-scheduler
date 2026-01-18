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

### Pagination

**CRITICAL:** YMCA schedule has TWO navigation elements with similar arrows:

| Location | Element | Class | Purpose |
|----------|---------|-------|---------|
| **TOP** | `< Mon, Jan 19 >` | `.schedule-dashboard__arrow` | Changes DATE (day navigation) |
| **BOTTOM** | `|< < Page 1 of 2 > >|` | `.schedule-dashboard__pager--next` | Changes PAGE (class list) |

**Always use the BOTTOM pagination** (`.schedule-dashboard__pager--next`) to find classes on later pages. Using the top arrows will navigate to a different day!

**Post-pagination behavior:**
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

### Comprehensive Test Results

All 5 class states tested and verified:

| # | Scenario | Test Class | Result | Notes |
|---|----------|------------|--------|-------|
| 1 | **Register** | Strength Fusion Mon 8am @ Woodfin | `CONFIRMED` ✅ | Full booking flow completed |
| 2 | **Waitlist** | Racquetball Mon 9:30am @ Asheville | `WAITLISTED` ✅ | Added to waitlist successfully |
| 3 | **Full** | BODYPUMP Mon 6am @ Asheville | `FAILED` ✅ | Detected as full, retry message shown |
| 4 | **Cancelled** | BODYBALANCE Mon 7:15am @ Asheville | `FAILED` ✅ | Detected "CANCELED:" prefix, stopped before login |
| 5 | **Not Reservable** | Power Moves Mon 1pm @ Asheville | `FAILED` ✅ | Detected no CTA (PAID PROGRAM class) |
| 6 | **Pagination** | Racquetball Mon 2pm @ Asheville | `WAITLISTED` ✅ | Found on page 2 using correct pagination |

### Original Test
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

### Time Matching Gotcha

**CRITICAL:** Use word boundary regex when matching times!

```typescript
// ❌ BAD - "12:00pm" will match "2:00pm" as substring
text.includes('2:00pm')

// ✅ GOOD - Word boundary prevents false matches
new RegExp('\\b2:00pm\\b').test(text)
```

Without word boundaries, searching for "2:00pm" will incorrectly match "12:00pm" because "2:00pm" is a substring of "12:00pm".

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

## Performance Optimization (January 18, 2026)

### Problem Discovery

During real-world testing, we discovered a critical performance issue:

| Metric | Target | Actual |
|--------|--------|--------|
| Total booking time | <60s | **90-120s** |
| Popular class fill time | ~90s | N/A |

**Real-World Impact:** A class opened with 30 spots. By the time automation completed (~90s), only 1 spot remained. User had to manually book.

### Root Cause Analysis

Time breakdown revealed the bottleneck was NOT our automation code:

| Phase | Time | Location |
|-------|------|----------|
| GitHub Actions queue | 10-20s | GitHub |
| Checkout + Node setup | 10-20s | GitHub |
| **npm ci** | **15-25s** | **GitHub** |
| **Puppeteer download** | **15-25s** | **GitHub** |
| Puppeteer automation | 32-40s | Our code |
| **TOTAL** | **90-120s** | |

**Key Insight:** The automation code was fast (32-40s). The overhead was GitHub Actions cold start—downloading dependencies on every run.

### Solution: Dependency Caching

Implemented caching for both `node_modules` and Puppeteer browsers:

```yaml
- name: Cache node_modules and Puppeteer
  uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.cache/puppeteer
    key: ${{ runner.os }}-deps-${{ hashFiles('package-lock.json') }}

- name: Install dependencies
  if: steps.cache-deps.outputs.cache-hit != 'true'
  run: npm ci

- name: Ensure Puppeteer browsers installed
  run: npx puppeteer browsers install chrome
```

**Important:** Must cache `~/.cache/puppeteer` separately—Puppeteer stores Chrome outside `node_modules`.

### Results

| Metric | Before | After (Cache Hit) |
|--------|--------|-------------------|
| Total booking time | 90-120s | **~60s** |
| Cold start overhead | 50-80s | **~20s** |
| Cache restore | N/A | ~10s |

✅ Now meets <60s KPI target on cache hits.

### Gotcha: Initial Fix Attempt Failed

First attempt only cached `node_modules`, which caused:
```
Could not find Chrome (ver. 143.0.7499.169)
```

Puppeteer installs Chrome to `~/.cache/puppeteer`, not `node_modules`. When `npm ci` was skipped on cache hit, the postinstall script that downloads Chrome never ran.

**Fix:** Cache both directories AND always run `npx puppeteer browsers install chrome` (fast when already cached).

### Future Optimization Options

If <60s still insufficient for highly competitive classes:

| Option | Expected Time | Cost |
|--------|---------------|------|
| Pre-built Docker image | ~30s | Free |
| Always-on worker (Railway/Render) | ~10s | $5-15/mo |

See `docs/STRATEGIC_PLAN.md` Part 9 for full analysis.

---

*Last Updated: January 18, 2026*
*Verified via comprehensive testing - All 5 class states + pagination tested*
*Performance optimization implemented - 60s booking time achieved*
