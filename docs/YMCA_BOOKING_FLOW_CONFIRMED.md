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
- **"Active Members"** list with checkboxes
- User's name (e.g., "Brock Busby") with unchecked checkbox
- BACK button
- RESERVE button (or WAITLIST if class is full)

**Required Actions:**
1. ✅ **Select checkbox next to user's name** (critical step!)
2. ✅ Click RESERVE button (or WAITLIST button if class is full)

**Result:** Navigates to confirmation page

### Step 3: Confirmation Page
**Page shows:**
- **"Awesome!"** heading
- Green checkmark icon
- Class details
- User's name who booked
- **"Now that reservation is complete, you can..."** text
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
Based on actual confirmation page:
- **Primary:** `"awesome!"` (exact text on confirmation page)
- **Primary:** `"now that reservation is complete"` (exact text on confirmation page)
- **Secondary:** `"reservation is complete"`
- **Fallback:** `"reserved"`, `"booking confirmed"`

## Code Updates Needed

Location: `scripts/booking-automation.ts` function `findAndBookClass()`

1. After first RESERVE button click → wait for navigation
2. **NEW:** Find and click user checkbox on description page
3. Find and click second RESERVE/WAITLIST button
4. Wait for confirmation page
5. Detect confirmation using "Awesome!" and "Now that reservation is complete" keywords

## Testing Checklist

- [ ] Checkbox is found and clicked
- [ ] Second RESERVE button is clicked
- [ ] Confirmation page shows "Awesome!" text
- [ ] Status correctly returned as "confirmed"
- [ ] Database records booking attempt
- [ ] Class shows as RESERVED on gym website

