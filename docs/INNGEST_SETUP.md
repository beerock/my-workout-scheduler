# Inngest Setup Guide

This guide walks you through setting up Inngest for event-driven class booking automation.

## What is Inngest?

Inngest is an event-driven workflow engine that allows us to:
- Schedule booking attempts at **exact times** (when each class's booking window opens)
- Automatically retry when booking windows aren't open yet (clock drift)
- Retry every 15 minutes when classes are full (until the class starts)
- Run daily scheduling to ensure all classes are queued

**Cost:** FREE for up to 50,000 events/month (we'll use ~1,000-2,000/month)

---

## Step 1: Create Inngest Account

1. Go to https://www.inngest.com/
2. Click **"Sign Up"** or **"Start building for free"**
3. Sign up with:
   - **GitHub** (recommended - faster)
   - **Email** (you'll need to verify email)
4. After signup, you'll be redirected to the Inngest dashboard

---

## Step 2: Get Your Event Key (Sending Events)

After logging in, you'll see the Inngest dashboard. Here's how to get your **Event Key**:

1. Look for the **"Getting Started"** section or **"Send your first event"** prompt
2. You should see your **Event Key** displayed directly on the dashboard
   - It looks like: `https://inn.gs/e/YOUR_EVENT_KEY_HERE` or just `YOUR_EVENT_KEY_HERE`
   - Format: Usually starts with a random string (e.g., `01234567-89ab-cdef-0123-456789abcdef`)
3. **Copy this Event Key** - you'll need it in Step 4

**Alternative path if not visible:**
- Click on your workspace/account name (top left)
- Look for **"Event Keys"** or **"API Keys"** in the sidebar
- Copy the **Event Key** (not the Signing Key yet)

---

## Step 3: Get Your Signing Key (Webhook Security)

Now get your **Signing Key** for secure webhook communication:

### Method A: Via "Apps" Section (Recommended)

1. In the Inngest dashboard sidebar, click **"Apps"** (left sidebar)
2. You might see:
   - **"Connect an app"** or **"Sync new app"** button - click it
   - Or a prompt to add your first app
3. Enter a name for your app: `my-workout-scheduler`
4. Enter your app URL:
   - **Local development**: `http://localhost:3000/api/inngest`
   - **Production**: `https://your-app.vercel.app/api/inngest` (add this later after deployment)
5. Click **"Sync"** or **"Add app"**
6. After syncing, you should see your **Signing Key** displayed
   - Format: Starts with `signkey-prod-` or `signkey-test-`
   - Example: `signkey-prod-abc123def456...`
7. **Copy this Signing Key** - you'll need it in Step 4

### Method B: Via Settings (Alternative)

1. Click the **gear icon** (⚙️) or **"Settings"** in the sidebar
2. Look for **"Keys"** or **"API Keys"** or **"Signing Keys"** section
3. You should see:
   - **Event Key** (for sending events)
   - **Signing Key** (for webhooks)
4. **Copy both keys**

**Important Notes:**
- The **Event Key** is for your app to SEND events to Inngest
- The **Signing Key** is for Inngest to VERIFY requests to your webhook endpoint
- Both are required for the integration to work

---

## Step 4: Add Keys to Local Environment

1. In your project root, create or open `.env.local` file
2. Add these lines (replace with your actual keys from Steps 2 & 3):

```bash
# Inngest Event Key (for sending events to Inngest)
INNGEST_EVENT_KEY=01234567-89ab-cdef-0123-456789abcdef

# Inngest Signing Key (for verifying webhook requests)
INNGEST_SIGNING_KEY=signkey-prod-abc123def456...
```

3. **Important**: Make sure `.env.local` is in your `.gitignore` (it should be by default)
4. Save the file

**Example with real format:**
```bash
INNGEST_EVENT_KEY=a1b2c3d4-e5f6-7890-abcd-ef1234567890
INNGEST_SIGNING_KEY=signkey-prod-a1b2c3d4e5f67890abcdef1234567890abcdef1234567890
```

---

## Step 5: Add Keys to Vercel (Production)

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add two variables:
   - `INNGEST_EVENT_KEY` = (paste your Event Key)
   - `INNGEST_SIGNING_KEY` = (paste your Signing Key)
4. Make sure to set them for **Production**, **Preview**, and **Development**

---

## Step 6: Test Locally

1. Start the Inngest Dev Server (in a separate terminal):
```bash
npx inngest-cli@latest dev
```

2. Start your Next.js app:
```bash
npm run dev
```

3. Open Inngest Dev UI:
   - Go to http://localhost:8288
   - You should see your functions listed:
     - `book-class`
     - `daily-scheduler`

4. Test scheduling a class:
   - Add a test class in your app (set booking window to open in 2 minutes)
   - Watch the Inngest Dev UI - you should see the event scheduled
   - When the time arrives, it should trigger automatically

---

## Step 7: Deploy to Production

### 7.1: Add Environment Variables to Vercel (Do this FIRST)

**Before deploying**, add your Inngest keys to Vercel:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `my-workout-scheduler`
3. Click **"Settings"** (top navigation)
4. Click **"Environment Variables"** (left sidebar)
5. Add **INNGEST_EVENT_KEY**:
   - **Name**: `INNGEST_EVENT_KEY`
   - **Value**: (paste your Event Key from Step 2)
   - **Environment**: Check all three: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**
6. Add **INNGEST_SIGNING_KEY**:
   - **Name**: `INNGEST_SIGNING_KEY`
   - **Value**: (paste your Signing Key from Step 3)
   - **Environment**: Check all three: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

### 7.2: Deploy to Vercel

1. Commit and push your code (if not already done):
```bash
git add .
git commit -m "feat: integrate Inngest for event-driven booking"
git push
```

2. Vercel will auto-deploy (takes ~2-3 minutes)
3. Wait for deployment to complete
4. Note your production URL: `https://your-app-name.vercel.app`

### 7.3: Sync Inngest with Your Production App

**This is critical - Inngest needs to know where to send webhooks:**

1. Go to your Inngest dashboard: https://app.inngest.com/
2. In the left sidebar, click **"Apps"**
3. You should see your local app (`http://localhost:3000/api/inngest`)
4. Click **"Sync new app"** or **"Add app"** button
5. Enter your **production URL**:
   ```
   https://your-app-name.vercel.app/api/inngest
   ```
   ⚠️ **Important**:
   - Replace `your-app-name` with your actual Vercel app name
   - Must end with `/api/inngest`
   - Must be HTTPS (not HTTP)
6. Click **"Sync"** or **"Connect"**
7. Inngest will:
   - Test the connection by calling your `/api/inngest` endpoint
   - Discover your functions (`book-class` and `daily-scheduler`)
   - Show a success message if everything works

**Expected result:**
- ✅ Status: "Connected" or "Synced"
- ✅ Functions discovered: 2 (`book-class`, `daily-scheduler`)
- ✅ Last synced: Just now

**If sync fails:**
- Check Vercel deployment logs for errors
- Verify environment variables are set in Vercel
- Make sure the URL ends with `/api/inngest`
- Try accessing `https://your-app-name.vercel.app/api/inngest` in your browser
  - You should see: `{"message":"Inngest endpoint"}`

---

## Step 8: Verify It's Working

### 8.1: Check App Connection

1. In Inngest dashboard, go to **"Apps"** (left sidebar)
2. Verify you see your production app listed:
   - Name: `my-workout-scheduler`
   - URL: `https://your-app-name.vercel.app/api/inngest`
   - Status: ✅ **Connected** (green)
   - Functions: 2 discovered
3. If status is **Not connected** (red):
   - Click the app
   - Click **"Sync"** to retry
   - Check Vercel logs for errors

### 8.2: Test with a Real Class

1. Go to your production app: `https://your-app-name.vercel.app`
2. Log in and add a test class:
   - Set booking window to open in **5 minutes** from now
   - Example: If it's 2:00 PM now, create a class for 2:05 PM today
3. Save the class

### 8.3: Monitor in Inngest Dashboard

1. Go to Inngest dashboard → **"Events"** tab (left sidebar)
2. You should see a new event:
   - Name: `booking/attempt`
   - Status: **Pending** (scheduled for future)
   - Run at: 5 minutes from now
3. Wait for the scheduled time
4. Go to **"Runs"** tab (left sidebar)
5. You should see:
   - Function: `book-class`
   - Status: **Completed** or **Running**
   - Click the run to see detailed logs

### 8.4: What Success Looks Like

**In Inngest "Runs" tab:**
- ✅ Function executed without errors
- ✅ You can see step-by-step logs:
  - `fetch-class-data` - Retrieved class from database
  - `create-attempt-record` - Created booking attempt
  - `decrypt-password` - Decrypted credentials
  - `execute-booking` - Ran Puppeteer automation
  - `update-attempt-record` - Saved result to database

**In your Supabase database:**
- Check `booking_attempts` table
- Should have a new row with:
  - `recurring_class_id`: Your class ID
  - `status`: `confirmed`, `waitlisted`, or `failed`
  - `attempt_timestamp`: The time it ran
  - `error_message`: Details if failed

---

## Architecture Overview

```
User creates class (Saturday 9:30 AM, 26-hour window)
        ↓
Next.js calculates: Friday 7:30 AM
        ↓
Sends event to Inngest: { name: "booking/attempt", ts: Friday7:30AM }
        ↓
[Inngest waits until Friday 7:30 AM]
        ↓
Inngest triggers: POST /api/inngest
        ↓
bookClassFunction runs Puppeteer automation
        ↓
If booking window not open yet → Retry in 15 seconds (up to 12 times)
If class full → Retry every 15 minutes until class starts
If successful → Done!
```

---

## Monitoring

### View Scheduled Events:
- Inngest Dashboard → **"Events"** tab
- Shows all upcoming booking attempts

### View Function Runs:
- Inngest Dashboard → **"Runs"** tab
- Shows detailed logs for each booking attempt
- Can see retries, errors, and success status

### Daily Scheduler:
- Runs automatically at midnight UTC every day
- Ensures all active classes get scheduled
- Check **"Runs"** to verify it's working

---

## Troubleshooting

### "Functions not showing up in Inngest Dev UI"
- Make sure `npx inngest-cli@latest dev` is running
- Restart your Next.js dev server
- Check http://localhost:8288

### "Production events not triggering"
- Verify you synced the app in Inngest dashboard
- Check that environment variables are set in Vercel
- Look for errors in Vercel logs

### "Events firing but failing"
- Check Inngest Dashboard → "Runs" → Click the failed run
- Look at the error message
- Common issues:
  - Missing Supabase env vars
  - Missing encryption key
  - Database connection issues

---

## Cost Estimate

For 5 users × 5 classes/week = 25 bookings/week = 100/month:

- **Initial booking attempts**: 100 events/month
- **Clock drift retries** (worst case, 12 retries per class): 1,200 events/month
- **Class full retries** (avg 2 per booking): 200 events/month
- **Daily scheduler**: 30 events/month

**Total: ~1,530 events/month** (well under 50,000 free tier limit)

---

## Migration from GitHub Actions Cron

The old GitHub Actions cron (`*/15 * * * *`) has been **removed**.

**Benefits of Inngest:**
- ✅ **More accurate**: Triggers at exact booking window times (not every 15 min)
- ✅ **More efficient**: Only runs when needed (not 96 times/day)
- ✅ **FREE**: No GitHub Actions paid tier needed ($4-8/month savings)
- ✅ **Better retry logic**: Handles clock drift and full classes automatically
- ✅ **Better monitoring**: Visual dashboard to see all events and runs

**GitHub Actions workflow still exists** for manual testing/debugging via `workflow_dispatch`.
