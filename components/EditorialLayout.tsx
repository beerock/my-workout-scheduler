'use client'

import React from 'react'
import { Header, Footer } from '@/components/ui'

type EditorialLayoutProps = {
  children: React.ReactNode
  title: string
  subtitle?: string
  backLink?: {
    href: string
    label: string
  }
  actions?: React.ReactNode
  showHeader?: boolean
  className?: string
}

/**
 * EditorialLayout - Premium editorial design wrapper
 *
 * Features:
 * - Radial gradient spotlight backgrounds
 * - Noise texture overlay for editorial feel
 * - Header with diagonal gradient accent bar
 * - Desktop navigation with user dropdown
 * - Mobile hamburger menu
 * - Mobile-first responsive design
 * - Consistent max-width and padding
 */
export default function EditorialLayout({
  children,
  title,
  subtitle,
  backLink,
  actions,
  showHeader = true,
  className = '',
}: EditorialLayoutProps) {
  return (
    <div className={`min-h-screen relative bg-gray-50 flex flex-col overflow-x-hidden ${className}`}>
      {/* === GRADIENT SPOTLIGHT LAYERS === */}
      {/* Blue spotlight - 12% opacity, top-left */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 10%, rgba(26, 111, 255, 0.08) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      {/* Green spotlight - 8% opacity, bottom-right (reduced on mobile for performance) */}
      <div
        className="fixed inset-0 pointer-events-none opacity-50 sm:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at 80% 60%, rgba(0, 200, 83, 0.06) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      {/* Purple accent spotlight - 6% opacity, top-right (hidden on mobile) */}
      <div
        className="fixed inset-0 pointer-events-none hidden sm:block"
        style={{
          background: 'radial-gradient(ellipse at 90% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 40%)',
        }}
        aria-hidden="true"
      />

      {/* Bottom ambient light */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 95%, rgba(239, 246, 255, 0.5) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Noise texture overlay - reduced opacity on mobile */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] sm:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />

      {/* === HEADER === */}
      {showHeader && <Header />}

      {/* === MAIN CONTENT === */}
      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Page header with title and actions */}
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="opacity-0 animate-fade-in-up">
              <h2 className="font-sora text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {title}
              </h2>
              {subtitle && (
                <p className="font-dm-sans text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                  {subtitle}
                </p>
              )}
            </div>

            {actions && (
              <div className="flex items-center gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Page content */}
        {children}
      </main>

      {/* === FOOTER === */}
      <Footer />
    </div>
  )
}
