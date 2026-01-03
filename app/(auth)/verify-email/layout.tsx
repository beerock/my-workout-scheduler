import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email to activate automated gym class bookings. Check your inbox for the verification link.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
