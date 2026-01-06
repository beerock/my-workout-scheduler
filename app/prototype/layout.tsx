import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Design System',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PrototypeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
