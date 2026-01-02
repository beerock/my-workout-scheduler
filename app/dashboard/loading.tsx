import { Skeleton, SkeletonCard } from '@/components/ui'
import { Card } from '@/components/ui'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-card border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="font-sora text-xl font-semibold text-gray-900">
              My Workout Scheduler
            </h1>
            <Skeleton variant="rectangular" width={80} height={36} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <Skeleton variant="text" width="180px" height={32} className="mb-2" />
              <Skeleton variant="text" width="280px" height={20} />
            </div>
            <Skeleton variant="rectangular" width={120} height={40} />
          </div>

          {/* Stats Row Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                <Card variant="default" padding="md">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton variant="circular" width={20} height={20} />
                    <Skeleton variant="text" width="60%" height={14} />
                  </div>
                  <Skeleton variant="text" width="50%" height={32} className="mb-2" />
                </Card>
              </div>
            ))}
          </div>

          {/* Next Booking Widget Skeleton */}
          <div className="opacity-0 animate-fade-in-up mb-6" style={{ animationDelay: '0.5s' }}>
            <Card variant="outlined" padding="md" className="border-l-4 border-l-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton variant="rectangular" width={80} height={24} className="rounded" />
                    <Skeleton variant="text" width={120} height={16} />
                  </div>
                  <Skeleton variant="text" width="60%" height={24} className="mb-1" />
                  <Skeleton variant="text" width="40%" height={16} />
                </div>
                <div className="text-right ml-4">
                  <Skeleton variant="text" width={60} height={40} className="mb-1" />
                  <Skeleton variant="text" width={80} height={12} />
                </div>
              </div>
            </Card>
          </div>

          {/* Action Cards Skeleton */}
          <div className="space-y-4">
            {[0.6, 0.7, 0.8].map((delay, index) => (
              <div
                key={index}
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${delay}s` }}
              >
                <Card variant="outlined" padding="md">
                  <Skeleton variant="text" width="40%" height={24} className="mb-2" />
                  <Skeleton variant="rectangular" width="100%" height={44} className="mb-2" />
                  <Skeleton variant="text" width="70%" height={14} />
                </Card>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
