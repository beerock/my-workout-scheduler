# Vercel Deployment Fix

## Issue

Vercel deployment fails during `npm install` with Puppeteer Chrome download error:
```
ERROR: Failed to set up chrome v142.0.7444.61!
Got status code 403
```

## Root Cause

Puppeteer tries to download Chrome during npm install, but:
1. This download can fail due to network/firewall restrictions in Vercel's build environment
2. Puppeteer is NOT needed for the Next.js app deployment (only used in GitHub Actions)

## Solution

Add an environment variable to skip Puppeteer's browser download during Vercel builds.

### Steps to Fix in Vercel Dashboard:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name:** `PUPPETEER_SKIP_DOWNLOAD`
   - **Value:** `true`
   - **Environment:** Select all (Production, Preview, Development)
4. Click **Save**
5. Trigger a new deployment (redeploy or push a new commit)

### Why This Works

- The Next.js app doesn't use Puppeteer at all
- Puppeteer is only used in `/scripts` directory for automation
- These scripts run in GitHub Actions (which has its own Chrome installation)
- Setting `PUPPETEER_SKIP_DOWNLOAD=true` tells npm to skip downloading Chrome during install
- The build will succeed, and the app will deploy normally

### Alternative: Package.json Approach

If you prefer a code-based solution instead of environment variables, you can move `puppeteer` from `dependencies` to `devDependencies` in `package.json`:

```json
{
  "dependencies": {
    // Remove puppeteer from here
  },
  "devDependencies": {
    "puppeteer": "^24.29.1",  // Add here
    "tsx": "^4.20.6"
  }
}
```

Then update GitHub Actions workflow to install dev dependencies:
```yaml
- name: Install dependencies
  run: npm install --include=dev
```

## Verification

After applying the fix, your Vercel deployment should succeed with build logs showing:
```
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```
