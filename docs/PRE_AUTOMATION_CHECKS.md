# Quick Pre-Automation Checks

**Purpose:** Verify critical database queries and logic before building automation  
**Time:** ~10 minutes  
**Tools:** Supabase SQL Editor, Browser Console

---

## Check 1: Database Query Test

**Goal:** Verify we can query for classes that need booking right now.

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click "SQL Editor" in left sidebar
3. Click "New query"

### Step 2: Run Test Query

**Query to find classes needing booking:**
```sql
-- Get classes that should be booked right now
SELECT 
  rc.id,
  rc.user_id,
  rc.day_of_week,
  rc.class_time,
  rc.class_type,
  rc.branch,
  rc.booking_window_hours,
  rc.timezone,
  rc.active,
  rc.next_skip_date,
  gc.gym_url,
  gc.username,
  COALESCE(us.schedule_paused, false) as schedule_paused
FROM recurring_classes rc
JOIN gym_credentials gc ON rc.user_id = gc.user_id
LEFT JOIN user_settings us ON rc.user_id = us.user_id
WHERE rc.active = true
  AND (us.schedule_paused IS NULL OR us.schedule_paused = false)
  AND (rc.next_skip_date IS NULL OR rc.next_skip_date != CURRENT_DATE)
ORDER BY rc.user_id, rc.day_of_week, rc.class_time;
```

**What to verify:**
- ✅ Query runs without errors
- ✅ Returns your test classes (if any are active)
- ✅ Excludes classes where `active = false`
- ✅ Excludes classes where user has `schedule_paused = true`
- ✅ All required fields are present (gym_url, username, etc.)

### Step 3: Test Skip Date Logic

**Query to test skip date filtering:**
```sql
-- Test: Classes with skip date set for today should be excluded
-- First, manually set a skip date for testing:
UPDATE recurring_classes 
SET next_skip_date = CURRENT_DATE 
WHERE id = 'YOUR_CLASS_ID_HERE';

-- Then run the main query again - that class should NOT appear
-- (Use the query from Step 2)

-- Clean up: Clear the skip date
UPDATE recurring_classes 
SET next_skip_date = NULL 
WHERE id = 'YOUR_CLASS_ID_HERE';
```

**What to verify:**
- ✅ When `next_skip_date = CURRENT_DATE`, class is excluded
- ✅ When `next_skip_date = NULL`, class appears (if other conditions met)
- ✅ When `next_skip_date` is in the future, class appears

---

## Check 2: Date Calculation Sanity Check

**Goal:** Verify `calculateNextOccurrence` returns correct dates.

### Step 1: Open Browser Console
1. Go to your schedule page: `http://localhost:3000/dashboard/schedule`
2. Open browser DevTools (F12)
3. Go to Console tab

### Step 2: Test Date Calculation

**Paste this in console:**
```javascript
// Import the function (you'll need to access it from the page)
// Actually, let's test it via the UI instead:

// Click "Skip Next" on a class
// Check what date it shows in the badge
// Verify it's the correct next occurrence

// Or test manually:
const now = new Date();
const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
console.log('Today:', now.toLocaleDateString(), 'Day:', currentDay);

// For a Monday class (day 1):
const dayOfWeek = 1;
const daysUntilNext = (dayOfWeek - currentDay + 7) % 7;
const daysToAdd = daysUntilNext === 0 ? 7 : daysUntilNext;
const nextDate = new Date(now);
nextDate.setDate(now.getDate() + daysToAdd);
console.log('Next Monday:', nextDate.toLocaleDateString());
console.log('Days to add:', daysToAdd);
```

**What to verify:**
- ✅ If today is Saturday and class is Monday, it calculates next Monday (2 days)
- ✅ If today is Monday and class is Monday, it calculates NEXT Monday (7 days, not today)
- ✅ Date format is correct (YYYY-MM-DD when stored)

### Step 3: Test Booking Window Calculation

**In browser console:**
```javascript
// Test booking window calculation
function calculateBookingWindowOpen(classDate, classTime, bookingWindowHours) {
  const [hours, minutes] = classTime.split(':').map(Number);
  const [year, month, day] = classDate.split('-').map(Number);
  
  const classDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
  const bookingWindowOpen = new Date(classDateTime);
  bookingWindowOpen.setHours(bookingWindowOpen.getHours() - bookingWindowHours);
  
  return bookingWindowOpen;
}

// Example: Monday Nov 10 at 4:15 PM, 26 hour window
const result = calculateBookingWindowOpen('2024-11-10', '16:15:00', 26);
console.log('Class:', '2024-11-10 4:15 PM');
console.log('Booking window opens:', result.toLocaleString());
console.log('Should be:', 'Sunday Nov 9 at 2:15 PM');
```

**What to verify:**
- ✅ Booking window opens at correct time (class time - hours)
- ✅ Handles day rollover correctly (e.g., Monday 4:15 PM - 26 hours = Sunday 2:15 PM)
- ✅ Timezone doesn't cause issues

---

## Check 3: Skip Date Logic Test

**Goal:** Verify automation can check and clear skip dates.

### Step 1: Test Skip Date Check Query

