# Production Email Setup Guide - beerock.com

**Status:** In Progress
**Domain:** beerock.com
**Production Email:** noreply@beerock.com
**Date:** November 18, 2025

---

## ✅ Checklist

### Step 1: Resend Domain Verification
- [ ] Added domain `beerock.com` in Resend Dashboard
- [ ] Copied DNS records from Resend
- [ ] Added TXT record for verification
- [ ] Added CNAME records for DKIM signing
- [ ] (Optional) Added MX records for bounce handling
- [ ] Waited for DNS propagation (5-60 minutes)
- [ ] Domain shows "Verified" in Resend Dashboard

### Step 2: Update Vercel Production Environment Variables
- [ ] Opened Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Updated `RESEND_FROM_EMAIL` to `noreply@beerock.com` (Production only)
- [ ] Saved changes

### Step 3: Test Production Email
- [ ] Deployed to production (or waited for auto-deploy)
- [ ] Sent test email from production
- [ ] Verified email arrived in inbox (not spam)
- [ ] Checked email headers for DKIM signature

---

## 📋 DNS Records to Add

**Go to your domain registrar (where beerock.com is hosted) and add these records:**

### TXT Record (Verification)
```
Type: TXT
Name: @ (or beerock.com)
Value: [Copy from Resend Dashboard]
TTL: 3600 (or Auto)
```

### CNAME Records (DKIM - Required for deliverability)
```
Type: CNAME
Name: resend._domainkey (or resend._domainkey.beerock.com)
Value: [Copy from Resend Dashboard]
TTL: 3600 (or Auto)
```

**Note:** Resend may provide multiple CNAME records. Add all of them.

### MX Records (Optional - Bounce handling)
```
Type: MX
Priority: 10
Name: @ (or beerock.com)
Value: [Copy from Resend Dashboard]
TTL: 3600 (or Auto)
```

---

## 🔧 Vercel Environment Variable Update

**Production Environment Only:**

1. Go to: https://vercel.com/dashboard
2. Select your project: `my-workout-scheduler`
3. Navigate to: Settings → Environment Variables
4. Find: `RESEND_FROM_EMAIL`
5. **If it exists:**
   - Click "Edit" for Production environment
   - Change value to: `noreply@beerock.com`
6. **If it doesn't exist:**
   - Click "Add New"
   - Name: `RESEND_FROM_EMAIL`
   - Value: `noreply@beerock.com`
   - Environment: **Production** only (uncheck Preview and Development)
   - Mark as "Sensitive"
7. Save changes

**Optional: Update sender name**
- Variable: `RESEND_FROM_NAME`
- Value: `My Workout Scheduler` (or customize)

---

## 🧪 Testing Production Email

### Option 1: Use Resend Dashboard Test
1. Go to Resend Dashboard → Emails → Send Test Email
2. From: `noreply@beerock.com`
3. To: Your email address
4. Subject: "Test from beerock.com"
5. Click "Send"
6. Check your inbox

### Option 2: Deploy and Use Test Script (After Vercel update)
```bash
# In production, trigger a test via the application
# (We'll set this up after domain verification)
```

---

## ✅ Verification Steps

**Check domain is verified in Resend:**
1. Go to: https://resend.com/domains
2. Look for `beerock.com`
3. Status should show: ✅ Verified

**Check DNS propagation:**
```bash
# Check TXT record
dig TXT beerock.com

# Check CNAME record
dig CNAME resend._domainkey.beerock.com
```

**Check email deliverability:**
- Email arrives in inbox (not spam)
- Email has DKIM signature in headers
- Sender shows as `noreply@beerock.com`

---

## 🚨 Troubleshooting

### Domain not verifying
- **Wait longer:** DNS can take up to 60 minutes
- **Check DNS records:** Verify all records are added correctly
- **No subdomain:** Use `@` or root domain, not `www`
- **Propagation checker:** https://dnschecker.org

### Emails going to spam
- **Missing DKIM:** Ensure CNAME records are added and verified
- **No MX records:** Add optional MX records for better deliverability
- **SPF record:** May need to add SPF (Resend will indicate if needed)

### Environment variable not updating
- **Redeploy:** After changing env vars, trigger new deployment
- **Clear cache:** Vercel → Deployments → Redeploy
- **Check scope:** Ensure env var is set for Production environment

---

## 📚 Resources

- **Resend Domains:** https://resend.com/domains
- **Resend Docs:** https://resend.com/docs/dashboard/domains/introduction
- **Vercel Env Vars:** https://vercel.com/docs/concepts/projects/environment-variables
- **DNS Checker:** https://dnschecker.org

---

## 📝 Notes

**Current Status:**
- Local development: Using `onboarding@resend.dev` ✅
- Production: Setting up `noreply@beerock.com` ⏳

**After Setup:**
- Production emails will send from: `My Workout Scheduler <noreply@beerock.com>`
- Better deliverability with DKIM signature
- Professional branded emails

**Next Steps After Verification:**
1. Implement booking confirmation emails
2. Implement failure notification emails
3. Configure Supabase auth emails via Resend SMTP (optional)
