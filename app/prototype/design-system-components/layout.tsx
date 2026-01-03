import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Component Library',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DesignSystemComponentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
