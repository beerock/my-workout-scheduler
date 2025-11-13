# YMCA Daxko Booking Flow - Confirmed

## Complete 3-Step Booking Process

Based on actual screenshots and testing, the YMCA Daxko booking process works as follows:

### Step 1: Find and Click RESERVE on Class List
- Navigate to class schedule page
- Find target class by name and time
- Click RESERVE button on class row
- **Result:** Navigates to class description/reservation page

### Step 2: Class Description Page
**Page shows:**
- Class details (name, location, time, duration)
- "Select Group Members for Reservation" section
- **"Active Members"** or **"Active Members (Accepting Spot in WaitList)"** header
- If full: Orange warning banner: "Reservation Spots are full. Any one Active Member can Join Waitlist."
- User's name (e.g., "Brock Busby") with unchecked checkbox
- BACK button
- **RESERVE button (Note: button ALWAYS says "RESERVE" even when joining waitlist!)**

**Required Actions:**
1. ✅ **Select checkbox next to user's name** (critical step!)
2. ✅ Click RESERVE button (will book or waitlist depending on availability)

**Result:** Navigates to confirmation page

### Step 3: Confirmation Page

**For Successful Booking:**
- **"Awesome!"** heading
- Green checkmark icon
- **"Now that reservation is complete, you can..."** text
- Class details and booked user's name
- Options: "Add to Calendar", "Edit", "BROWSE MORE CLASSES", "VIEW MY APPOINTMENTS"

**For Waitlist Addition:**
- **"Awesome!"** heading
- Green checkmark icon
- **"Now that you are in waitlist, you can..."** text
- Class details and waitlisted user's name
- Options: "Add to Calendar", "Edit", "BROWSE MORE CLASSES", "VIEW MY APPOINTMENTS"

## Implementation Requirements

### Checkbox Selection
```typescript
// After navigating to class description page
// Find and click the checkbox next to user's name

const checkboxSelectors = [
  'input[type="checkbox"]',
  'input[type="checkbox"][name*="member"]',
]

for (const checkbox of checkboxes) {
  const isChecked = await page.evaluate(el => el.checked, checkbox)
  if (!isChecked) {
    await checkbox.click()
    break
  }
}
```

### Confirmation Detection Keywords
Based on actual confirmation pages:
- **Waitlist:** `"now that you are in waitlist"`, `"you are in waitlist"`, `"added to waitlist"`
- **Booking:** `"now that reservation is complete"`, `"reservation is complete"`
- **Note:** Always check for waitlist text first, then booking text

## Code Implementation ✅

Location: `scripts/booking-automation.ts` function `findAndBookClass()`

**Completed Steps:**
1. ✅ After first RESERVE button click → wait for navigation
2. ✅ Find and click user checkbox on description page
3. ✅ Check page content for "Accepting Spot in WaitList" to detect if class is full
4. ✅ Find and click RESERVE button (always says "RESERVE" regardless of booking vs waitlist)
5. ✅ Wait for confirmation page
6. ✅ Detect waitlist using "Now that you are in waitlist" keyword
7. ✅ Detect booking using "Now that reservation is complete" keyword

## Testing Checklist

- [ ] Checkbox is found and clicked
- [ ] Second RESERVE button is clicked
- [ ] Confirmation page shows "Awesome!" text
- [ ] Status correctly returned as "confirmed"
- [ ] Database records booking attempt
- [ ] Class shows as RESERVED on gym website

