# My Workout Scheduler

**Version:** 2.37 | **Status:** Production (Invite-Only MVP)
**MVP v1.0 Released:** January 8, 2026 | **Current Date:** April 28, 2026

My Workout Scheduler automates gym class reservations using Puppeteer to book classes the instant registration opens (e.g., 26 hours before class time). Set it and forget it—no more waking up early or racing to book popular classes.

Copy across the product is calibrated through a two-register voice guide (`docs/VOICE.md`): a **showcase voice** for the public landing + waitlist (confident, restrained, portfolio-artifact), and a **coach voice** for logged-in surfaces + booking emails (active verbs, four tiers calibrated to what the user has to do next). Admin-only preview surfaces at `/admin/email-preview`, `/admin/dashboard-preview`, `/admin/form-preview`, `/admin/landing-preview`, and `/admin/waitlist` let the owner eyeball component variants without orchestrating live data conditions.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **Scheduling:** Inngest (event-driven triggers)
- **Automation:** Puppeteer via GitHub Actions
- **Email:** Resend
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- An Inngest account (free tier works)

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
   - Copy `.env.example` to `.env.local`
   - Add your credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ENCRYPTION_KEY=your_encryption_key_here
     INNGEST_EVENT_KEY=your_inngest_event_key
     INNGEST_SIGNING_KEY=your_inngest_signing_key
     RESEND_API_KEY=your_resend_api_key
     ```
   - Generate an encryption key:
     ```bash
     openssl rand -base64 32
     ```

4. **Set up the database:**
   - In Supabase Dashboard → SQL Editor
   - Run migrations in order from `supabase/migrations/`

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
my-workout-scheduler/
├── app/
│   ├── (auth)/           # Auth pages (login, signup, verify-email)
│   ├── actions/          # Server actions (all form submissions)
│   ├── api/inngest/      # Inngest webhook endpoint
│   ├── dashboard/        # Protected pages (schedule, account, history)
│   └── globals.css       # Global styles
├── components/
│   └── ui/               # Design system components (19 components)
├── lib/
│   ├── inngest/          # Event-driven booking functions
│   ├── date-utils.ts     # Date/timezone calculations
│   ├── validation.ts     # Shared validation utilities
│   └── supabase/         # Supabase client configuration
├── scripts/              # Puppeteer automation scripts
├── supabase/
│   └── migrations/       # SQL migration files
├── .github/
│   └── workflows/        # GitHub Actions for Puppeteer execution
└── docs/                 # Project documentation
```

## Features

### User Management
- Email/password authentication with bot protection (Cloudflare Turnstile)
- Password strength validation and confirmation
- Email verification flow
- Account management (update email, password, delete account)

### Schedule Management
- Add/edit/delete recurring classes
- Global pause toggle (pause all bookings)
- Per-class active toggle
- Skip next occurrence with smart unskip logic
- Copy class feature for quick duplication
- Timezone handling per class

### Automated Booking
- **Event-driven scheduling:** Inngest triggers bookings at exact window times
- **Precise timing:** Books within 5 seconds of registration opening (early-start optimization)
- **Intelligent retry:** Class full retries every 15min until class starts
- **Hybrid architecture:** Inngest schedules → GitHub Actions runs Puppeteer
- **Duplicate prevention:** Detects already-booked classes

### Notifications
- Email notifications for booking results (success, waitlist, failure)
- Welcome email on signup
- Pause reminder after 7 days
- User preferences for notification types

### Dashboard
- Quick stats (success rate, active classes, upcoming bookings)
- Next class countdown
- Recent activity timeline
- Booking history with filtering and pagination

## Design System

This project uses a comprehensive design system with **19 reusable UI components** in `components/ui/`:

| Category | Components |
|----------|------------|
| Core | Button, Badge, Card, Modal |
| Form | Input, Select, TimeInput, Checkbox, FormField |
| Navigation | DropdownMenu, Tabs (with TabPanel) |
| Feedback | Alert, Toast, Skeleton |
| Display | StatusIndicator, StatCard, Divider |
| Layout | Header, Footer |

**Typography:** Sora (headings) + DM Sans (body)

**Documentation:**
- [Design System](docs/DESIGN_SYSTEM.md) - Colors, typography, spacing
- [Component Library](docs/COMPONENT_LIBRARY.md) - Component APIs and examples

## Booking Automation

The booking system uses an event-driven architecture:

1. **User creates class** → Next.js sends event to Inngest
2. **Inngest waits** until exact booking window time
3. **Inngest triggers** GitHub Actions via API
4. **GitHub Actions** runs Puppeteer to book the class
5. **Daily scheduler** (midnight UTC) ensures all classes are scheduled

### Testing Commands

```bash
npm run test:booking-dry-run    # Safe dry-run (always run first)
npm run test:single-booking     # REAL booking - use with caution
```

### Documentation

- [Booking Automation Guide](docs/BOOKING_AUTOMATION.md) - Full system documentation
- [GitHub Actions Setup](docs/GITHUB_ACTIONS_SETUP.md) - Setup instructions

## Documentation

| Doc | Purpose |
|-----|---------|
| [PRD](docs/My%20Workout%20Scheduler%20PRD.md) | Full product spec and architecture |
| [BACKLOG.md](docs/BACKLOG.md) | Current priorities and tasks |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Design tokens and patterns |
| [COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) | Component APIs |
| [BOOKING_AUTOMATION.md](docs/BOOKING_AUTOMATION.md) | Automation details |
| [ERROR_MESSAGES.md](docs/ERROR_MESSAGES.md) | Error catalog |

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Post-Deploy

- Sync Inngest functions in Inngest dashboard
- Configure GitHub Actions secrets for Puppeteer execution

## License

Private project - not for redistribution.
