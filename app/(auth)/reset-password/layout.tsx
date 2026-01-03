import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Password',
  description: 'Create a new password for your My Workout Scheduler account.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
