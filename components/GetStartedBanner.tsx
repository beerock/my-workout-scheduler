import Link from 'next/link'

/**
 * GetStartedBanner - Encouraging empty state for new users
 *
 * Shows when user has no classes scheduled. Uses purple gradient
 * (achievement color) to make the empty state feel like an opportunity
 * rather than something missing.
 */
export default function GetStartedBanner() {
  return (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 opacity-0 animate-fade-in-up hover:-translate-y-1 transition-all duration-300"
      style={{
        boxShadow: '0 4px 24px rgba(139, 92, 246, 0.25), 0 8px 32px rgba(124, 58, 237, 0.15)',
      }}
    >
      {/* Decorative elements */}
      <div
        className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-2xl"
        aria-hidden="true"
      />

      {/* Floating sparkles decoration */}
      <div className="absolute top-4 right-8 sm:top-6 sm:right-12" aria-hidden="true">
        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white/30 animate-pulse" style={{ animationDuration: '2s' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
        </svg>
      </div>
      <div className="absolute top-12 right-4 sm:top-16 sm:right-6" aria-hidden="true">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/20 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
        </svg>
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
          >
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </div>
        </div>

        {/* Content — coach voice per docs/VOICE.md. Replaces the generic
            "Ready to Start Your Fitness Journey?" cliché with an
            outcome-forward line that previews what the product does. */}
        <div className="flex-1 min-w-0">
          <h2 className="font-sora text-xl sm:text-2xl font-bold text-white mb-1">
            Add one class. Skip every 4:59 AM alarm.
          </h2>
          <p className="font-dm-sans text-sm sm:text-base text-white/80">
            Tell us which YMCA class you want. From there, it auto-books every week the moment registration opens.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex-shrink-0">
          <Link
            href="/dashboard/schedule/add"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-700 font-dm-sans text-base font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-xl transition-all group"
            style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Class
          </Link>
        </div>
      </div>
    </div>
  )
}