**In Supabase SQL Editor:**
```sql
-- Find classes with skip date set for today
SELECT 
  id,
  class_type,
  day_of_week,
  class_time,
  next_skip_date,
  CASE 
    WHEN next_skip_date = CURRENT_DATE THEN 'SKIP TODAY'
    WHEN next_skip_date IS NULL THEN 'NO SKIP'
    WHEN next_skip_date > CURRENT_DATE THEN 'SKIP FUTURE'
    ELSE 'SKIP PAST'
  END as skip_status
FROM recurring_classes
WHERE next_skip_date IS NOT NULL
ORDER BY next_skip_date;
```

**What to verify:**
- ✅ Query correctly identifies classes with `next_skip_date = CURRENT_DATE`
- ✅ Can distinguish between today, future, and past skip dates

### Step 2: Test Skip Date Clearing

**In Supabase SQL Editor:**
```sql
-- Simulate what automation will do:
-- 1. Find classes with skip date = today
SELECT id, class_type, next_skip_date
FROM recurring_classes
WHERE next_skip_date = CURRENT_DATE;

-- 2. Clear the skip date (automation will do this after processing)
UPDATE recurring_classes
SET next_skip_date = NULL
WHERE next_skip_date = CURRENT_DATE;

-- 3. Verify it's cleared
SELECT id, class_type, next_skip_date
FROM recurring_classes
WHERE id IN (SELECT id FROM recurring_classes WHERE next_skip_date IS NULL);
```

**What to verify:**
- ✅ Can find classes with skip date = today
- ✅ Can clear the skip date
- ✅ After clearing, class appears in normal booking queries

### Step 3: Test Skip Date in Booking Query

**In Supabase SQL Editor:**
```sql
-- This is the actual query automation will use
-- It should EXCLUDE classes where next_skip_date = CURRENT_DATE

SELECT 
  rc.id,
  rc.class_type,
  rc.next_skip_date,
  CASE 
    WHEN rc.next_skip_date = CURRENT_DATE THEN 'WILL BE SKIPPED'
    ELSE 'WILL BE BOOKED'
  END as action
FROM recurring_classes rc
JOIN gym_credentials gc ON rc.user_id = gc.user_id
LEFT JOIN user_settings us ON rc.user_id = us.user_id
WHERE rc.active = true
  AND (us.schedule_paused IS NULL OR us.schedule_paused = false)
  AND (rc.next_skip_date IS NULL OR rc.next_skip_date != CURRENT_DATE);
```

**What to verify:**
- ✅ Classes with `next_skip_date = CURRENT_DATE` are NOT in results
- ✅ Classes with `next_skip_date = NULL` ARE in results (if other conditions met)
- ✅ Classes with `next_skip_date` in future ARE in results

---

## Check 4: Integration Test (Optional but Recommended)

**Goal:** Test the full logic flow that automation will use.

### Create a Test Script

**Create `scripts/test-booking-query.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for automation
)

async function testBookingQuery() {
  console.log('Testing booking query...\n')
  
  // Get current date/time
  const now = new Date()
  console.log('Current time:', now.toISOString())
  console.log('Current date:', now.toISOString().split('T')[0])
  
  // Query for classes needing booking
  const { data: classes, error } = await supabase
    .from('recurring_classes')
    .select(`
      *,
      gym_credentials!inner(gym_url, username),
      user_settings(schedule_paused)
    `)
    .eq('active', true)
    .or('next_skip_date.is.null,next_skip_date.neq.' + now.toISOString().split('T')[0])
  
  if (error) {
    console.error('Query error:', error)
    return
  }
  
  // Filter out paused users (can't do this easily in query with RLS)
  const { data: pausedUsers } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('schedule_paused', true)
  
  const pausedUserIds = new Set(pausedUsers?.map(u => u.user_id) || [])
  
  const activeClasses = classes?.filter(c => 
    !pausedUserIds.has(c.user_id) &&
    (c.user_settings?.[0]?.schedule_paused !== true)
  ) || []
  
  console.log(`Found ${activeClasses.length} classes needing booking:`)
  activeClasses.forEach(c => {
    console.log(`- ${c.class_type} on day ${c.day_of_week} at ${c.class_time}`)
  })
  
  console.log('\n✅ Query test complete!')
}

testBookingQuery().catch(console.error)
```

**Run it:**
```bash
npx tsx scripts/test-booking-query.ts
```

**What to verify:**
- ✅ Script runs without errors
- ✅ Returns correct classes
- ✅ Excludes paused users
- ✅ Excludes skipped classes
- ✅ All required data is present

---

## Summary Checklist

After running all checks, verify:

- [ ] Database query returns correct classes
- [ ] Skip date filtering works (excludes today's skips)
- [ ] Date calculations are correct (next occurrence, booking window)
- [ ] Can clear skip dates after processing
- [ ] Pause logic works (excludes paused users)
- [ ] Active toggle works (excludes inactive classes)

**If all checks pass, you're ready to build automation!** ✅

---

## Common Issues & Fixes

**Issue:** Query returns no results
- **Check:** Do you have active classes? Is schedule_paused false?
- **Fix:** Create a test class, ensure it's active

**Issue:** Skip date not filtering correctly
- **Check:** Is `next_skip_date` stored as DATE type (not TIMESTAMP)?
- **Fix:** Verify column type in Supabase table editor

**Issue:** Date calculations off by one day
- **Check:** Timezone handling in date functions
- **Fix:** Use local time components (already fixed in code)

**Issue:** Can't access service role key
- **Check:** Do you have the service role key from Supabase?
- **Fix:** Get it from Supabase Dashboard → Settings → API → service_role key

---

**Ready to proceed?** If all checks pass, you can start building the Puppeteer automation script!

