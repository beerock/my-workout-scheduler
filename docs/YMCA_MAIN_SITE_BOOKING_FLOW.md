# YMCA Main Site Booking Flow (GroupExPro)

## Overview

The YMCA main site (ymcawnc.org) uses **GroupExPro.com** for class registration, NOT the current Daxko system. This is a completely different booking platform that requires separate Puppeteer automation code.

---

## URL Structure

### Schedule Page
```
https://www.ymcawnc.org/schedules?date=YYYY-MM-DD&locations=&categories=&cn=&inst=&room=
```

**Query Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `date` | Date in YYYY-MM-DD format | `2026-01-16` |
| `locations` | Filter by location ID | (numeric ID) |
| `categories` | Filter by category | |
| `cn` | Class name filter | |
| `inst` | Instructor filter | |
| `room` | Room filter | |

### Booking URL (GroupExPro)
```
https://www.groupexpro.com/gxp/reservations/start/index/{CLASS_ID}/{MM}/{DD}/{YYYY}?type=responsive
```

**Example:**
```
https://www.groupexpro.com/gxp/reservations/start/index/14747720/01/16/2026?type=responsive
```

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

Each class card on the schedule page displays:
- **Time** (e.g., "5:45am")
- **Duration** (e.g., "45min")
- **Class name** (e.g., "Cycle")
- **Category** (e.g., "Cardio")
- **Location** (e.g., "Reuter Family YMCA Cycle Studio")
- **Instructor name**
- **Availability** (e.g., "5 spots left")
- **Register button** → links to GroupExPro

### Date Navigation
- Arrow buttons for previous/next date
- Displays current date (e.g., "Fri, Jan 16")

---

## Booking Flow

### Step 1: Navigate to Schedule
Go to `https://www.ymcawnc.org/schedules` with appropriate date/location filters.

### Step 2: Click Register
The Register link on a class card redirects to GroupExPro:
```
https://www.groupexpro.com/gxp/reservations/start/index/{CLASS_ID}/{MM}/{DD}/{YYYY}?type=responsive
```

### Step 3: Login (GroupExPro)
URL redirects to login page:
```
https://www.groupexpro.com/gxp/auth/login/reservations-start-index-{CLASS_ID}-{MM}-{DD}-{YYYY}?c=1&e=0&type=responsive
```

### Step 4: Complete Booking
After login, user is redirected back to complete the reservation.

---

## Login Flow (GroupExPro)

**Single-step login** (unlike Daxko's 2-step flow):

### Form Elements
| Element | Selector | Type |
|---------|----------|------|
| Email | `textbox "Email" [type="text"]` | text input |
| Password | `textbox [type="password"]` | password input |
| Submit | `button "Login" [type="submit"]` | button |

### Available Tabs
- Login
- Create a Login
- Forgot Password

---

## Key Differences: Daxko vs GroupExPro

| Aspect | Daxko (Current) | GroupExPro (New) |
|--------|-----------------|------------------|
| Schedule URL | ops1.operations.daxko.com | ymcawnc.org/schedules |
| Booking Platform | Daxko | groupexpro.com |
| Login Steps | 2-step (email → password) | 1-step (email + password) |
| Login URL | /Online/4032/Security/login.mvc | /gxp/auth/login/... |
| Branch Selection | Dropdown on schedule page | Checkboxes on YMCA site |
| Class ID Format | Internal Daxko ID | Numeric ID in URL path |
| URL Pattern | Fixed URL | Dynamic URL with class ID & date |
| **Credential System** | **Daxko account** | **Separate GroupExPro account** |

---

## Implementation Notes

### Credential Migration
- Users currently have Daxko credentials stored
- GroupExPro uses a **separate account system**
- Users may need to create GroupExPro accounts or link existing YMCA accounts
- **TODO:** Verify if existing YMCA credentials work with GroupExPro

### Puppeteer Automation Requirements
The new automation will need to:
1. Navigate to `ymcawnc.org/schedules`
2. Apply date and location filters via URL params
3. Find target class by name/time
4. Click Register → redirects to GroupExPro
5. Handle login on GroupExPro (single-step form)
6. Complete booking on GroupExPro
7. Detect confirmation

### Direct Booking URL Construction
If we know the class ID, we can construct the booking URL directly:
```
https://www.groupexpro.com/gxp/reservations/start/index/{CLASS_ID}/{MM}/{DD}/{YYYY}?type=responsive
```

**Challenge:** We need to map class names/times to GroupExPro class IDs. This mapping may require:
- Scraping the schedule page to extract class IDs from Register links
- Building a lookup table of class IDs
- Or always navigating through the schedule page

---

## Open Questions

1. Do existing YMCA member credentials work with GroupExPro?
2. How do we obtain GroupExPro class IDs programmatically?
3. Is there a booking window (e.g., 26 hours before) on GroupExPro?
4. What does the confirmation page look like after successful booking?

---

*Last Updated: January 16, 2026*
