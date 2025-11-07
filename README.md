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
   - Add your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Configure Supabase Auth:**
   - In Supabase Dashboard → Authentication → Settings
   - Enable Email provider
   - For prototyping, you can disable "Confirm email" (optional)

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
│   ├── (auth)/          # Auth pages (login, signup)
│   ├── dashboard/       # Protected dashboard
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   └── globals.css      # Global styles
├── components/          # Reusable components
├── lib/
│   └── supabase/       # Supabase client configuration
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

## Next Steps

See the [PRD](./docs/My%20Workout%20Scheduler%20PRD.md) for the full roadmap. Upcoming features:

- Database schema setup
- Schedule management forms
- Gym credentials storage
- Booking automation (GitHub Actions + Puppeteer)

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The project is configured for zero-config Vercel deployment.