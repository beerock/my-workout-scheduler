import type { Metadata } from 'next'
import { sora, dmSans } from '@/lib/fonts'
import { ToastProvider } from '@/contexts/ToastContext'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://myworkout.beerock.com'),
  title: {
    default: 'My Workout Scheduler - Auto-Book Gym Classes',
    template: '%s | My Workout Scheduler',
  },
  description: 'Never miss a popular gym class again. Set your schedule once and we automatically book your gym classes the instant registration opens. Free to use.',
  keywords: ['gym booking', 'fitness class scheduler', 'automated booking', 'workout scheduler', 'class reservation', 'gym class automation'],
  authors: [{ name: 'My Workout Scheduler' }],
  creator: 'My Workout Scheduler',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'My Workout Scheduler',
    title: 'My Workout Scheduler - Auto-Book Gym Classes',
    description: 'Never miss a popular gym class again. Set your schedule once and we automatically book your gym classes the instant registration opens.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Workout Scheduler - Auto-Book Gym Classes',
    description: 'Never miss a popular gym class again. Set your schedule once and we automatically book your gym classes the instant registration opens.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="font-dm-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

