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
2. Click **"Sign Up"** (free tier)
3. Create an account (use GitHub or email)

---

## Step 2: Create a New App

1. After logging in, click **"Create App"**
2. Name it: `my-workout-scheduler`
3. Click **"Create"**

---

## Step 3: Get API Keys

1. In your Inngest dashboard, go to **"Settings"** → **"Keys"**
2. Copy two keys:
   - **Event Key** (starts with `your_event_key...`)
   - **Signing Key** (starts with `signkey-...`)

---

## Step 4: Add Keys to Local Environment

1. Open your `.env.local` file
2. Add these lines:

```bash
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
```

3. Replace with your actual keys from Step 3

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

1. Commit and push your code:
```bash
git add .
git commit -m "feat: integrate Inngest for event-driven booking"
git push
```

2. Vercel will auto-deploy

3. Sync Inngest with your production app:
   - Go to your Inngest dashboard
   - Click **"Apps"** → **"Manage"**
   - Click **"Sync App"**
   - Enter your production URL: `https://your-app.vercel.app/api/inngest`
   - Click **"Sync"**

4. Inngest will verify the connection and start listening for events

---

## Step 8: Verify It's Working

1. Add a class in production (or use an existing one)
2. Go to your Inngest dashboard → **"Events"**
3. You should see scheduled `booking/attempt` events
4. When the booking window opens, the event will fire and you'll see it in **"Runs"**

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
