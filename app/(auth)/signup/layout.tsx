import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Invite Only',
  description: 'My Workout Scheduler is currently in private beta. Contact the team for an invite.',
  alternates: {
    canonical: '/signup',
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
