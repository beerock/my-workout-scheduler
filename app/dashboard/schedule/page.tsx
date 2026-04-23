import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getRecurringClasses } from '@/app/actions/recurring-classes'
import { getUserSettings } from '@/app/actions/user-settings'
import { getBookingHistory } from '@/app/actions/booking-history'
import { getDashboardStats } from '@/app/actions/dashboard-stats'
import EditorialLayout from '@/components/EditorialLayout'
import ScheduleList from '@/components/ScheduleList'
import RecentBookings from '@/components/RecentBookings'
import NextClassCard from '@/components/NextClassCard'
import PauseBanner from '@/components/PauseBanner'
import PausedActiveStatCard from '@/components/PausedActiveStatCard'
import GetStartedBanner from '@/components/GetStartedBanner'
import ActionItemsCard from '@/components/ActionItemsCard'
import SuccessRateCard from '@/components/SuccessRateCard'
import DashboardStatCard from '@/components/DashboardStatCard'
import Link from 'next/link'
import { Button, Divider } from '@/components/ui'

export const metadata: Metadata = {
  title: 'My Schedule',
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all data in parallel (including credentials to avoid waterfall)
  // For recent bookings, fetch 5 items but get 90-day total count (matches history page)
  const [classesResult, settingsResult, historyResult, statsResult, { data: credentials }] = await Promise.all([
    getRecurringClasses(),
    getUserSettings(),
    getBookingHistory(90, 5, 0),
    getDashboardStats(),
    supabase.from('gym_credentials').select('gym_url').eq('user_id', user.id).maybeSingle(),
  ])

  const classes = classesResult.success ? classesResult.classes || [] : []
  const settings = settingsResult.success ? settingsResult.settings : null
  const history = historyResult.success ? historyResult.history || [] : []
  const historyTotalCount = historyResult.success ? historyResult.totalCount || 0 : 0
  const stats = statsResult.success ? statsResult.stats : null

  const isPaused = settings?.schedule_paused ?? false

  return (
    <EditorialLayout
      title="My Schedule"
      subtitle="Your weekly classes. Add, edit, pause."
      actions={
        // Show inline pause control in header - only when classes exist AND not paused
        // (When paused, the content area banner provides the Resume action)
        classes.length > 0 && !isPaused && (
          <PauseBanner isPaused={isPaused} variant="inline" />
        )
      }
    >
      {/* Action items surface — Need-your-help tier, same pattern as /dashboard.
          Rendered above the banner so unresolved actions are the first thing
          a user sees when landing on the schedule page too. Hidden when empty. */}
      {stats?.actionItems && stats.actionItems.length > 0 && (
        <ActionItemsCard items={stats.actionItems} />
      )}

      {/* Pause Banner OR Next Class Card OR Get Started Banner - mutually exclusive */}
      {/* Show GetStartedBanner when no classes, regardless of pause state */}
      {classes.length === 0 ? (
        <GetStartedBanner />
      ) : isPaused ? (
        <PauseBanner isPaused={isPaused} variant="banner" />
      ) : stats?.nextBooking ? (
        <div className="mb-6">
          <NextClassCard
            dayTime={stats.nextBooking.dayTime}
            classType={stats.nextBooking.className}
            branch={stats.nextBooking.branch}
            hoursUntil={stats.nextBooking.hoursUntil}
            bookingStatus={stats.nextBooking.bookingStatus}
            bookingOpensAt={stats.nextBooking.bookingOpensAt}
            isRetrying={stats.nextBooking.isRetrying}
          />
        </div>
      ) : null}

      {/* Stats Grid - Asymmetric layout matching dashboard (Success Rate as hero) */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
          {/* Hero Stat: Success Rate - spans 2 cols */}
          <SuccessRateCard
            successRate={stats.successRate}
            totalAttempts={stats.totalBookingAttempts}
            animationDelay="0.1s"
          />

          {/* Standard Stat: Active Classes - Shows paused variant with Resume when schedule is paused */}
          {isPaused ? (
            <PausedActiveStatCard
              activeCount={stats.activeClasses}
              variant="standard"
              animationDelay="0.15s"
            />
          ) : (
            <DashboardStatCard
              label="Active Classes"
              value={stats.activeClasses}
              animationDelay="0.15s"
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          )}

          {/* Standard Stat: This Week */}
          <DashboardStatCard
            label="This Week"
            value={stats.bookingsThisWeek}
            animationDelay="0.2s"
            icon={
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>
      )}

      {/* Editorial Divider */}
      <Divider variant="editorial" className="my-6 sm:my-8" />

      {/* Section 1: Your Classes */}
      <section className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <h2 className="font-sora text-xl sm:text-2xl font-bold text-gray-900 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Your Classes
            </h2>
            <span className="font-dm-sans text-sm text-gray-500 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {classes.length} {classes.length === 1 ? 'class' : 'classes'}
            </span>
          </div>
          <Link
            href="/dashboard/schedule/add"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 transition-all opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.3s', boxShadow: '0 2px 8px rgba(26, 111, 255, 0.25)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Class</span>
          </Link>
        </div>

        <ScheduleList
          classes={classes}
          schedulePaused={isPaused}
        />
      </section>

      {/* Editorial Divider */}
      <Divider variant="editorial" className="my-6 sm:my-8" />

      {/* Section 2: Recent Bookings */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-sora text-xl sm:text-2xl font-bold text-gray-900 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Recent Bookings
          </h2>
          {historyTotalCount > 5 && (
            <Link
              href="/dashboard/schedule/history"
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              <Button variant="ghost-primary" size="sm" className="gap-1">
                View all {historyTotalCount}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          )}
        </div>

        <RecentBookings history={history} />
      </section>
    </EditorialLayout>
  )
}
