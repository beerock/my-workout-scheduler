import type { Metadata } from 'next'
import ActionItemsCard from '@/components/ActionItemsCard'
import NextClassCard from '@/components/NextClassCard'
import EditorialLayout from '@/components/EditorialLayout'
import type { DashboardActionItem } from '@/app/actions/dashboard-stats'

export const metadata: Metadata = {
  title: 'Dashboard Preview (admin)',
}

/**
 * Dashboard component preview — admin-only visual-regression surface for
 * components that depend on uncommon data states (failure surface, pending
 * pre-window, pending retry loop). Lets the owner eyeball each variant
 * without having to orchestrate real failure conditions in production.
 *
 * Mirrors the pattern of /admin/email-preview. Add new states here as the
 * design system grows.
 */
export default function DashboardPreviewPage() {
  const credentialsItem: DashboardActionItem = {
    classId: 'preview-credentials',
    className: 'BODYPUMP HEAVY',
    dayTime: 'Wednesday 8:00 AM',
    branch: 'Woodfin YMCA',
    category: 'credentials',
    message: 'Your gym login stopped working. Update your credentials — booking picks up at your next class.',
    ctaText: 'Update credentials',
    ctaHref: '/dashboard/credentials',
  }

  const configItem: DashboardActionItem = {
    classId: 'preview-config',
    className: 'Racquetball',
    dayTime: 'Tuesday 11:30 AM',
    branch: 'Asheville YMCA',
    category: 'config',
    message: "Couldn't find this class on the YMCA schedule. It may have been renamed, rescheduled, or moved branches.",
    ctaText: 'Edit class',
    ctaHref: '/dashboard/schedule/edit/preview-config',
  }

  const extraItem: DashboardActionItem = {
    classId: 'preview-extra',
    className: 'Cycle',
    dayTime: 'Friday 6:00 AM',
    branch: 'Woodfin YMCA',
    category: 'config',
    message: "Couldn't find this class on the YMCA schedule. It may have been renamed, rescheduled, or moved branches.",
    ctaText: 'Edit class',
    ctaHref: '/dashboard/schedule/edit/preview-extra',
  }

  return (
    <EditorialLayout
      title="Dashboard Preview"
      subtitle="Admin-only visual reference for dashboard component states."
    >
      <div className="space-y-10 max-w-3xl">
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-4">
            ActionItemsCard
          </h2>

          <div className="space-y-6">
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Empty state (nothing rendered)
              </p>
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 font-dm-sans">
                No card — intentional. Pass an empty array and the component returns null.
              </div>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Single item — credentials category
              </p>
              <ActionItemsCard items={[credentialsItem]} />
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Single item — config category
              </p>
              <ActionItemsCard items={[configItem]} />
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Multi-item — credentials + config mix
              </p>
              <ActionItemsCard items={[credentialsItem, configItem, extraItem]} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-4">
            NextClassCard
          </h2>

          <div className="space-y-6">
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Confirmed
              </p>
              <NextClassCard
                dayTime="Monday 4:15 PM"
                classType="BODYPUMP"
                branch="Woodfin YMCA"
                hoursUntil={26}
                bookingStatus="confirmed"
              />
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Waitlisted
              </p>
              <NextClassCard
                dayTime="Saturday 9:30 AM"
                classType="BODYPUMP"
                branch="Woodfin YMCA"
                hoursUntil={98}
                bookingStatus="waitlisted"
              />
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                On deck — pre-window (booking window hasn't opened yet)
              </p>
              <NextClassCard
                dayTime="Wednesday 8:00 AM"
                classType="BODYPUMP HEAVY"
                branch="Woodfin YMCA"
                hoursUntil={40}
                bookingStatus="pending"
                bookingOpensAt="Tue, Apr 29 · 6:00 AM"
              />
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                On deck — within window, no active retry (default pending)
              </p>
              <NextClassCard
                dayTime="Wednesday 8:00 AM"
                classType="BODYPUMP HEAVY"
                branch="Woodfin YMCA"
                hoursUntil={20}
                bookingStatus="pending"
                bookingOpensAt={null}
              />
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Watching — actively retrying the class-full loop (isRetrying=true)
              </p>
              <NextClassCard
                dayTime="Wednesday 8:00 AM"
                classType="BODYPUMP HEAVY"
                branch="Woodfin YMCA"
                hoursUntil={20}
                bookingStatus="pending"
                bookingOpensAt={null}
                isRetrying
              />
            </div>
          </div>
        </section>
      </div>
    </EditorialLayout>
  )
}
