import { SkeletonClassCard, Skeleton } from '@/components/ui'
import { Card } from '@/components/ui'

export default function ScheduleLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-card border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="font-sora text-xl font-semibold text-gray-900">
              My Workout Scheduler
            </h1>
            <Skeleton variant="rectangular" width={140} height={36} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <Skeleton variant="text" width="200px" height={32} className="mb-2" />
              <Skeleton variant="text" width="320px" height={16} />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton variant="rectangular" width={100} height={36} />
              <Skeleton variant="rectangular" width={120} height={40} />
            </div>
          </div>

          <div className="space-y-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <SkeletonClassCard />
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
