'use client'

import { sora, dmSans } from '@/lib/fonts'
import Link from 'next/link'

export default function PrototypePage() {
  return (
    <div
      className={`min-h-screen relative ${sora.variable} ${dmSans.variable}`}
      style={{
        background: '#f8f9fa'
      }}
    >
      {/* STRENGTHENED Radial Spotlight Layers - 12% blue, 8% green */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 10%, rgba(26, 111, 255, 0.12) 0%, transparent 50%)',
        }}
      ></div>

      {/* Secondary spotlight - STRENGTHENED */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 60%, rgba(0, 200, 83, 0.08) 0%, transparent 50%)',
        }}
      ></div>

      {/* NEW: Electric Purple accent spotlight */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 90% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 40%)',
        }}
      ></div>

      {/* Bottom ambient light */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 95%, rgba(239, 246, 255, 0.7) 0%, transparent 60%)',
        }}
      ></div>

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay'
        }}
      ></div>

      {/* Header with diagonal accent bar */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        {/* Diagonal gradient accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(to right, #1a6fff, #00c853, #8B5CF6)',
            clipPath: 'polygon(0% 0%, 100% 0%, 99.5% 100%, 0.5% 100%)'
          }}
        ></div>

        <div className="max-w-7xl mx-auto py-12 px-8">
          <div className="flex justify-between items-start">
            <div className="animate-fadeInUp">
              <h1 className="font-sora text-5xl font-bold text-gray-900 tracking-tight">
                Design System v2
              </h1>
              <p className="font-dm-sans text-gray-600 mt-2">
                Refined Editorial | Sora Typography | Full Diagonal Commitment
              </p>
            </div>
            <Link
              href="/dashboard/schedule"
              className="font-dm-sans text-sm text-gray-600 hover:text-[#1a6fff] transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Prototype Navigation */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard/prototype/scheduler-v2"
              className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all duration-200"
              style={{
                boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
              }}
            >
              Scheduler Redesign
            </Link>
            <Link
              href="/dashboard/prototype/design-system-components"
              className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all duration-200"
              style={{
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
              }}
            >
              Component Showcase
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-16 relative">

        {/* ============================================
            SECTION 1: TYPOGRAPHY COMPARISON
            ============================================ */}
        <section className="animate-fadeInUp">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Typography Refinement
            </h2>
            <div
              className="px-4 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-dm-sans text-sm font-medium"
              style={{
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
              }}
            >
              Updated
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Before: Space Grotesk */}
            <div
              className="bg-white/60 rounded-2xl p-8 border border-gray-200/50 relative overflow-hidden"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 rounded-full text-xs font-dm-sans text-gray-500">
                Before
              </div>
              <div className="space-y-4">
                <div style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-5xl font-bold text-gray-900">
                  Space Grotesk
                </div>
                <p className="font-dm-sans text-gray-600 text-sm">
                  Overused in AI-generated designs. Clean but generic.
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-2xl font-semibold text-gray-800">
                    The quick brown fox
                  </p>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-lg text-gray-600 mt-2">
                    Jumps over the lazy dog
                  </p>
                </div>
              </div>
            </div>

            {/* After: Sora */}
            <div
              className="bg-white p-8 border border-gray-200/50 relative overflow-hidden"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
                clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%)'
              }}
            >
              <div
                className="absolute top-4 right-4 px-3 py-1 bg-[#00c853] text-white rounded-full text-xs font-dm-sans font-medium"
              >
                After
              </div>
              <div className="space-y-4">
                <div className="font-sora text-5xl font-bold text-gray-900">
                  Sora
                </div>
                <p className="font-dm-sans text-gray-600 text-sm">
                  Modern geometric with fresh character. Less overused.
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <p className="font-sora text-2xl font-semibold text-gray-800">
                    The quick brown fox
                  </p>
                  <p className="font-sora text-lg text-gray-600 mt-2">
                    Jumps over the lazy dog
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Typography Scale with Sora */}
          <div
            className="mt-8 bg-white p-10 border border-gray-200/50"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
              clipPath: 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%)'
            }}
          >
            <h3 className="font-sora text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              Complete Type Scale
              <span className="text-sm font-normal text-gray-500">Sora + DM Sans</span>
            </h3>
            <div className="space-y-6">
              <div className="flex items-baseline gap-4">
                <span className="font-dm-sans text-xs text-gray-400 w-20 flex-shrink-0">8xl / 96px</span>
                <span className="font-sora text-8xl font-extrabold text-gray-900 leading-none">Fitness</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="font-dm-sans text-xs text-gray-400 w-20 flex-shrink-0">6xl / 60px</span>
                <span className="font-sora text-6xl font-bold text-gray-900">Your Schedule</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="font-dm-sans text-xs text-gray-400 w-20 flex-shrink-0">4xl / 36px</span>
                <span className="font-sora text-4xl font-bold text-gray-900">Dashboard Header</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="font-dm-sans text-xs text-gray-400 w-20 flex-shrink-0">2xl / 24px</span>
                <span className="font-sora text-2xl font-semibold text-gray-900">Section Title</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="font-dm-sans text-xs text-gray-400 w-20 flex-shrink-0">lg / 18px</span>
                <span className="font-dm-sans text-lg text-gray-700">Body text uses DM Sans for readability and warmth.</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="font-dm-sans text-xs text-gray-400 w-20 flex-shrink-0">sm / 14px</span>
                <span className="font-dm-sans text-sm text-gray-600">Secondary information and metadata</span>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="relative h-px overflow-visible my-16 flex justify-center">
          <div
            className="w-[60%] h-px relative"
            style={{
              background: 'linear-gradient(to right, rgba(26, 111, 255, 0) 0%, rgba(26, 111, 255, 0.15) 50%, rgba(26, 111, 255, 0) 100%)',
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5"
              style={{
                background: 'linear-gradient(to right, #1a6fff, #00c853)',
                clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
                opacity: 0.4,
                boxShadow: '0 0 20px rgba(26, 111, 255, 0.3)'
              }}
            ></div>
          </div>
        </div>

        {/* ============================================
            SECTION 2: BUTTON SYSTEM (Rounded for UX Clarity)
            ============================================ */}
        <section className="animate-fadeInUp-delay-1">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Button System
            </h2>
            <div
              className="px-4 py-1.5 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans text-sm font-medium"
              style={{
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
              }}
            >
              Rounded
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-10 border border-gray-200/50"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* UX Note */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="font-dm-sans text-sm text-blue-800">
                <strong>UX Decision:</strong> Buttons use standard rounded corners for clear affordance and to avoid confusion with diagonal badges.
              </p>
            </div>

            {/* Primary Buttons - Rounded */}
            <div className="mb-10">
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Primary Actions</h3>
              <div className="flex flex-wrap items-center gap-4">
                {/* Large Primary */}
                <button
                  className="px-8 py-4 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-semibold text-lg rounded-lg hover:-translate-y-1 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 16px rgba(26, 111, 255, 0.3), 0 8px 32px rgba(26, 111, 255, 0.15)'
                  }}
                >
                  Reserve Class
                </button>

                {/* Medium Primary */}
                <button
                  className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
                  }}
                >
                  Skip Next
                </button>

                {/* Small Primary */}
                <button
                  className="px-4 py-2 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium text-sm rounded-lg hover:-translate-y-0.5 transition-all duration-200"
                  style={{
                    boxShadow: '0 2px 8px rgba(26, 111, 255, 0.2)'
                  }}
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Success Buttons - Rounded */}
            <div className="mb-10">
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Success Actions</h3>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="px-8 py-4 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans font-semibold text-lg rounded-lg hover:-translate-y-1 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 16px rgba(0, 200, 83, 0.3), 0 8px 32px rgba(0, 200, 83, 0.15)'
                  }}
                >
                  Resume Bookings
                </button>

                <button
                  className="px-6 py-3 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 12px rgba(0, 200, 83, 0.25)'
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>

            {/* Secondary / Ghost Buttons */}
            <div className="mb-10">
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Secondary Actions</h3>
              <div className="flex flex-wrap items-center gap-4">
                {/* Outlined */}
                <button className="px-6 py-3 bg-transparent border-2 border-[#1a6fff] text-[#1a6fff] font-dm-sans font-medium rounded-lg hover:bg-[#1a6fff]/5 hover:-translate-y-0.5 transition-all duration-200">
                  View Details
                </button>

                {/* Ghost button */}
                <button className="px-6 py-3 bg-gray-100 text-gray-700 font-dm-sans font-medium rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200">
                  Cancel
                </button>
              </div>
            </div>

            {/* Danger Buttons */}
            <div className="mb-10">
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Danger Actions</h3>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="px-6 py-3 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 12px rgba(244, 63, 94, 0.25)'
                  }}
                >
                  Delete Class
                </button>

                <button className="px-6 py-3 bg-transparent border-2 border-[#f43f5e] text-[#f43f5e] font-dm-sans font-medium rounded-lg hover:bg-[#f43f5e]/5 hover:-translate-y-0.5 transition-all duration-200">
                  Remove
                </button>
              </div>
            </div>

            {/* Electric Purple - Achievement/Premium */}
            <div>
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                Achievement / Premium
                <span className="text-sm font-normal text-[#8B5CF6]">Electric Purple</span>
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-dm-sans font-semibold text-lg rounded-lg hover:-translate-y-1 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3), 0 8px 32px rgba(139, 92, 246, 0.15)'
                  }}
                >
                  Claim Reward
                </button>

                <button
                  className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
                  }}
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="relative h-px overflow-visible my-16 flex justify-center">
          <div
            className="w-[60%] h-px relative"
            style={{
              background: 'linear-gradient(to right, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(139, 92, 246, 0) 100%)',
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5"
              style={{
                background: 'linear-gradient(to right, #8B5CF6, #1a6fff)',
                clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
                opacity: 0.4,
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
              }}
            ></div>
          </div>
        </div>

        {/* ============================================
            SECTION 3: DIAGONAL CARD SYSTEM
            ============================================ */}
        <section className="animate-fadeInUp-delay-2">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Diagonal Card System
            </h2>
            <div
              className="px-4 py-1.5 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-sm font-medium"
              style={{
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
              }}
            >
              Refined
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Card with top-right corner cut */}
            <div
              className="bg-white p-8 border border-gray-200/50 relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
                clipPath: 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%)'
              }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#00c853]/8 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-sora text-2xl font-bold text-gray-900">
                    BODYPUMP
                  </h3>
                  <div
                    className="px-4 py-1.5 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-sm font-medium"
                    style={{
                      clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                    }}
                  >
                    Booked
                  </div>
                </div>
                <p className="font-dm-sans text-lg text-gray-700">Monday 4:15 PM</p>
                <p className="font-dm-sans text-gray-500 mt-1">Downtown YMCA</p>
                <div className="mt-6 flex gap-3">
                  <button
                    className="px-5 py-2.5 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium text-sm rounded-lg hover:-translate-y-0.5 transition-all"
                    style={{
                      boxShadow: '0 2px 8px rgba(26, 111, 255, 0.2)'
                    }}
                  >
                    Skip Next
                  </button>
                  <button className="px-5 py-2.5 bg-gray-100 text-gray-700 font-dm-sans font-medium text-sm rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all">
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Card with bottom-right corner cut */}
            <div
              className="bg-white p-8 border border-gray-200/50 relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
                clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%)'
              }}
            >
              <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[#ff9500]/8 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-sora text-2xl font-bold text-gray-900">
                    CYCLING
                  </h3>
                  <div
                    className="px-4 py-1.5 bg-gradient-to-r from-[#ff9500] to-[#ff6b00] text-white font-dm-sans text-sm font-medium"
                    style={{
                      clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                    }}
                  >
                    Pending
                  </div>
                </div>
                <p className="font-dm-sans text-lg text-gray-700">Friday 7:00 AM</p>
                <p className="font-dm-sans text-gray-500 mt-1">Westside YMCA</p>
                <div className="mt-6 flex gap-3">
                  <button
                    className="px-5 py-2.5 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium text-sm rounded-lg hover:-translate-y-0.5 transition-all"
                    style={{
                      boxShadow: '0 2px 8px rgba(26, 111, 255, 0.2)'
                    }}
                  >
                    Skip Next
                  </button>
                  <button className="px-5 py-2.5 bg-gray-100 text-gray-700 font-dm-sans font-medium text-sm rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all">
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Card - Double diagonal */}
            <div
              className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-10 relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
              style={{
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1)',
                clipPath: 'polygon(0% 0%, calc(100% - 24px) 0%, 100% 24px, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0% 100%)'
              }}
            >
              {/* Accent gradient overlays */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1a6fff]/20 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#00c853]/15 to-transparent rounded-full blur-3xl"></div>

              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-dm-sans text-sm text-slate-400 uppercase tracking-wider">Featured Achievement</span>
                    <div
                      className="px-4 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-dm-sans text-sm font-medium"
                      style={{
                        clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                      }}
                    >
                      Streak
                    </div>
                  </div>
                  <h3 className="font-sora text-4xl font-bold text-white mb-2">
                    12 Week Perfect Attendance
                  </h3>
                  <p className="font-dm-sans text-slate-300">
                    You haven&apos;t missed a single class in 12 weeks. Incredible commitment!
                  </p>
                </div>
                <div className="text-7xl">&#128293;</div>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="relative h-px overflow-visible my-16 flex justify-center">
          <div
            className="w-[60%] h-px relative"
            style={{
              background: 'linear-gradient(to right, rgba(0, 200, 83, 0) 0%, rgba(0, 200, 83, 0.15) 50%, rgba(0, 200, 83, 0) 100%)',
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5"
              style={{
                background: 'linear-gradient(to right, #00c853, #8B5CF6)',
                clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
                opacity: 0.4,
                boxShadow: '0 0 20px rgba(0, 200, 83, 0.3)'
              }}
            ></div>
          </div>
        </div>

        {/* ============================================
            SECTION 4: BADGE SYSTEM (Complete)
            ============================================ */}
        <section className="animate-fadeInUp-delay-3">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Complete Badge System
            </h2>
          </div>

          <div
            className="bg-white rounded-2xl p-10 border border-gray-200/50"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {/* Booked / Confirmed */}
              <div className="space-y-2">
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-sm font-medium inline-block"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                  }}
                >
                  Booked
                </div>
                <p className="font-dm-sans text-xs text-gray-500">Confirmed status</p>
              </div>

              {/* Pending */}
              <div className="space-y-2">
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-[#ff9500] to-[#ff6b00] text-white font-dm-sans text-sm font-medium inline-block"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                  }}
                >
                  Pending
                </div>
                <p className="font-dm-sans text-xs text-gray-500">Awaiting booking</p>
              </div>

              {/* Waitlisted */}
              <div className="space-y-2">
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans text-sm font-medium inline-block"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                  }}
                >
                  Waitlisted
                </div>
                <p className="font-dm-sans text-xs text-gray-500">On waitlist</p>
              </div>

              {/* Failed */}
              <div className="space-y-2">
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-dm-sans text-sm font-medium inline-block"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                  }}
                >
                  Failed
                </div>
                <p className="font-dm-sans text-xs text-gray-500">Booking failed</p>
              </div>

              {/* Skipped */}
              <div className="space-y-2">
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-dm-sans text-sm font-medium inline-block"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                  }}
                >
                  Skipped
                </div>
                <p className="font-dm-sans text-xs text-gray-500">User skipped</p>
              </div>

              {/* Achievement - Purple */}
              <div className="space-y-2">
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-dm-sans text-sm font-medium inline-block"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                  }}
                >
                  Streak
                </div>
                <p className="font-dm-sans text-xs text-gray-500">Achievement</p>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="relative h-px overflow-visible my-16 flex justify-center">
          <div
            className="w-[60%] h-px relative"
            style={{
              background: 'linear-gradient(to right, rgba(26, 111, 255, 0) 0%, rgba(26, 111, 255, 0.15) 50%, rgba(26, 111, 255, 0) 100%)',
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5"
              style={{
                background: 'linear-gradient(to right, #1a6fff, #8B5CF6, #00c853',
                clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
                opacity: 0.4,
                boxShadow: '0 0 20px rgba(26, 111, 255, 0.3)'
              }}
            ></div>
          </div>
        </div>

        {/* ============================================
            SECTION 5: DESIGN SYSTEM SUMMARY
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 relative overflow-hidden"
            style={{
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1)',
              clipPath: 'polygon(0% 0%, calc(100% - 32px) 0%, 100% 32px, 100% 100%, 32px 100%, 0% calc(100% - 32px))',
              borderRadius: '0'
            }}
          >
            {/* Background accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#1a6fff]/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#00c853]/15 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-[#8B5CF6]/15 to-transparent rounded-full blur-3xl"></div>

            <div className="relative">
              <h2 className="font-sora text-4xl font-bold text-white mb-8">
                Design System v2 Summary
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-sora text-xl font-semibold text-white flex items-center gap-3">
                    <span className="text-[#00c853]">&#10003;</span>
                    Typography
                  </h3>
                  <ul className="space-y-2 font-dm-sans text-slate-300">
                    <li>&#8226; Display: <span className="text-white font-medium">Sora</span> (replacing Space Grotesk)</li>
                    <li>&#8226; Body: <span className="text-white font-medium">DM Sans</span> (unchanged)</li>
                    <li>&#8226; Fresher, less AI-generic feel</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-sora text-xl font-semibold text-white flex items-center gap-3">
                    <span className="text-[#00c853]">&#10003;</span>
                    Diagonal System
                  </h3>
                  <ul className="space-y-2 font-dm-sans text-slate-300">
                    <li>&#8226; Badges: <span className="text-white font-medium">8% diagonal cut</span></li>
                    <li>&#8226; Buttons: <span className="text-white font-medium">Rounded corners</span> (UX clarity)</li>
                    <li>&#8226; Cards: <span className="text-white font-medium">Corner clips</span></li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-sora text-xl font-semibold text-white flex items-center gap-3">
                    <span className="text-[#00c853]">&#10003;</span>
                    Colors
                  </h3>
                  <ul className="space-y-2 font-dm-sans text-slate-300">
                    <li>&#8226; Primary: <span className="text-[#1a6fff] font-medium">#1a6fff</span></li>
                    <li>&#8226; Success: <span className="text-[#00c853] font-medium">#00c853</span></li>
                    <li>&#8226; Warning: <span className="text-[#ff9500] font-medium">#ff9500</span></li>
                    <li>&#8226; Danger: <span className="text-[#f43f5e] font-medium">#f43f5e</span></li>
                    <li>&#8226; Purple: <span className="text-[#8B5CF6] font-medium">#8B5CF6</span> (achievements)</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-sora text-xl font-semibold text-white flex items-center gap-3">
                    <span className="text-[#8B5CF6]">&#9733;</span>
                    Component Library
                  </h3>
                  <ul className="space-y-2 font-dm-sans text-slate-300">
                    <li>&#8226; <span className="text-white font-medium">15 components</span> in components/ui/</li>
                    <li>&#8226; Button, Badge, Card, Modal, Input, Select...</li>
                    <li>&#8226; Toast, Skeleton, Tabs, and more</li>
                  </ul>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="font-dm-sans text-slate-400 text-sm">
                  Component library fully extracted. See /dashboard/prototype/design-system-components for interactive showcase.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            translate: 0 20px;
          }
          to {
            opacity: 1;
            translate: 0 0;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out both;
        }

        .animate-fadeInUp-delay-1 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.1s both;
        }

        .animate-fadeInUp-delay-2 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .animate-fadeInUp-delay-3 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.3s both;
        }

        .animate-fadeInUp-delay-4 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.4s both;
        }
      `}</style>
    </div>
  )
}
