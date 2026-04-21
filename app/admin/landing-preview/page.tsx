import type { Metadata } from 'next'
import EditorialLayout from '@/components/EditorialLayout'
import { Card } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Landing Preview (admin)',
}

/**
 * Landing-page variant review surface — task 6.
 *
 * The landing is the product's public face and doubles as a portfolio
 * artifact for prospective clients, so craft decisions there deserve the
 * same variant-review pattern tasks 3 and 4 used for dashboard copy and
 * form layout. Everything here is static presentation — the real landing
 * at `/` isn't wired to any of this until the owner picks a direction.
 *
 * Voice reference: docs/VOICE.md § "Landing-page showcase voice".
 */
export default function LandingPreviewPage() {
  return (
    <EditorialLayout
      title="Landing Preview"
      subtitle="Admin-only variant surface for the public landing at `/`. Showcase voice only (see docs/VOICE.md). Pick one direction per section."
    >
      <div className="space-y-16">
        {/* ─────────────────── PART 1: CURRENT (BASELINE) ─────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            Current — baseline
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            What's live on `/` today. All variants below should be compared
            against this.
          </p>

          <HeroCard>
            <Badge />
            <h1 className="font-sora text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              Never miss a{' '}
              <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                popular class
              </span>{' '}
              again
            </h1>
            <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Set up your schedule once, and we'll automatically book your gym
              classes the instant registration opens. No more alarms, no more
              waiting.
            </p>
            <CTAs />
          </HeroCard>
        </section>

        {/* ────────────────────── PART 2: HEADLINES ────────────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            Headline variants
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            Subtitle + CTAs held constant (current versions) so the headline's
            the only thing that changes.
          </p>

          <div className="space-y-6">
            <VariantLabel>H1 — Specific hour, concrete outcome</VariantLabel>
            <HeroCard>
              <Badge />
              <h1 className="font-sora text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                The 4:59 AM alarm{' '}
                <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                  never goes off
                </span>{' '}
                again.
              </h1>
              <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Set up your schedule once, and we'll automatically book your
                gym classes the instant registration opens. No more alarms, no
                more waiting.
              </p>
              <CTAs />
            </HeroCard>

            <VariantLabel>H2 — Plain-spoken product promise</VariantLabel>
            <HeroCard>
              <Badge />
              <h1 className="font-sora text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                Auto-books your YMCA class the{' '}
                <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                  instant registration opens.
                </span>
              </h1>
              <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Set up your schedule once, and we'll automatically book your
                gym classes the instant registration opens. No more alarms, no
                more waiting.
              </p>
              <CTAs />
            </HeroCard>

            <VariantLabel>
              H3 — Outcome-first, names the payoff (less fitness-app, more
              weekly-life)
            </VariantLabel>
            <HeroCard>
              <Badge />
              <h1 className="font-sora text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                Your{' '}
                <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                  Sunday 2:15 PM
                </span>{' '}
                books itself.
              </h1>
              <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Set up your schedule once, and we'll automatically book your
                gym classes the instant registration opens. No more alarms, no
                more waiting.
              </p>
              <CTAs />
            </HeroCard>

            <VariantLabel>H4 — Shortest, two-beat rhythm</VariantLabel>
            <HeroCard>
              <Badge />
              <h1 className="font-sora text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                Set it once.{' '}
                <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                  Every week, booked.
                </span>
              </h1>
              <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Set up your schedule once, and we'll automatically book your
                gym classes the instant registration opens. No more alarms, no
                more waiting.
              </p>
              <CTAs />
            </HeroCard>
          </div>
        </section>

        {/* ────────────────────── PART 3: SUBTITLES ────────────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            Subtitle variants
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            Headline locked to current. Subtitle supports the headline — keep
            it shorter, keep it specific.
          </p>

          <div className="space-y-6">
            <VariantLabel>S1 — Current (kept for reference)</VariantLabel>
            <HeroCard>
              <Badge />
              <CurrentHeadline />
              <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Set up your schedule once, and we'll automatically book your
                gym classes the instant registration opens. No more alarms, no
                more waiting.
              </p>
              <CTAs />
            </HeroCard>

            <VariantLabel>S2 — Tighter, one sentence</VariantLabel>
            <HeroCard>
              <Badge />
              <CurrentHeadline />
              <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Add your class once — every week, we grab your spot the moment
                registration opens.
              </p>
              <CTAs />
            </HeroCard>

            <VariantLabel>S3 — Names the mechanism, no "we"</VariantLabel>
            <HeroCard>
              <Badge />
              <CurrentHeadline />
              <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Add your recurring class; the booking fires the second the
                window opens. Nothing to watch, nothing to remember.
              </p>
              <CTAs />
            </HeroCard>

            <VariantLabel>S4 — Two beats, more rhythm</VariantLabel>
            <HeroCard>
              <Badge />
              <CurrentHeadline />
              <p className="font-dm-sans text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Set your recurring schedule once. Every week, the booking
                fires the moment registration opens.
              </p>
              <CTAs />
            </HeroCard>
          </div>
        </section>

        {/* ──────────────────── PART 4: FEATURE CARDS ──────────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            Feature cards — framing
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            The three cards below the hero. Current reads as a generic
            feature-bullet list ("Instant Booking", "Smart Retry") —
            alternatives frame the same features as user outcomes.
          </p>

          <div className="space-y-8">
            <VariantLabel>F1 — Current (feature-bullet framing)</VariantLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-primary-500">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-3">
                  <ClockIcon />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Instant Booking</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Books the moment registration opens, faster than humanly possible
                </p>
              </Card>
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-success-500">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center mb-3">
                  <CalendarIcon className="text-success-600" />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Weekly Schedule</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Set your recurring classes once and forget about it
                </p>
              </Card>
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-secondary-500">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center mb-3">
                  <CheckIcon />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Smart Retry</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  If class is full, we keep trying until a spot opens up
                </p>
              </Card>
            </div>

            <VariantLabel>
              F2 — Outcome-framed (titles describe what the reader gets, not
              what the product does)
            </VariantLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-primary-500">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-3">
                  <ClockIcon />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">The 4:59 AM alarm, deleted</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Booking fires the instant registration opens — faster than a human could.
                </p>
              </Card>
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-success-500">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center mb-3">
                  <CalendarIcon className="text-success-600" />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">One setup, every week</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Add a recurring class; it auto-books every week until you say stop.
                </p>
              </Card>
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-secondary-500">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center mb-3">
                  <CheckIcon />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Gets in when others can't</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Full class? We retry every 15 minutes until a spot opens or class starts.
                </p>
              </Card>
            </div>

            <VariantLabel>
              F3 — Editorial / one-line (fewer words, more white space —
              relies on the heading doing the work)
            </VariantLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-primary-500">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-3">
                  <ClockIcon />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Fires on the second</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  The moment registration opens, your seat is grabbed.
                </p>
              </Card>
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-success-500">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center mb-3">
                  <CalendarIcon className="text-success-600" />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Set once, forget</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Recurring schedule, weekly auto-booking. That's it.
                </p>
              </Card>
              <Card variant="outlined" padding="md" className="text-left border-l-4 border-l-secondary-500">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center mb-3">
                  <CheckIcon />
                </div>
                <h3 className="font-sora font-bold text-gray-900 mb-1">Retries on full</h3>
                <p className="font-dm-sans text-sm text-gray-600">
                  Class is packed? We keep watching until a spot opens up.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* ─────────────────────── PART 5: CTAs ────────────────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            CTA button copy
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            Primary CTA goes to `/login`, secondary goes to `/signup` (which
            is the waitlist form). "Request an Invite" slightly misframes the
            flow — `/signup` doesn't grant an invite, it joins the waitlist.
          </p>

          <div className="space-y-4">
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Current
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PreviewButton variant="primary">Sign In</PreviewButton>
                <PreviewButton variant="outline">Request an Invite</PreviewButton>
              </div>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                C1 — Waitlist framing (matches what `/signup` actually does)
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PreviewButton variant="primary">Sign In</PreviewButton>
                <PreviewButton variant="outline">Join the waitlist</PreviewButton>
              </div>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                C2 — Drops "Sign In" to single-CTA (there's already a Sign In
                link in the header; the hero CTA should just drive waitlist
                signups for the ~99% of visitors who aren't already users)
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PreviewButton variant="primary">Join the waitlist</PreviewButton>
              </div>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                C3 — Primary + secondary but swapped emphasis (waitlist is
                primary, sign-in is ghost)
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PreviewButton variant="primary">Join the waitlist</PreviewButton>
                <PreviewButton variant="ghost">I already have an account</PreviewButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </EditorialLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Preview atoms — kept inline so the page is a single-file artifact the
// owner can diff against the real landing at `/` without jumping files.
// ──────────────────────────────────────────────────────────────────────

function HeroCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 text-center">
      {children}
    </div>
  )
}

function Badge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-5">
      <div className="w-2 h-2 rounded-full bg-success-500" aria-hidden="true" />
      <span className="font-dm-sans text-sm text-primary-700">
        Invite-only · YMCA of Western NC beta
      </span>
    </div>
  )
}

function CurrentHeadline() {
  return (
    <h1 className="font-sora text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
      Never miss a{' '}
      <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
        popular class
      </span>{' '}
      again
    </h1>
  )
}

function CTAs() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <PreviewButton variant="primary">Sign In</PreviewButton>
      <PreviewButton variant="outline">Request an Invite</PreviewButton>
    </div>
  )
}

function VariantLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2 mt-6 first:mt-0">
      {children}
    </p>
  )
}

// Static button styles — not a real <Button> because the preview just needs
// to render the visual. Keeps the preview page a pure server component.
function PreviewButton({
  variant,
  children,
}: {
  variant: 'primary' | 'outline' | 'ghost'
  children: React.ReactNode
}) {
  const base =
    'inline-flex items-center justify-center font-dm-sans font-semibold rounded-lg px-6 py-3 text-base transition-all'
  const byVariant = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
    outline:
      'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-primary-600 hover:bg-primary-50',
  }[variant]
  return <span className={`${base} ${byVariant}`}>{children}</span>
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CalendarIcon({ className = 'text-primary-600' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
