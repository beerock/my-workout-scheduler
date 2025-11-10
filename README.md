# My Workout Scheduler

My Workout Scheduler automates class reservations for recurring fitness sessions (e.g., BODYPUMP) across gyms (e.g., YMCA branches), ensuring accurate timing, branch validation, and preventing duplicate or erroneous bookings. It removes manual intervention by using structured guardrails to control when and how reservations occur.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Hosting:** Vercel (ready to deploy)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings → API
   - Copy your Project URL and anon/public key

3. **Configure environment variables:**
   - Create a `.env.local` file in the root directory
   - Add your Supabase credentials and encryption key:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ENCRYPTION_KEY=your_encryption_key_here
     ```
   - Generate an encryption key (run in terminal):
     ```bash
     openssl rand -base64 32
     ```
   - Copy the output and paste it as `ENCRYPTION_KEY` in `.env.local`
   - **Note:** Encryption happens in the application (Next.js), not in the database. The key never leaves your server.

4. **Configure Supabase Auth:**
   - In Supabase Dashboard → Authentication → Settings
   - Enable Email provider
   - For prototyping, you can disable "Confirm email" (optional)

5. **Set up the database:**
   - See [Database Setup Guide](./docs/DATABASE_SETUP.md) for detailed instructions
   - Quick version:
     1. In Supabase Dashboard → SQL Editor
     2. Run `supabase/migrations/001_initial_schema.sql`
     3. Run `supabase/migrations/002_rls_policies.sql`
     4. Run `supabase/migrations/003_schedule_management.sql` (for schedule features)
   - **Test encryption:** Run `npx tsx test-encryption.ts` to verify encryption works

6. **Run the development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
my-workout-scheduler/
├── app/
│   ├── (auth)/          # Auth pages (login, signup)
│   ├── dashboard/       # Protected dashboard
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   └── globals.css      # Global styles
├── components/          # Reusable components
├── lib/
│   ├── supabase/       # Supabase client configuration
│   ├── database.types.ts  # TypeScript types for database
│   └── supabase/database.ts  # Database helper functions
├── supabase/
│   └── migrations/     # SQL migration files
├── scripts/            # Automation scripts
│   ├── booking-automation.ts      # Puppeteer booking script
│   ├── database-helpers.ts        # Database query helpers
│   ├── run-booking-automation.ts  # Main automation entry point
│   └── test-*.ts                  # Test scripts
├── .github/
│   └── workflows/      # GitHub Actions workflows
├── middleware.ts       # Route protection middleware
└── docs/               # Project documentation
```

## Features Implemented

✅ Next.js 14 with App Router  
✅ TypeScript configuration  
✅ Tailwind CSS setup  
✅ Supabase authentication  
✅ Login and Signup pages  
✅ Protected routes middleware  
✅ Dashboard page  
✅ Landing page with auth redirect  
✅ Database schema (gym_credentials, recurring_classes, booking_attempts, user_settings)  
✅ Row Level Security (RLS) policies  
✅ TypeScript database types  
✅ **Gym credentials storage form** (with encryption)  
✅ **Schedule management** (add/edit/delete recurring classes)  
✅ **Global pause toggle** (pause all bookings)  
✅ **Per-class active toggle** (enable/disable individual classes)  
✅ **Skip next occurrence** (with smart unskip logic)  
✅ **Schedule list view** (sorted by day and time)  
✅ **Booking automation** (GitHub Actions + Puppeteer)  
✅ **Automated class booking** (runs hourly via GitHub Actions)  
✅ **Booking attempt tracking** (records all booking attempts in database)

## Booking Automation

The app includes automated booking via GitHub Actions that runs every hour to book classes on the gym website.

### Quick Start

1. **Set up GitHub Actions secrets** (see [GitHub Actions Setup Guide](./docs/GITHUB_ACTIONS_SETUP.md)):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ENCRYPTION_KEY`

2. **Test locally**:
   ```bash
   # Test database query
   npm run test:booking-query
   
   # Test database helpers
   npm run test:database-helpers
   
   # Dry-run test (no actual bookings)
   npm run test:booking-dry-run
   
   # Run full automation (makes real bookings!)
   npm run automation:run
   ```

3. **Push to GitHub** - The workflow will run automatically every hour

### Documentation

- [Booking Automation Guide](./docs/BOOKING_AUTOMATION.md) - Full automation system documentation
- [GitHub Actions Setup](./docs/GITHUB_ACTIONS_SETUP.md) - Step-by-step setup instructions

## Next Steps

See the [PRD](./docs/My%20Workout%20Scheduler%20PRD.md) for the full roadmap. Upcoming features:

- Booking history and status tracking UI
- Email notifications
- Vacation mode (date range pause)

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The project is configured for zero-config Vercel deployment.