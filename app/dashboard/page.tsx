import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import PauseBanner from '@/components/PauseBanner'
import PausedActiveStatCard from '@/components/PausedActiveStatCard'
import EmailVerificationNotification from '@/components/EmailVerificationNotification'
import GetStartedBanner from '@/components/GetStartedBanner'
import ActionItemsCard from '@/components/ActionItemsCard'
import SuccessRateCard from '@/components/SuccessRateCard'
import { getUserSettings } from '@/app/actions/user-settings'
import { getDashboardStats } from '@/app/actions/dashboard-stats'
import { Card, Divider } from '@/components/ui'
import EditorialLayout from '@/components/EditorialLayout'
import NextClassCard from '@/components/NextClassCard'
import DashboardStatCard from '@/components/DashboardStatCard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user settings and dashboard stats in parallel
  const [settingsResult, statsResult] = await Promise.all([
    getUserSettings(),
    getDashboardStats(),
  ])

  const settings = settingsResult.success ? settingsResult.settings : null
  const stats = statsResult.success ? statsResult.stats : null
  const isPaused = settings?.schedule_paused ?? false

  return (
    <EditorialLayout
      title="Dashboard"
      subtitle={`Welcome back. Your automated booking is ${isPaused ? 'paused' : 'active'}.`}
      actions={
        // Show inline pause control in header - only when classes exist AND not paused
        // (When paused, the content area banner provides the Resume action)
        (stats?.activeClasses ?? 0) > 0 && !isPaused && (
          <PauseBanner isPaused={isPaused} variant="inline" />
        )
      }
    >
      <Suspense fallback={null}>
        <EmailVerificationNotification />
      </Suspense>

      {/* Action items surface — Need-your-help tier, rendered above the
          top banner so it's the first thing a user sees when something
          actually needs their attention. Hidden when the list is empty. */}
      {stats?.actionItems && stats.actionItems.length > 0 && (
        <ActionItemsCard items={stats.actionItems} />
      )}

      {/* Pause Banner OR Next Class Card OR Get Started Banner - mutually exclusive */}
      {/* Show GetStartedBanner when no classes, regardless of pause state */}
      {(stats?.activeClasses ?? 0) === 0 ? (
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

      {/* Stats Grid - Asymmetric layout with Success Rate as hero */}
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

      {/* Quick Actions Grid - Mobile: 1 col, Desktop: 3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Schedule Management */}
        <Link href="/dashboard/schedule" className="group">
          <Card
            variant="outlined"
            padding="md"
            hover
            className="h-full opacity-0 animate-fade-in-up border-l-4 border-l-primary-500 group-hover:border-l-primary-600 transition-colors"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sora text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  My Schedule
                </h3>
                <p className="font-dm-sans text-sm text-gray-500 mt-1">
                  Add, edit, and manage your recurring classes
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>

        {/* Gym Credentials */}
        <Link href="/dashboard/credentials" className="group">
          <Card
            variant="outlined"
            padding="md"
            hover
            className="h-full opacity-0 animate-fade-in-up border-l-4 border-l-secondary-500 group-hover:border-l-secondary-600 transition-colors"
            style={{ animationDelay: '0.35s' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-200 transition-colors">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sora text-lg font-bold text-gray-900 group-hover:text-secondary-600 transition-colors">
                  Gym Credentials
                </h3>
                <p className="font-dm-sans text-sm text-gray-500 mt-1">
                  Securely store your gym login credentials
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-secondary-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>

        {/* Account Settings */}
        <Link href="/dashboard/account" className="group">
          <Card
            variant="outlined"
            padding="md"
            hover
            className="h-full opacity-0 animate-fade-in-up border-l-4 border-l-success-500 group-hover:border-l-success-600 transition-colors"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0 group-hover:bg-success-200 transition-colors">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sora text-lg font-bold text-gray-900 group-hover:text-success-600 transition-colors">
                  Account
                </h3>
                <p className="font-dm-sans text-sm text-gray-500 mt-1">
                  Notifications, email, and password
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-success-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>
      </div>
    </EditorialLayout>
  )
}
