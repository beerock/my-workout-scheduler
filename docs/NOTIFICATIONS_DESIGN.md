# Notification System Design

**Last Updated:** November 28, 2025 (v2.10)

This document defines the notification system for booking results, including when to send notifications, email templates, SMS templates, and user preferences.

---

## Table of Contents

1. [Notification Strategy](#notification-strategy)
2. [When to Send Notifications](#when-to-send-notifications)
3. [Email Templates](#email-templates)
4. [SMS Templates](#sms-templates-optional)
5. [User Preferences](#user-preferences)
6. [Notification Frequency & Batching](#notification-frequency--batching)
7. [Implementation Notes](#implementation-notes)

---

## Notification Strategy

### Goals
- **Inform users of booking results** without overwhelming them
- **Reduce anxiety** by explaining what's happening and what's next
- **Drive action** when user intervention is needed
- **Build trust** through transparency and reliability

### Principles
1. **Default to more information** rather than less (users can opt out)
2. **Be immediate** for successes and critical failures
3. **Be patient** for temporary failures (batch retries)
4. **Be clear** about what action is needed (if any)
5. **Respect user preferences** for notification frequency

---

## When to Send Notifications

### Decision Matrix

| Scenario | Send Email? | When? | SMS? | Priority |
|----------|-------------|-------|------|----------|
| **Success (Confirmed)** | ✅ Yes | Immediately | Optional | High |
| **Success (Waitlisted)** | ✅ Yes | Immediately | Optional | High |
| **Already Reserved** | ✅ Yes | Immediately | No | Low |
| **Class Full (Retrying)** | ✅ Yes | After first failure only | No | Medium |
| **Class Full (Final Failure)** | ✅ Yes | When retries exhausted | Optional | Medium |
| **Booking Window Not Open** | ⚠️ Maybe | Only if fails after fast retry | No | Low |
| **Cancelled Class** | ✅ Yes | Immediately | Optional | High |
| **Not Reservable** | ✅ Yes | Immediately | No | Medium |
| **Class Not Found** | ✅ Yes | Immediately | No | Medium |
| **Login Failed** | ✅ Yes | Immediately | Optional | High |
| **Time Conflict** | ✅ Yes | Immediately | No | Medium |
| **Technical Errors** | ✅ Yes | After 2nd consecutive failure | No | Medium |
| **Intentional Skip** | ❌ No | N/A | No | None |

### Notification Rules

**Immediate Notifications (within 1 minute):**
- ✅ Booking confirmed
- ✅ Waitlist confirmed
- ❌ Class cancelled (action required)
- ❌ Login failed (action required)
- ❌ Class not found (action recommended)

**Batched Notifications (daily digest):**
- Class full (retrying) - send once per day if still retrying
- Technical errors - batch multiple errors together
- Already reserved - include in success digest

**Never Notify:**
- Intentional skips (user already knows)
- Booking window not open (if fast retry succeeds)
- Individual retry attempts (only first failure + final result)

---

## Email Templates

### Template Structure

All emails follow this structure:
```
Subject: [Status Icon] [Action Summary] - [Class Name]

Header:
[Status Banner with color-coded background]

Body:
1. What happened (plain language)
2. Why it happened (if relevant)
3. What happens next (automatic or manual)
4. Action steps (if needed)
5. CTA button (if action required)

Footer:
- View booking history link
- Update preferences link
- Support contact
```

---

### 1. Booking Confirmed ✅

**Subject:** ✅ Booked! [CLASS_NAME] on [DAY] at [TIME]

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Success Banner -->
  <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 28px;">✅ You're In!</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p style="font-size: 16px; color: #1f2937; margin-bottom: 15px;">
      <strong>Great news!</strong> We successfully booked your class:
    </p>

    <div style="background-color: white; padding: 15px; border-left: 4px solid #10b981; margin-bottom: 15px;">
      <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
        {{CLASS_NAME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        {{DAY_OF_WEEK}}, {{DATE}} at {{TIME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        📍 {{BRANCH_NAME}}
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
      Booked at: {{BOOKING_TIMESTAMP}}
    </p>
  </div>

  <!-- What's Next -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">What's next?</h2>
    <ul style="color: #4b5563; line-height: 1.6;">
      <li>Show up at {{TIME}} on {{DAY_OF_WEEK}}</li>
      <li>Check your gym account to confirm the reservation</li>
      <li>We'll automatically book this class again next week (if active)</li>
    </ul>
  </div>

  <!-- CTA Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_URL}}"
       style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      View Booking History
    </a>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>
      <a href="{{DASHBOARD_URL}}/schedule" style="color: #3b82f6;">Manage Schedule</a> •
      <a href="{{DASHBOARD_URL}}/settings" style="color: #3b82f6;">Notification Preferences</a>
    </p>
    <p style="margin-top: 10px;">
      My Workout Scheduler - Automated Class Booking
    </p>
  </div>

</body>
</html>
```

---

### 2. Waitlist Confirmed ⏳

**Subject:** ⏳ Waitlisted - [CLASS_NAME] on [DAY] at [TIME]

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Waitlist Banner -->
  <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 28px;">⏳ You're on the Waitlist</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p style="font-size: 16px; color: #92400e; margin-bottom: 15px;">
      <strong>Almost there!</strong> The class was full, but we added you to the waitlist:
    </p>

    <div style="background-color: white; padding: 15px; border-left: 4px solid #f59e0b; margin-bottom: 15px;">
      <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
        {{CLASS_NAME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        {{DAY_OF_WEEK}}, {{DATE}} at {{TIME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        📍 {{BRANCH_NAME}}
      </p>
    </div>

    <p style="font-size: 14px; color: #92400e; margin-top: 15px;">
      Joined waitlist at: {{BOOKING_TIMESTAMP}}
    </p>
  </div>

  <!-- What's Next -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">What happens next?</h2>
    <ul style="color: #4b5563; line-height: 1.6;">
      <li>If someone cancels, you'll automatically get their spot</li>
      <li>The gym will notify you directly if you get off the waitlist</li>
      <li>Check your gym account closer to class time for updates</li>
      <li>We'll keep booking this class for you next week</li>
    </ul>
  </div>

  <!-- Tips -->
  <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px; color: #1e40af;">
      <strong>💡 Tip:</strong> People often cancel 24-48 hours before class. Check your gym app regularly!
    </p>
  </div>

  <!-- CTA Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_URL}}"
       style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      View Booking History
    </a>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>
      <a href="{{DASHBOARD_URL}}/schedule" style="color: #3b82f6;">Manage Schedule</a> •
      <a href="{{DASHBOARD_URL}}/settings" style="color: #3b82f6;">Notification Preferences</a>
    </p>
    <p style="margin-top: 10px;">
      My Workout Scheduler - Automated Class Booking
    </p>
  </div>

</body>
</html>
```

---

### 3. Class Full (Retrying) 🔄

**Subject:** 🔄 Class Full - We're Keeping an Eye Out for You

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Retry Banner -->
  <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 28px;">🔄 We've Got This!</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p style="font-size: 16px; color: #1e3a8a; margin-bottom: 15px;">
      Your class is currently full, but <strong>we're automatically keeping watch</strong> for an opening:
    </p>

    <div style="background-color: white; padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 15px;">
      <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
        {{CLASS_NAME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        {{DAY_OF_WEEK}}, {{DATE}} at {{TIME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        📍 {{BRANCH_NAME}}
      </p>
    </div>
  </div>

  <!-- Automatic Retry Explanation -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">What we're doing:</h2>
    <ul style="color: #4b5563; line-height: 1.6;">
      <li><strong>Automatically checking every 15 minutes</strong> until the class starts</li>
      <li>If someone cancels, we'll grab that spot for you immediately</li>
      <li>You'll get a confirmation email if we successfully book it</li>
      <li><strong>No action needed from you</strong> - just sit back and relax!</li>
    </ul>
  </div>

  <!-- Status Info -->
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #4b5563;">
      <strong>First attempt:</strong> {{FIRST_ATTEMPT_TIME}}
    </p>
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #4b5563;">
      <strong>Status:</strong> Retrying every 15 minutes
    </p>
    <p style="margin: 0; font-size: 14px; color: #4b5563;">
      <strong>Will keep trying until:</strong> {{CLASS_START_TIME}}
    </p>
  </div>

  <!-- Alternative Options -->
  <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>Want to try a different time?</strong> You can add another class to your schedule as a backup.
    </p>
  </div>

  <!-- CTA Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_URL}}"
       style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      View Retry Status
    </a>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>
      <a href="{{DASHBOARD_URL}}/schedule" style="color: #3b82f6;">Manage Schedule</a> •
      <a href="{{DASHBOARD_URL}}/settings" style="color: #3b82f6;">Notification Preferences</a>
    </p>
    <p style="margin-top: 10px;">
      You'll receive an update when we book this class or when the class starts.
    </p>
  </div>

</body>
</html>
```

---

### 4. Class Cancelled ⚠️ (Action Required)

**Subject:** ⚠️ Action Required: [CLASS_NAME] Cancelled by Gym

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Alert Banner -->
  <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 28px;">⚠️ Class Cancelled</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p style="font-size: 16px; color: #991b1b; margin-bottom: 15px;">
      <strong>Important:</strong> This class has been cancelled by the gym and cannot be booked:
    </p>

    <div style="background-color: white; padding: 15px; border-left: 4px solid #dc2626; margin-bottom: 15px;">
      <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
        {{CLASS_NAME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        {{DAY_OF_WEEK}}, {{DATE}} at {{TIME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        📍 {{BRANCH_NAME}}
      </p>
    </div>
  </div>

  <!-- Why This Happens -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">Why classes get cancelled:</h2>
    <ul style="color: #4b5563; line-height: 1.6;">
      <li>Instructor is unavailable (sick, vacation, etc.)</li>
      <li>Low attendance led to cancellation</li>
      <li>The gym permanently removed this class from their schedule</li>
      <li>Class was rescheduled to a different day or time</li>
    </ul>
  </div>

  <!-- Action Required -->
  <div style="background-color: #fff7ed; padding: 15px; border-radius: 6px; border-left: 4px solid #ea580c; margin-bottom: 20px;">
    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #9a3412;">
      🔧 Action Required
    </h3>
    <p style="margin: 0; font-size: 14px; color: #9a3412; line-height: 1.6;">
      <strong>You need to remove or update this class in your schedule.</strong> We cannot book cancelled classes, and the system will keep failing until you take action.
    </p>
  </div>

  <!-- Steps -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">What to do:</h2>
    <ol style="color: #4b5563; line-height: 1.8;">
      <li>Check your gym's website or app for class status updates</li>
      <li>Look for the class at a different time or day</li>
      <li>If not available, remove this class from your schedule (button below)</li>
      <li>Consider adding a different class as a replacement</li>
    </ol>
  </div>

  <!-- CTA Buttons -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_URL}}/schedule?highlight={{CLASS_ID}}"
       style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-bottom: 10px;">
      Remove This Class
    </a>
    <br>
    <a href="{{DASHBOARD_URL}}/schedule/add"
       style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      Add Different Class
    </a>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>
      <a href="{{DASHBOARD_URL}}/schedule" style="color: #3b82f6;">Manage Schedule</a> •
      <a href="{{DASHBOARD_URL}}/settings" style="color: #3b82f6;">Notification Preferences</a>
    </p>
  </div>

</body>
</html>
```

---

### 5. Login Failed 🔑 (Action Required)

**Subject:** 🔑 Action Required: Can't Log Into Your Gym Account

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Alert Banner -->
  <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 28px;">🔑 Login Failed</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p style="font-size: 16px; color: #991b1b; margin-bottom: 15px;">
      <strong>We couldn't log into your gym account.</strong> This means we can't book classes for you right now.
    </p>

    <div style="background-color: white; padding: 15px; border-left: 4px solid #dc2626; margin-bottom: 15px;">
      <p style="margin: 5px 0; color: #6b7280;">
        <strong>Gym:</strong> {{GYM_NAME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        <strong>Username:</strong> {{USERNAME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        <strong>Failed at:</strong> {{FAILURE_TIME}}
      </p>
    </div>
  </div>

  <!-- Why This Happens -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">Common causes:</h2>
    <ul style="color: #4b5563; line-height: 1.6;">
      <li>Your username or password is incorrect</li>
      <li>You recently changed your gym password</li>
      <li>Your gym account is locked or suspended</li>
      <li>The gym's website is temporarily down</li>
    </ul>
  </div>

  <!-- Action Required -->
  <div style="background-color: #fff7ed; padding: 15px; border-radius: 6px; border-left: 4px solid #ea580c; margin-bottom: 20px;">
    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #9a3412;">
      🔧 Action Required
    </h3>
    <p style="margin: 0; font-size: 14px; color: #9a3412; line-height: 1.6;">
      <strong>Update your gym credentials</strong> to resume automatic bookings.
    </p>
  </div>

  <!-- Steps -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">How to fix:</h2>
    <ol style="color: #4b5563; line-height: 1.8;">
      <li><strong>Test your login:</strong> Try logging into your gym website manually</li>
      <li>If you can't log in, reset your password on the gym website</li>
      <li>Once you can log in successfully, update your credentials in our system</li>
      <li>We'll automatically resume booking your classes</li>
    </ol>
  </div>

  <!-- CTA Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_URL}}/credentials"
       style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      Update Gym Credentials
    </a>
  </div>

  <!-- Security Note -->
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 12px; color: #4b5563;">
      🔒 <strong>Your credentials are encrypted and secure.</strong> We only use them to automate your bookings.
    </p>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>
      <a href="{{DASHBOARD_URL}}/schedule" style="color: #3b82f6;">Manage Schedule</a> •
      <a href="{{DASHBOARD_URL}}/settings" style="color: #3b82f6;">Notification Preferences</a>
    </p>
  </div>

</body>
</html>
```

---

### 6. Class Not Found 🔍 (Action Recommended)

**Subject:** 🔍 Can't Find Your Class - Check Your Settings

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Warning Banner -->
  <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 28px;">🔍 Class Not Found</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p style="font-size: 16px; color: #92400e; margin-bottom: 15px;">
      We couldn't find your class on the gym's schedule. This is usually a configuration issue.
    </p>

    <div style="background-color: white; padding: 15px; border-left: 4px solid #f59e0b; margin-bottom: 15px;">
      <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
        <strong>Looking for:</strong>
      </p>
      <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
        {{CLASS_NAME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        {{DAY_OF_WEEK}} at {{TIME}}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        📍 {{BRANCH_NAME}}
      </p>
    </div>
  </div>

  <!-- Common Causes -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">Why this happens:</h2>
    <ul style="color: #4b5563; line-height: 1.6;">
      <li>The class name doesn't match exactly (check for typos)</li>
      <li>The class time or day is incorrect</li>
      <li>The wrong branch is selected</li>
      <li>The gym no longer offers this class at this location</li>
    </ul>
  </div>

  <!-- How to Fix -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">How to fix this:</h2>
    <ol style="color: #4b5563; line-height: 1.8;">
      <li>Go to your gym's website and find the exact class listing</li>
      <li>Compare: class name, time, day, and branch</li>
      <li>Update your class settings to match <strong>exactly</strong></li>
      <li>Save and we'll try again at the next scheduled time</li>
    </ol>
  </div>

  <!-- Tips -->
  <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af;">
      <strong>💡 Tips for accurate class names:</strong>
    </p>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e40af; line-height: 1.6;">
      <li>Copy and paste the class name from the gym website</li>
      <li>Match capitalization and spacing exactly</li>
      <li>Our system handles minor typos, but major differences won't work</li>
    </ul>
  </div>

  <!-- CTA Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_URL}}/schedule?edit={{CLASS_ID}}"
       style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      Update Class Settings
    </a>
  </div>

  <!-- View Screenshot -->
  <div style="text-align: center; margin: 20px 0;">
    <a href="{{DASHBOARD_URL}}/history?attempt={{ATTEMPT_ID}}"
       style="color: #3b82f6; text-decoration: underline; font-size: 14px;">
      View screenshot to see what classes were found →
    </a>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>
      <a href="{{DASHBOARD_URL}}/schedule" style="color: #3b82f6;">Manage Schedule</a> •
      <a href="{{DASHBOARD_URL}}/settings" style="color: #3b82f6;">Notification Preferences</a>
    </p>
  </div>

</body>
</html>
```

---

### 7. Daily Digest (Multiple Results)

**Subject:** 📊 Daily Booking Summary - [X] Classes [STATUS]

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px;">📊 Your Booking Summary</h1>
    <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
      {{DATE_RANGE}}
    </p>
  </div>

  <!-- Summary Stats -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">

    <div style="background-color: #d1fae5; padding: 15px; border-radius: 6px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold; color: #065f46;">
        {{SUCCESS_COUNT}}
      </div>
      <div style="font-size: 12px; color: #065f46; margin-top: 5px;">
        Booked
      </div>
    </div>

    <div style="background-color: #fed7aa; padding: 15px; border-radius: 6px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold; color: #92400e;">
        {{RETRY_COUNT}}
      </div>
      <div style="font-size: 12px; color: #92400e; margin-top: 5px;">
        Retrying
      </div>
    </div>

    <div style="background-color: #fecaca; padding: 15px; border-radius: 6px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold; color: #991b1b;">
        {{FAILED_COUNT}}
      </div>
      <div style="font-size: 12px; color: #991b1b; margin-top: 5px;">
        Need Action
      </div>
    </div>

  </div>

  <!-- Success List -->
  {{#if successes}}
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">✅ Successfully Booked</h2>
    {{#each successes}}
    <div style="background-color: #f0fdf4; padding: 12px; border-left: 4px solid #10b981; margin-bottom: 8px; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold; color: #1f2937;">{{className}}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">{{dayTime}} • {{status}}</p>
    </div>
    {{/each}}
  </div>
  {{/if}}

  <!-- Retrying List -->
  {{#if retrying}}
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">🔄 Still Trying</h2>
    {{#each retrying}}
    <div style="background-color: #eff6ff; padding: 12px; border-left: 4px solid #3b82f6; margin-bottom: 8px; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold; color: #1f2937;">{{className}}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">{{dayTime}} • Checking every 15 min</p>
    </div>
    {{/each}}
  </div>
  {{/if}}

  <!-- Failed/Action Required List -->
  {{#if failures}}
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">⚠️ Need Your Attention</h2>
    {{#each failures}}
    <div style="background-color: #fef2f2; padding: 12px; border-left: 4px solid #dc2626; margin-bottom: 8px; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold; color: #1f2937;">{{className}}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">{{dayTime}}</p>
      <p style="margin: 5px 0 0 0; font-size: 13px; color: #991b1b;">{{errorSummary}}</p>
    </div>
    {{/each}}
  </div>
  {{/if}}

  <!-- CTA -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_URL}}"
       style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      View Full History
    </a>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>
      <a href="{{DASHBOARD_URL}}/schedule" style="color: #3b82f6;">Manage Schedule</a> •
      <a href="{{DASHBOARD_URL}}/settings" style="color: #3b82f6;">Notification Preferences</a>
    </p>
  </div>

</body>
</html>
```

---

## SMS Templates (Optional)

SMS notifications should be short (160 characters max) and only for critical events.

### When to Send SMS
- ✅ Booking confirmed (if user opted in)
- ⚠️ Login failed (if user opted in)
- ⚠️ Class cancelled (if user opted in)

### Templates

**Booking Confirmed:**
```
✅ Booked! {{CLASS_NAME}} on {{DAY}} at {{TIME}}. See you there! - My Workout Scheduler
```

**Login Failed:**
```
🔑 Can't log into your gym account. Update credentials at {{SHORT_URL}} - My Workout Scheduler
```

**Class Cancelled:**
```
⚠️ {{CLASS_NAME}} cancelled by gym. Remove from schedule at {{SHORT_URL}} - My Workout Scheduler
```

---

## User Preferences

### Preference Settings (Database Schema)

Add to `user_settings` table:

```sql
-- Notification preferences
notification_email BOOLEAN DEFAULT TRUE,
notification_sms BOOLEAN DEFAULT FALSE,
notification_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'daily_digest', 'critical_only'

-- Email settings
email_on_success BOOLEAN DEFAULT TRUE,
email_on_waitlist BOOLEAN DEFAULT TRUE,
email_on_failure BOOLEAN DEFAULT TRUE,
email_on_retry BOOLEAN DEFAULT TRUE, -- First failure only

-- SMS settings (optional)
sms_phone_number TEXT,
sms_on_success BOOLEAN DEFAULT FALSE,
sms_on_critical_failure BOOLEAN DEFAULT FALSE, -- Login, cancelled only
```

### Notification Frequency Options

| Option | Description | What Gets Sent |
|--------|-------------|----------------|
| **Immediate** (default) | Real-time notifications for every event | All successes, failures, and retries (first attempt only) |
| **Daily Digest** | One email per day with all results | Batched summary sent at 8 AM user's local time |
| **Critical Only** | Only urgent issues requiring action | Login failed, class cancelled, time conflict |
| **Off** | No email notifications | User checks dashboard manually |

### User Preference UI (Dashboard)

```
┌─────────────────────────────────────────┐
│  Notification Preferences               │
├─────────────────────────────────────────┤
│                                         │
│  Email Notifications                    │
│  ☑ Enable email notifications          │
│                                         │
│  Frequency:                             │
│  ○ Immediate (as they happen)           │
│  ● Daily Digest (8 AM summary)          │
│  ○ Critical Only (action required)      │
│  ○ Off (check dashboard manually)       │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  What to notify me about:               │
│  ☑ Successful bookings                  │
│  ☑ Waitlist confirmations               │
│  ☑ Class full (first attempt)           │
│  ☑ Booking failures                     │
│  ☐ Class already reserved (skip)        │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  SMS Notifications (Optional)           │
│  ☐ Enable SMS notifications             │
│                                         │
│  Phone: [_____________]                 │
│                                         │
│  Send SMS for:                          │
│  ☐ Successful bookings                  │
│  ☑ Critical failures only               │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  [Save Preferences]                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Notification Frequency & Batching

### Retry Notification Rules

**Class Full (Retrying every 15 minutes):**
- Send email on **first failure** only
- Do NOT send for subsequent retry attempts
- Send final email when:
  - ✅ Successfully booked after retrying
  - ❌ Class starts and still full (final failure)

**Booking Window Not Open (Fast retry):**
- Do NOT send email if fast retry succeeds within 45 seconds
- Only send if still not open after 9 attempts (45s total)

**Technical Errors:**
- Send on **second consecutive failure** (not first)
- Prevents spam from temporary glitches
- User gets notified if problem persists

### Daily Digest Schedule

**Timing:** 8:00 AM in user's local timezone (from `user_settings` table)

**Contents:**
- Summary stats (X booked, Y retrying, Z need action)
- List of successful bookings
- List of classes still retrying (condensed)
- List of failures requiring action (with error summaries)

**When to send:**
- Only if there were booking attempts in last 24 hours
- Skip if no activity

---

## Implementation Notes

### Email Service (Resend)

**Current setup:**
- Production: `noreply@beerock.com` (DKIM configured)
- Dev/Preview: `onboarding@resend.dev`

**Rate limits (free tier):**
- 100 emails/day
- 3,000 emails/month

**Calculation for 5 users:**
- 5 users × 5 classes/week × 4 weeks = 100 bookings/month
- Worst case: 100 emails/month (well under limit)
- With retries: ~150-200 emails/month (still safe)

### SMS Service (Optional - Future)

**Recommended:** Twilio
- Free tier: $15 credit
- $0.0075 per SMS
- 2,000 free SMS messages

**MVP decision:** Skip SMS for now, focus on email
- Add SMS in Phase 2 if users request it

### Database Changes Needed

Add to `user_settings` table:
```sql
ALTER TABLE user_settings
ADD COLUMN notification_email BOOLEAN DEFAULT TRUE,
ADD COLUMN notification_frequency TEXT DEFAULT 'immediate',
ADD COLUMN email_on_success BOOLEAN DEFAULT TRUE,
ADD COLUMN email_on_waitlist BOOLEAN DEFAULT TRUE,
ADD COLUMN email_on_failure BOOLEAN DEFAULT TRUE,
ADD COLUMN email_on_retry BOOLEAN DEFAULT TRUE;
```

### Notification Tracking

Add new table:
```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_attempt_id UUID REFERENCES booking_attempts(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL, -- 'email', 'sms'
  notification_category TEXT NOT NULL, -- 'success', 'failure', 'retry', 'digest'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT, -- 'sent', 'delivered', 'failed', 'bounced'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policy
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Testing Checklist

Email template testing:
- [ ] Test all templates in email client (Gmail, Outlook, Apple Mail)
- [ ] Verify mobile responsiveness
- [ ] Test with all variable substitutions
- [ ] Check link functionality
- [ ] Verify spam score (use mail-tester.com)
- [ ] Test with/without images enabled
- [ ] Verify plain text fallback

Notification logic testing:
- [ ] Success notification sends immediately
- [ ] Retry notification sends only on first failure
- [ ] Final retry result notification sends
- [ ] Daily digest batches correctly
- [ ] User preferences are respected
- [ ] Unsubscribe link works (if added)
- [ ] Rate limits are not exceeded

---

## Future Enhancements

1. **In-app notifications** - Real-time toast notifications in dashboard
2. **Push notifications** - Browser push API for desktop/mobile
3. **Slack/Discord integration** - Webhook notifications
4. **Weekly summary** - Analytics and insights email
5. **Smart notification timing** - Send at optimal times based on user open rates
6. **Rich content** - Include class instructor, room info, parking tips
7. **Calendar integration** - Auto-add confirmed bookings to Google Calendar

---

## Related Documentation
- `docs/ERROR_MESSAGES.md` - User-friendly error message catalog
- `docs/NOTIFICATIONS_IMPLEMENTATION.md` - Step-by-step implementation guide
- `docs/PRODUCTION_EMAIL_SETUP.md` - Email service setup (Resend)
- `lib/env-utils.ts` - Environment-aware email configuration

---

**Last Updated:** November 28, 2025 (v2.10)
