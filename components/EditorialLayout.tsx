'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Main nav only has Schedule - Credentials moved to dropdown
  const navLinks = [
    { href: '/dashboard/schedule', label: 'Schedule' },
  ]
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
      {showHeader && (
        <header className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200/50 z-20">
          {/* Diagonal gradient accent bar - bottom of header */}
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1"
            style={{
              background: 'linear-gradient(to right, #1a6fff, #00c853, #8B5CF6)',
              clipPath: 'polygon(0% 0%, 100% 0%, 99.5% 100%, 0.5% 100%)',
            }}
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              {/* Logo/Title - Links to Dashboard */}
              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-sora text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors hidden sm:inline">
                  My Workout Scheduler
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg font-dm-sans text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* User dropdown */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User dropdown menu */}
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <Link
                          href="/dashboard/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-dm-sans"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <Link
                          href="/dashboard/credentials"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-dm-sans"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Credentials
                        </Link>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            handleLogout()
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-dm-sans text-left"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </nav>

              {/* Mobile menu button + dropdown */}
              <div className="relative md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>

                {/* Mobile dropdown menu - positioned below hamburger on right */}
                {mobileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-2">
                      <nav className="space-y-1">
                        {navLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-2.5 font-dm-sans text-sm font-medium transition-colors ${
                              isActive(link.href)
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {link.label}
                          </Link>
                        ))}
                        <Link
                          href="/dashboard/credentials"
                          className={`flex items-center gap-3 px-4 py-2.5 font-dm-sans text-sm font-medium transition-colors ${
                            isActive('/dashboard/credentials')
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Credentials
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          className={`flex items-center gap-3 px-4 py-2.5 font-dm-sans text-sm font-medium transition-colors ${
                            isActive('/dashboard/profile')
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <hr className="my-2 border-gray-200 mx-2" />
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false)
                            handleLogout()
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 font-dm-sans text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

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
      <footer className="relative z-0 border-t border-gray-200/50 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-dm-sans text-sm text-gray-500 text-center">
            © 2026 Beerock Studios
          </p>
        </div>
      </footer>
    </div>
  )
}
