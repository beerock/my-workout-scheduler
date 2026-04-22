import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Footer } from '@/components/ui'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Workout Scheduler - Auto-Book Gym Classes',
  description: 'Never miss a popular gym class again. Set your schedule once and we automatically book your gym classes the instant registration opens. Free to use.',
  alternates: {
    canonical: '/',
  },
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen relative bg-gray-50 overflow-hidden">
      {/* Editorial background gradients */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 10%, rgba(26, 111, 255, 0.12) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-50 sm:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at 80% 60%, rgba(0, 200, 83, 0.08) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-50 sm:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at 90% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 40%)',
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] sm:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-sora text-lg sm:text-xl font-bold text-gray-900 hidden sm:inline">
                My Workout Scheduler
              </span>
            </div>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero badge — showcase voice (see docs/VOICE.md). "YMCA WNC"
                abbrev used here instead of "YMCA of Western NC" so the pill
                stays on one line at 320px (the long form widows "beta" onto
                a second line inside the pill, which reads as accidental).
                VOICE.md allows whichever compact form reads better in the
                target layout; on a rounded-pill badge at mobile widths,
                the shorter form always wins. */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-6 sm:mb-8 opacity-0 animate-fade-in-up"
            >
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" aria-hidden="true" />
              <span className="font-dm-sans text-sm text-primary-700 whitespace-nowrap">
                Invite-only · YMCA WNC beta
              </span>
            </div>

            {/* Heading — showcase voice, user-POV imperative. Names the
                gym network + the mechanism + the timing specifically, so
                the line could only describe this product and no other.
                `text-balance` uses CSS text-wrap: balance to keep the
                browser from leaving "opens." orphaned on a third line at
                sm/lg breakpoints. Period at the end is deliberate —
                signals craft on a portfolio-artifact landing, reads as
                a complete declarative statement rather than a tagline. */}
            <h1
              className="font-sora text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 opacity-0 animate-fade-in-up text-balance"
              style={{ animationDelay: '0.1s' }}
            >
              Auto-book your YMCA class the{' '}
              <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                second registration opens.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="font-dm-sans text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Add your class once — we grab your spot the moment registration
              opens. No more alarms, no more waiting.
            </p>

            {/* CTA Buttons — waitlist-primary since 99% of landing visitors
                aren't returning users. The header already carries a Sign In
                link for the ones who are, and the ghost secondary here gives
                returning users a second scan path into the same place. */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Link href="/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                  Join the waitlist
                </Button>
              </Link>
              {/* Outline (not ghost) for the returning-user CTA — ghost has
                  no border/background and disappears against the landing's
                  light radial-gradient background. Outline gives a visible
                  border that reads as "actionable" without competing with
                  the primary CTA's solid fill. */}
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  I already have an account
                </Button>
              </Link>
            </div>

            {/* Features Grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              {/* Outcome-framed cards (task 6 variant F2). Titles describe
                  what the reader gets, not what the product does — pairs
                  with the user-POV imperative headline above. */}
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-primary-500 hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">The 4:59 AM alarm, deleted</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Booking fires the instant registration opens — faster than a human could.
                </p>
              </Card>

              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-success-500 hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Set it once. Done.</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Add a recurring class; it auto-books every week until you say stop.
                </p>
              </Card>

              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-secondary-500 hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Gets in when others can't</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Full class? We retry every 15 minutes until a spot opens or class starts.
                </p>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
