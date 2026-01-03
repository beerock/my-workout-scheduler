import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scheduler Preview',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SchedulerV2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
