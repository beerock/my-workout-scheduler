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
   - **GitHub** (recommended - faster, no email verification needed)
   - **Email** (you'll need to verify your email)
4. If using email, check your inbox and click the verification link
5. After verification/signup, you'll see the **"Create your first app"** screen

---

## Step 2: Create Your First App (SKIP THIS - We'll do it differently)

**IMPORTANT: Do NOT fill out the "Create your first app" form yet!**

Instead, we need to get your keys first. Here's what to do:

1. **Close or skip the "Create your first app" modal/form** if it's showing
   - Look for an "X" button or "Skip" button
   - Or press ESC on your keyboard
2. You should now see the main Inngest dashboard

---

## Step 3: Get Your Event Key

Your Event Key is used to send events from your app to Inngest.

1. In the Inngest dashboard, look for the left sidebar
2. Click on your **workspace name** (top of the left sidebar)
   - It might say "Personal" or your name
3. Click **"Settings"** (gear icon) in the left sidebar
4. Click **"Event Keys"** in the settings menu
5. You should see a table with your Event Key
   - It looks like a long string: `01234567-89ab-cdef-0123-456789abcdef`
   - Or might be labeled as "Production" or "Default"
6. **Copy this Event Key** to your clipboard
7. Save it somewhere temporarily (you'll add it to your `.env.local` file soon)

**Alternative if you can't find it:**
- Look for a section called "Send your first event" on the dashboard
- Your Event Key should be displayed there
- Copy the key (just the alphanumeric string, not any URL prefix)

---

## Step 4: Get Your Signing Key (via Dev Server Method)

This is the easiest way to get your Signing Key. We'll use the Inngest Dev Server to automatically generate it for you.

### 4.1: Install Dependencies (if you haven't already)

```bash
npm install inngest date-fns date-fns-tz
```

### 4.2: Start the Inngest Dev Server

Open a terminal in your project directory and run:

```bash
npx inngest-cli@latest dev
```

This will:
- Start a local dev server on http://localhost:8288
- Automatically generate a development Signing Key for you
- Show you the key in the terminal output

Look for output like this:
```
✓ Dev server online at http://localhost:8288
✓ Signing key: signkey-dev-abc123...
```

**Copy the Signing Key** (the part that starts with `signkey-dev-`)

**Keep this terminal window open** - you'll need the dev server running.

---

## Step 5: Add Keys to Your Local Environment

1. In your project root, create or open `.env.local` file
2. Add these two lines:

```bash
# Inngest Event Key (from Step 3)
INNGEST_EVENT_KEY=paste_your_event_key_here

# Inngest Signing Key (from Step 4.2)
INNGEST_SIGNING_KEY=paste_your_signing_key_here
```

3. Replace the placeholder values with your actual keys
4. Save the file

**Example `.env.local` file:**
```bash
INNGEST_EVENT_KEY=a1b2c3d4-e5f6-7890-abcd-ef1234567890
INNGEST_SIGNING_KEY=signkey-dev-a1b2c3d4e5f67890abcdef1234567890
```

**Verify `.env.local` is in `.gitignore`:**
- Open `.gitignore`
- Make sure it contains `.env.local` (should be there by default)
- This prevents you from committing your keys to Git

---

## Step 6: Test Locally

### 6.1: Start Your Next.js App

In a **new terminal** (keep the Inngest dev server running), start Next.js:

```bash
npm run dev
```

### 6.2: Check the Inngest Dev Dashboard

1. Open your browser to: http://localhost:8288
2. You should see the Inngest Dev UI with:
   - **Apps** section showing: `http://localhost:3000/api/inngest`
   - **Functions** section showing:
     - `book-class`
     - `daily-scheduler`

**If you see these two functions, you're all set! ✅**

**If you don't see the functions:**
- Make sure both the Inngest dev server AND Next.js are running
- Check for errors in the Next.js terminal
- Try refreshing http://localhost:8288
- Restart both servers

### 6.3: Test with a Class

1. Go to your app: http://localhost:3000
2. Log in
3. Add a test class with:
   - **Day/Time:** Any day/time that's **2 minutes from now**
   - **Booking window:** 26 hours (default)
   - **Example:** If it's 2:00 PM Tuesday, create a class for Wednesday 4:00 PM
     - The booking window opens: Tuesday 2:02 PM (26 hours before Wednesday 4:00 PM)
4. Save the class
5. Go to http://localhost:8288
6. Click **"Events"** in the sidebar
7. You should see a pending `booking/attempt` event scheduled for ~2 minutes from now
8. Wait for the event to trigger
9. Click **"Runs"** in the sidebar
10. You should see the `book-class` function execution with detailed logs

---

## Step 7: Deploy to Production

Now that local testing works, let's deploy to production.

### 7.1: Get Production Signing Key

For production, you need a production Signing Key (not the dev one).

**Method A: Via Inngest Dashboard (Recommended)**

1. Go to https://app.inngest.com/
2. Click **Settings** (gear icon) in the left sidebar
3. Click **"Signing Keys"** or **"API Keys"**
4. You should see:
   - **Event Key** (you already have this)
   - **Signing Key** - Click **"Create new key"** or **"Reveal"**
5. **Copy the Production Signing Key**
   - Format: `signkey-prod-...` (different from the dev key)
   - Save it somewhere safe

**Method B: Create Via Apps Section**

1. Go to https://app.inngest.com/
2. Click **"Apps"** in the left sidebar
3. Click **"Sync new app"** or **"Connect app"**
4. You'll be asked to enter your app URL - **enter:** `https://your-app-name.vercel.app/api/inngest`
   - ⚠️ Replace `your-app-name` with your actual Vercel project name
   - You can get this from your Vercel dashboard
5. Click **"Connect"** or **"Sync"**
6. During or after syncing, you should see your **Signing Key** displayed
7. **Copy this Signing Key**

---

### 7.2: Add Environment Variables to Vercel

**CRITICAL: Do this BEFORE deploying, or the deployment will fail!**

1. Go to https://vercel.com/dashboard
2. Click on your project: `my-workout-scheduler`
3. Click **"Settings"** (top navigation bar)
4. Click **"Environment Variables"** (left sidebar)
5. Add **INNGEST_EVENT_KEY**:
   - Click **"Add"** or **"New"**
   - **Key:** `INNGEST_EVENT_KEY`
   - **Value:** Paste your Event Key from Step 3
   - **Environments:** Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**
6. Add **INNGEST_SIGNING_KEY**:
   - Click **"Add"** or **"New"**
   - **Key:** `INNGEST_SIGNING_KEY`
   - **Value:** Paste your Production Signing Key from Step 7.1
   - **Environments:** Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

**Double-check both variables are added:**
- You should see both listed in the Environment Variables table
- Both should show "Production, Preview, Development"

---

### 7.3: Deploy to Vercel

1. Commit and push your code (if not done already):
```bash
git add .
git commit -m "feat: integrate Inngest event-driven automation"
git push
```

2. Vercel will automatically deploy (takes 2-3 minutes)
3. Go to your Vercel dashboard and wait for **"Ready"** status
4. Note your production URL: `https://your-app-name.vercel.app`

---

### 7.4: Sync Inngest with Production

Now connect Inngest to your production deployment:

1. Go to https://app.inngest.com/
2. Click **"Apps"** in the left sidebar
3. Click **"Sync new app"** or **"Connect app"** button
4. In the **"App URL"** field, enter:
   ```
   https://your-app-name.vercel.app/api/inngest
   ```
   - ⚠️ Replace `your-app-name` with your actual Vercel app name
   - Must end with `/api/inngest`
   - Must be `https://` (not `http://`)
5. Click **"Sync"** or **"Connect"**
6. Inngest will test the connection and discover your functions

**What should happen:**
- ✅ Connection successful
- ✅ 2 functions discovered: `book-class`, `daily-scheduler`
- ✅ Status shows "Connected" or "Synced"

**If it fails:**
- Check that environment variables are set in Vercel (Step 7.2)
- Make sure the URL is correct and ends with `/api/inngest`
- Check Vercel deployment logs for errors
- Try visiting `https://your-app-name.vercel.app/api/inngest` in your browser
  - You should see a JSON response (not an error)

---

## Step 8: Verify Production is Working

### 8.1: Check Connection Status

1. In Inngest dashboard, click **"Apps"**
2. You should see your production app listed:
   - **Name:** `my-workout-scheduler` (or your app name)
   - **URL:** `https://your-app-name.vercel.app/api/inngest`
   - **Status:** 🟢 Connected (green dot)
   - **Functions:** 2
3. Click on the app to see details

---

### 8.2: Create a Test Class in Production

1. Go to your production app: `https://your-app-name.vercel.app`
2. Log in
3. Create a test class with booking window opening in **5 minutes**:
   - Example: If it's 3:00 PM now
   - Create a class for 3:05 PM today
   - Booking window: 26 hours (this will trigger immediately since we're within the window)

   **OR create a future class:**
   - Create a class for tomorrow at any time
   - This will schedule an event for tomorrow

---

### 8.3: Monitor in Inngest Dashboard

1. Go to https://app.inngest.com/
2. Click **"Events"** (left sidebar)
3. You should see your `booking/attempt` event:
   - **Status:** Pending (if scheduled for future) or Completed (if already ran)
   - **Run at:** The timestamp when it will/did run
4. Click **"Runs"** (left sidebar)
5. Find your function run:
   - **Function:** `book-class`
   - **Status:** Completed, Running, or Failed
   - Click on it to see detailed step-by-step logs

---

### 8.4: What Success Looks Like

**In Inngest Dashboard → Runs:**
- ✅ Function completed without errors
- ✅ You can see all steps:
  - `fetch-class-data`
  - `create-attempt-record`
  - `decrypt-password`
  - `execute-booking`
  - `update-attempt-record`
  - `handle-result`
- ✅ No red error messages

**In Supabase Database:**
1. Go to your Supabase project
2. Click **"Table Editor"**
3. Open `booking_attempts` table
4. You should see a new row with:
   - `recurring_class_id`: Your class ID
   - `status`: `confirmed`, `waitlisted`, or `failed`
   - `attempt_timestamp`: When it ran
   - `error_message`: null (if successful) or error details (if failed)

---

## Troubleshooting

### "Can't find Event Key"
- Go to Settings (gear icon) → Event Keys
- It should be listed there
- If empty, refresh the page or try logging out and back in

### "Inngest Dev Server won't start"
- Make sure you're in the project directory
- Check if port 8288 is already in use: `lsof -i :8288`
- Kill any process using that port: `kill -9 <PID>`
- Try running again: `npx inngest-cli@latest dev`

### "Functions not showing in Dev UI"
- Make sure both Inngest dev server AND Next.js dev server are running
- Check for errors in the Next.js terminal
- Verify `.env.local` has both keys set
- Try restarting both servers
- Visit http://localhost:3000/api/inngest - you should see JSON (not error)

### "Production sync fails"
- **Error: Unauthorized**
  - Check that you added the Signing Key to Vercel environment variables
  - Make sure it's the **production** Signing Key (starts with `signkey-prod-`)
  - Verify you checked all three environments (Production, Preview, Development)
  - Redeploy after adding env vars: `git commit --allow-empty -m "trigger redeploy" && git push`

- **Error: Connection timeout**
  - Check that your Vercel deployment is actually live (visit the URL)
  - Verify the URL ends with `/api/inngest`
  - Check Vercel deployment logs for errors

- **Error: Functions not found**
  - Make sure your code is deployed (check latest Git commit)
  - Verify `/api/inngest/route.ts` exists in your repository
  - Check Vercel build logs for errors

### "Events not triggering"
- Check Inngest Dashboard → Events
- Make sure the event has a future timestamp
- If scheduled in the past, it won't trigger (create a new class)
- Verify the class wasn't deleted or deactivated

### "Function runs but fails"
- Click on the failed run in Inngest Dashboard
- Look at the error message in the step that failed
- Common issues:
  - **Missing Supabase env vars:** Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Vercel
  - **Missing encryption key:** Add ENCRYPTION_KEY to Vercel
  - **Database connection error:** Check Supabase is running
  - **Puppeteer error:** May need to run in GitHub Actions (not Next.js API route)

---

## Summary: Required Environment Variables

Your `.env.local` (local):
```bash
INNGEST_EVENT_KEY=<from Inngest dashboard>
INNGEST_SIGNING_KEY=signkey-dev-<from dev server>
SUPABASE_URL=<your supabase url>
SUPABASE_SERVICE_ROLE_KEY=<your supabase service key>
ENCRYPTION_KEY=<your encryption key>
```

Your Vercel Environment Variables (production):
```bash
INNGEST_EVENT_KEY=<from Inngest dashboard>
INNGEST_SIGNING_KEY=signkey-prod-<from Inngest dashboard>
SUPABASE_URL=<your supabase url>
SUPABASE_SERVICE_ROLE_KEY=<your supabase service key>
ENCRYPTION_KEY=<your encryption key>
```

---

## Next Steps

Once everything is working:

1. **Monitor the daily scheduler:**
   - It runs at midnight UTC every day
   - Check Inngest Dashboard → Runs for `daily-scheduler`
   - Should show all active classes being re-scheduled

2. **Add real classes:**
   - Now that it's working, add your actual gym classes
   - They'll be scheduled automatically when you save them

3. **Check booking attempts:**
   - When a booking window opens, check Inngest Runs
   - Verify booking attempts are recorded in Supabase

---

## Cost Monitoring

Check your usage in Inngest Dashboard:
- Click **"Usage"** or **"Billing"** in the sidebar
- Current usage shows event count
- Free tier: 50,000 events/month
- Your estimated usage: ~1,500 events/month (well under limit)

You'll get email alerts if you approach the limit.
