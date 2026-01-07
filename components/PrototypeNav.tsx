'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  shortLabel: string
  description: string
}

const navItems: NavItem[] = [
  {
    href: '/prototype',
    label: 'Case Study',
    shortLabel: 'Story',
    description: 'The Journey'
  },
  {
    href: '/prototype/scheduler-v2',
    label: 'Prototype',
    shortLabel: 'Scheduler',
    description: 'See It Applied'
  },
  {
    href: '/prototype/design-system-components',
    label: 'Components',
    shortLabel: 'Toolkit',
    description: '19 Components'
  }
]

export function PrototypeNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50">
      {/* Gradient accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background: 'linear-gradient(to right, #1a6fff, #00c853, #8B5CF6)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo / Home link - Text on mobile, icon-only on desktop */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-all group"
          >
            {/* Calendar icon - desktop only */}
            <div className="hidden sm:flex w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            {/* Text - mobile only */}
            <span className="sm:hidden font-dm-sans text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Home</span>
          </Link>

          {/* Center navigation */}
          <div className="flex items-center gap-0.5 sm:gap-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href
              const isFirst = index === 0
              const isLast = index === navItems.length - 1

              return (
                <div key={item.href} className="flex items-center">
                  <Link
                    href={item.href}
                    className={`
                      relative px-2 sm:px-4 py-1 sm:py-2 font-dm-sans text-sm sm:text-base font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                    style={isActive ? {
                      background: 'linear-gradient(to right, #1a6fff, #0052e6)',
                      clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                      boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
                    } : undefined}
                  >
                    {/* Mobile: short label, Desktop: full label */}
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>

                  {/* Connector dot (not after last item) */}
                  {!isLast && (
                    <div className="w-1 h-1 rounded-full bg-gray-300 mx-1 sm:mx-2 hidden sm:block" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Spacer for layout balance (matches home icon width) */}
          <div className="w-9" />
        </div>
      </div>
    </nav>
  )
}
