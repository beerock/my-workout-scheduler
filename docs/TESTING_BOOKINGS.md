# Testing Bookings Guide

This guide walks you through safely testing the booking automation before running it in production.

## Prerequisites

Before testing:
- [ ] Database has at least one active class
- [ ] Gym credentials are saved in the database
- [ ] Class has booking window open (or adjust booking_window_hours for testing)
- [ ] You have a way to cancel the booking if needed

## Testing Steps

### Step 1: Verify Setup

Run the dry-run test to verify everything is configured:

```bash
npm run test:booking-dry-run
```

This should show:
- ✅ Classes found
- ✅ Password decryption works
- ✅ All parameters are correct

### Step 2: Find a Class ID

Get the ID of a class you want to test:

```bash
npm run test:database-helpers
```

Look for the class you want to test and note its ID (UUID).

### Step 3: Test with Non-Headless Browser (Recommended)

Run the test script with the browser visible so you can see what's happening:

```bash
npx tsx scripts/test-single-booking.ts <class-id> --headless=false
```

Replace `<class-id>` with the actual UUID from Step 2.

**What to watch for:**
- Does it navigate to the gym URL correctly?
- Does login work?
- Does branch selection work?
- Can it find the class?
- Does the booking button exist?

### Step 4: Test with Dry-Run First

Before making a real booking, test the flow without actually clicking:

```bash
npx tsx scripts/test-single-booking.ts <class-id> --dry-run
```

This simulates the entire process without making changes.

### Step 5: Make a Real Test Booking

⚠️ **Warning**: This will make a REAL booking!

```bash
npx tsx scripts/test-single-booking.ts <class-id>
```

**Before running:**
- Make sure it's a class you can safely cancel
- Verify the booking window is open
- Have the gym website open in another tab to verify the booking

### Step 6: Verify Results

1. **Check the console output** - Should show status (confirmed/waitlisted/failed)
2. **Check the database** - Query `booking_attempts` table:
   ```sql
   SELECT * FROM booking_attempts 
   ORDER BY attempt_timestamp DESC 
   LIMIT 1;
   ```
3. **Check the gym website** - Log in and verify the booking appears
4. **Check screenshots** - If it failed, review screenshots in `screenshots/` folder

## Troubleshooting

### "Class not found"

- Verify the class ID is correct (copy from database)
- Check the class exists and is active

### "Login failed"

**Possible causes:**
- Wrong username/password in database
- Gym website structure changed
- Website is down

**Solutions:**
- Verify credentials in database
- Test login manually on gym website
- Review screenshot `02-login-failed.png`
- Update selectors in `scripts/booking-automation.ts` if needed

### "Branch selection failed"

**Possible causes:**
- Branch name doesn't match exactly
- Branch dropdown structure changed

**Solutions:**
- Check available branches in error message
- Verify branch name in database matches gym website
- Review screenshot `04-branch-selection-failed.png`
- Update branch name in database if needed

### "Class not found on schedule"

**Possible causes:**
- Class doesn't exist on target day
- Class time doesn't match
- Class type name doesn't match exactly
- Wrong branch selected

**Solutions:**
- Verify class exists on gym website for that day/time
- Check class type name matches exactly (case-sensitive)
- Review screenshot `05-schedule-page.png`
- Verify branch is correct

### "Booking button not found"

**Possible causes:**
- Button text changed
- Button selector changed
- Class already booked

**Solutions:**
- Review screenshot `06-after-booking-attempt.png`
- Check if class shows "RESERVED" (already booked)
- Update button selectors in `scripts/booking-automation.ts` if needed

## Adjusting Selectors

If the gym website structure is different, you may need to update selectors in `scripts/booking-automation.ts`:

### Login Selectors

Look for these functions and update selectors:
- `performLogin()` - Username/password fields, login button
- `selectBranch()` - Branch dropdown selector
- `navigateToDay()` - Day navigation buttons/tabs
- `findAndBookClass()` - Class rows, booking buttons

### Testing Selector Changes

1. Run with `--headless=false` to see the browser
2. Take note of the actual HTML structure
3. Update selectors in the code
4. Test again

## Safe Testing Practices

1. **Start with a test class**
   - Use a class you can easily cancel
   - Test during off-peak hours if possible

2. **Use non-headless mode first**
   - See exactly what's happening
   - Catch issues before they cause problems

3. **Check screenshots**
   - All screenshots are saved in `screenshots/` folder
   - Review them to understand what the script sees

4. **Monitor the database**
   - Check `booking_attempts` table after each test
   - Verify status and error messages

5. **Test incrementally**
   - First: Dry-run
   - Second: Non-headless (see what happens)
   - Third: Real booking (if everything looks good)

## Common Test Scenarios

### Scenario 1: Test Login Only

To test just the login process, you can temporarily modify the script to stop after login.

### Scenario 2: Test Branch Selection

Create a test class with a known branch, run the test, and verify branch selection works.

### Scenario 3: Test Class Finding

Use a class that definitely exists on the schedule and verify the script can find it.

### Scenario 4: Test Booking Button States

Test with classes in different states:
- Available (RESERVE button)
- Full with waitlist (ADD TO WAITLIST button)
- Already reserved (RESERVED status)
- Full without waitlist (FULL status)

## Next Steps After Testing

Once testing is successful:

1. ✅ Verify all selectors work for your gym website
2. ✅ Test with multiple classes
3. ✅ Test with different branches
4. ✅ Set up GitHub Actions (see [GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md))
5. ✅ Monitor first few automated runs
6. ✅ Check booking_attempts table regularly

## Getting Help

If you encounter issues:

1. **Check screenshots** - They show exactly what the script sees
2. **Review error messages** - They often indicate what went wrong
3. **Test manually** - Try the same steps manually on the gym website
4. **Check database** - Verify all data is correct
5. **Update selectors** - Gym websites change, selectors may need updates

## Example Test Session

```bash
# 1. Verify setup
npm run test:booking-dry-run

# 2. Get class ID (from output)
# Example: a02ef692-1933-46b0-a77c-7258a577a5b5

# 3. Test with visible browser
npx tsx scripts/test-single-booking.ts a02ef692-1933-46b0-a77c-7258a577a5b5 --headless=false

# 4. If everything looks good, make real booking
npx tsx scripts/test-single-booking.ts a02ef692-1933-46b0-a77c-7258a577a5b5

# 5. Check results
# - Console output shows status
# - Database has booking_attempts record
# - Gym website shows booking
```

Good luck with testing! 🚀

