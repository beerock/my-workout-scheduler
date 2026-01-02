import type { Metadata } from 'next'
import { sora, dmSans } from '@/lib/fonts'
import { ToastProvider } from '@/contexts/ToastContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Workout Scheduler',
  description: 'Automatically book gym classes when registration opens',
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
      </body>
    </html>
  )
}

