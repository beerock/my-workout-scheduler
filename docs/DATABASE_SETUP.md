# Database Setup & Testing Guide

This guide walks you through setting up the database tables, RLS policies, and testing the encryption system.

## Prerequisites

- ✅ Supabase project created
- ✅ `.env.local` file with Supabase credentials
- ✅ `ENCRYPTION_KEY` generated and added to `.env.local`

## Step 1: Generate Encryption Key (if not done)

If you haven't generated your encryption key yet:

```bash
openssl rand -base64 32
```

Copy the output and add it to your `.env.local` file:

```env
ENCRYPTION_KEY=your_generated_key_here
```

## Step 2: Run Database Migrations

### 2.1 Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"** button (top right)

### 2.2 Run First Migration (Schema)

1. Open `supabase/migrations/001_initial_schema.sql` in your code editor
2. Copy the **entire contents** of the file
3. Paste into the Supabase SQL Editor
4. Click **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
5. You should see: ✅ "Success. No rows returned"

**What this creates:**
- `gym_credentials` table
- `recurring_classes` table
- `booking_attempts` table
- Indexes for performance
- Triggers for `updated_at` timestamps

### 2.3 Run Second Migration (RLS Policies)

1. Open `supabase/migrations/002_rls_policies.sql` in your code editor
2. Copy the **entire contents** of the file
3. Paste into the Supabase SQL Editor (you can clear the previous query or use a new tab)
4. Click **"Run"** button
5. You should see: ✅ "Success. No rows returned"

**What this creates:**
- Row Level Security (RLS) enabled on all tables
- Policies ensuring users can only access their own data

## Step 3: Verify Tables Were Created

### 3.1 Check Tables in Supabase Dashboard

1. Go to **"Table Editor"** in the left sidebar
2. You should see three tables:
   - `gym_credentials`
   - `recurring_classes`
   - `booking_attempts`

3. Click on each table to verify the columns match the schema

### 3.2 Verify RLS is Enabled

1. In **"Table Editor"**, click on any table (e.g., `gym_credentials`)
2. Look for a shield icon or "RLS" indicator showing it's enabled
3. Or go to **"Authentication" → "Policies"** to see the RLS policies

## Step 4: Test Encryption Functions

Let's create a simple test script to verify encryption works.

### 4.1 Create Test Script

Create a file `test-encryption.ts` in the project root:

```typescript
import { encryptPassword, decryptPassword } from './lib/encryption'

// Test encryption/decryption
const testPassword = 'my-test-password-123'

console.log('Testing encryption...')
console.log('Original password:', testPassword)

try {
  // Encrypt
  const encrypted = encryptPassword(testPassword)
  console.log('Encrypted:', encrypted)
  console.log('Encrypted length:', encrypted.length)

  // Decrypt
  const decrypted = decryptPassword(encrypted)
  console.log('Decrypted:', decrypted)

  // Verify
  if (decrypted === testPassword) {
    console.log('✅ Encryption test PASSED!')
  } else {
    console.log('❌ Encryption test FAILED - passwords do not match')
  }
} catch (error) {
  console.error('❌ Encryption test FAILED:', error)
  process.exit(1)
}
```

### 4.2 Run Test Script

```bash
npx tsx test-encryption.ts
```

**Expected output:**
```
Testing encryption...
Original password: my-test-password-123
Encrypted: [long base64 string]
Encrypted length: [some number]
Decrypted: my-test-password-123
✅ Encryption test PASSED!
```

If you get an error about `tsx` not being found, install it first:

```bash
npm install -D tsx
```

## Step 5: Test Database Connection

### 5.1 Create a Test API Route

Create `app/api/test-db/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test query - get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json(
        { error: 'Not authenticated', details: authError.message },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      )
    }

    // Test query - check if gym credentials exist (don't expose actual data)
    const { data: credentials, error: dbError } = await supabase
      .from('gym_credentials')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      database: {
        connected: true,
        hasCredentials: !!credentials,
        error: dbError?.message || null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

### 5.2 Test the API Route

1. Make sure your dev server is running: `npm run dev`
2. Make sure you're logged in to your app
3. Visit: `http://localhost:3000/api/test-db`

**Expected response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "your-email@example.com"
  },
  "database": {
    "connected": true,
    "hasCredentials": false,
    "error": null
  }
}
```

If `hasCredentials` is `false`, that's expected - you haven't created any yet! Note: This endpoint only returns whether credentials exist (not the actual data) for security.

## Step 6: Test RLS Policies

### 6.1 Test with SQL (in Supabase SQL Editor)

Run this query while logged in as your user (you'll need to be authenticated):

```sql
-- This should work - viewing your own data
SELECT * FROM gym_credentials WHERE user_id = auth.uid();

-- This should return empty (RLS blocks other users' data)
SELECT * FROM gym_credentials WHERE user_id != auth.uid();
```

**Note:** To test RLS properly, you'll need to be authenticated. The best way is through the Next.js app or using Supabase's REST API with your session.

### 6.2 Test via Application

The RLS policies will be tested automatically when you:
- Try to insert credentials (should work for your user)
- Try to view other users' data (should be blocked)

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the first migration (`001_initial_schema.sql`)
- Check that you're in the correct Supabase project

### Error: "permission denied"
- Make sure you ran the second migration (`002_rls_policies.sql`)
- Check that RLS is enabled on the tables

### Encryption test fails
- Verify `ENCRYPTION_KEY` is set in `.env.local`
- Make sure you restarted the dev server after adding the key
- Check that the key is exactly 32 bytes when base64 decoded

### Database connection fails
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that you're logged in to the app
- Verify the Supabase project is active (not paused)

## Next Steps

Once everything is tested and working:

1. ✅ Database tables created
2. ✅ RLS policies enabled
3. ✅ Encryption functions working
4. ✅ Database connection verified

You're ready to build:
- Gym credentials form (with encryption)
- Schedule management forms
- Dashboard to display classes

See the [PRD](./My%20Workout%20Scheduler%20PRD.md) for the full feature list.

