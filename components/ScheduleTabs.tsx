'use client'

import { Tabs, TabPanel, Badge, Card, Button } from '@/components/ui'
import ScheduleList from './ScheduleList'
import BookingHistory from './BookingHistory'
import type { RecurringClass } from '@/lib/database.types'
import type { BookingHistoryItem } from '@/app/actions/booking-history'

type Props = {
  classes: RecurringClass[]
  history: BookingHistoryItem[]
  gymUrl?: string | null
  schedulePaused?: boolean
  onUpdate?: () => void
}

export default function ScheduleTabs({
  classes,
  history,
  gymUrl,
  schedulePaused = false,
  onUpdate
}: Props) {
  // Filter classes by status
  const activeClasses = classes.filter(c => c.active && !c.skip_next_occurrence)
  const skippedClasses = classes.filter(c => c.skip_next_occurrence)
  const inactiveClasses = classes.filter(c => !c.active)

  // Create tabs with counts
  const tabs = [
    {
      id: 'upcoming',
      label: `Upcoming (${activeClasses.length})`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: `History (${history.length})`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'skipped',
      label: skippedClasses.length > 0 ? `Skipped (${skippedClasses.length})` : 'Skipped',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
        </svg>
      ),
      disabled: skippedClasses.length === 0 && inactiveClasses.length === 0,
    },
  ]

  return (
    <Tabs tabs={tabs} defaultTab="upcoming">
      <TabPanel tabId="upcoming" activeTab="">
        {activeClasses.length > 0 ? (
          <ScheduleList
            classes={activeClasses}
            gymUrl={gymUrl}
            schedulePaused={schedulePaused}
            onUpdate={onUpdate}
          />
        ) : (
          <EmptyState
            title="No upcoming classes"
            description="Add a class to start building your workout schedule."
            icon={
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            action={
              <Button variant="primary" onClick={() => window.location.href = '/dashboard/schedule/add'}>
                + Add Your First Class
              </Button>
            }
          />
        )}

        {/* Show inactive classes at bottom */}
        {inactiveClasses.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-sora font-semibold text-gray-500">Inactive Classes</h3>
              <Badge variant="default" size="sm">{inactiveClasses.length}</Badge>
            </div>
            <ScheduleList
              classes={inactiveClasses}
              gymUrl={gymUrl}
              schedulePaused={schedulePaused}
              onUpdate={onUpdate}
            />
          </div>
        )}
      </TabPanel>

      <TabPanel tabId="history" activeTab="">
        {history.length > 0 ? (
          <BookingHistory history={history} totalCount={history.length} />
        ) : (
          <EmptyState
            title="No booking history yet"
            description="Once your classes start getting booked, you'll see the history here."
            icon={
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        )}
      </TabPanel>

      <TabPanel tabId="skipped" activeTab="">
        {skippedClasses.length > 0 ? (
          <ScheduleList
            classes={skippedClasses}
            gymUrl={gymUrl}
            schedulePaused={schedulePaused}
            onUpdate={onUpdate}
          />
        ) : (
          <EmptyState
            title="No skipped classes"
            description="When you skip a class, it will appear here until the skip expires."
            icon={
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            }
          />
        )}
      </TabPanel>
    </Tabs>
  )
}

// Empty state component
function EmptyState({
  title,
  description,
  icon,
  action
}: {
  title: string
  description: string
  icon: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card variant="outlined" padding="lg" className="text-center py-12">
      <div className="flex justify-center mb-4 opacity-0 animate-fade-in-up">
        {icon}
      </div>
      <h3 className="font-sora text-lg font-semibold text-gray-900 mb-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {title}
      </h3>
      <p className="text-gray-500 font-dm-sans mb-6 max-w-sm mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {description}
      </p>
      {action && (
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {action}
        </div>
      )}
    </Card>
  )
}
