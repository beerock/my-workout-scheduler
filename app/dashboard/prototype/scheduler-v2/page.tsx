'use client'

import { sora, dmSans } from '@/lib/fonts'
import Link from 'next/link'

export default function SchedulerV2Page() {
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

      {/* Electric Purple accent spotlight */}
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
          <div className="flex justify-between items-center">
            <div className="animate-fadeInUp">
              <h1 className="font-sora text-5xl font-bold text-gray-900 tracking-tight">
                My Workout Scheduler
              </h1>
              <p className="font-dm-sans text-gray-600 mt-2">
                Design System v2 • Scheduler Prototype
              </p>
            </div>
            <Link
              href="/dashboard/prototype"
              className="font-dm-sans text-sm text-gray-600 hover:text-[#1a6fff] transition-colors"
            >
              ← Back to Prototypes
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-16 relative">
        {/* Global Pause Banner - with diagonal resume button */}
        <div
          className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200/50 backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 animate-fadeInUp-delay-1"
          style={{
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.12)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="font-sora text-2xl font-bold text-gray-900">
                  All Bookings Paused
                </h2>
                <p className="font-dm-sans text-gray-600 mt-1">
                  Your schedule is preserved. Resume automatic bookings when you're ready.
                </p>
              </div>
            </div>
            {/* Rounded Resume Button */}
            <button
              className="px-6 py-3 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
              style={{
                boxShadow: '0 4px 12px rgba(0, 200, 83, 0.25)'
              }}
            >
              Resume Bookings
            </button>
          </div>
        </div>

        {/* Stats Dashboard - Asymmetric grid (2/3 + 1/3) */}
        <div className="grid grid-cols-3 gap-6">
          {/* Large stat card - spans 2 columns (standard rounded) */}
          <div
            className="col-span-2 bg-white rounded-2xl p-10 border border-gray-200/50 backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 animate-fadeInUp-delay-2"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-end gap-4">
              <div>
                <div className="font-sora text-8xl font-bold text-gray-900 leading-none">
                  98
                </div>
                <div className="font-dm-sans text-xl text-gray-500 mt-2">
                  Success Rate
                </div>
              </div>
              <div className="mb-4">
                <span className="font-sora text-5xl font-bold text-[#00c853]">%</span>
              </div>
            </div>
            {/* Diagonal progress bar */}
            <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="progress-bar-diagonal h-full bg-gradient-to-r from-[#00c853] to-[#1a6fff] animate-progressFill"
                style={{
                  width: '98%'
                }}
              ></div>
            </div>
          </div>

          {/* Tall stat card (standard rounded) */}
          <div
            className="bg-white rounded-2xl p-8 border border-gray-200/50 backdrop-blur-sm flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 animate-fadeInUp-delay-3"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-[#1a6fff]/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#1a6fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="font-sora text-5xl font-bold text-gray-900">
                47
              </div>
              <div className="font-dm-sans text-sm text-gray-600 mt-2">
                Classes Booked
              </div>
            </div>
          </div>

          {/* Small stat card (standard rounded) */}
          <div
            className="bg-white rounded-2xl p-6 border border-gray-200/50 hover:-translate-y-1 transition-all duration-300 animate-fadeInUp-delay-4"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="font-sora text-4xl font-bold text-gray-900">
              5
            </div>
            <div className="font-dm-sans text-sm text-gray-600 mt-1">
              Active Classes
            </div>
          </div>

          {/* FEATURED: Next Class Card - DIAGONAL CORNER (hybrid approach) */}
          <div
            className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-6 relative overflow-hidden flex items-center justify-between hover:-translate-y-1 transition-all duration-300 animate-fadeInUp-delay-5"
            style={{
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1)',
              clipPath: 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%)'
            }}
          >
            {/* Accent gradient overlays */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#1a6fff]/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#00c853]/15 to-transparent rounded-full blur-2xl"></div>

            <div className="relative">
              <div className="font-dm-sans text-sm text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00c853] animate-pulse"></div>
                Next Class
              </div>
              <div className="font-sora text-2xl font-bold text-white">
                Monday 4:15 PM
              </div>
              <div className="font-dm-sans text-slate-300 mt-1">
                BODYPUMP • Downtown YMCA
              </div>
            </div>
            <div className="relative w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">💪</span>
            </div>
          </div>
        </div>

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

        {/* Class Cards Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="font-sora text-4xl font-bold text-gray-900">
              Your Classes
            </h2>
            {/* Add Class Button - Rounded */}
            <button
              className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
              style={{
                boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Class
            </button>
          </div>

          {/* Class Card 1 - Offset to the right (standard rounded - hybrid) */}
          <div className="ml-0 lg:ml-16 animate-fadeInUp-delay-6">
            <div
              className="bg-white rounded-2xl p-8 border border-gray-200/50 backdrop-blur-sm relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Subtle gradient accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00c853]/5 to-transparent rounded-full blur-3xl"></div>

              <div className="relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-sora text-4xl font-bold text-gray-900">
                        BODYPUMP
                      </h3>
                      {/* Diagonal cut badge */}
                      <div
                        className="px-4 py-1.5 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-sm font-medium"
                        style={{
                          clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                        }}
                      >
                        Booked
                      </div>
                    </div>
                    <p className="font-dm-sans text-lg text-gray-700">
                      Monday 4:15 PM
                    </p>
                    <p className="font-dm-sans text-gray-500 mt-1">
                      Downtown YMCA
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#1a6fff]"></div>
                      <span className="font-dm-sans text-gray-600">
                        Next booking: Jan 6 at 2:15 PM
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Primary Rounded Button */}
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                    style={{
                      boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
                    }}
                  >
                    Skip Next
                  </button>
                  {/* Secondary Ghost Button */}
                  <button className="px-6 py-3 bg-gray-100 text-gray-700 font-dm-sans font-medium rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all">
                    Edit
                  </button>
                  <button className="p-3 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Class Card 2 - Offset to the left (standard rounded - hybrid) */}
          <div className="mr-0 lg:mr-16 animate-fadeInUp-delay-7">
            <div
              className="bg-white rounded-2xl p-8 border border-gray-200/50 backdrop-blur-sm relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Subtle gradient accent */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#ff9500]/5 to-transparent rounded-full blur-3xl"></div>

              <div className="relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-sora text-4xl font-bold text-gray-900">
                        CYCLING
                      </h3>
                      {/* Diagonal cut badge */}
                      <div
                        className="px-4 py-1.5 bg-gradient-to-r from-[#ff9500] to-[#ff6b00] text-white font-dm-sans text-sm font-medium"
                        style={{
                          clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                        }}
                      >
                        Pending
                      </div>
                    </div>
                    <p className="font-dm-sans text-lg text-gray-700">
                      Friday 7:00 AM
                    </p>
                    <p className="font-dm-sans text-gray-500 mt-1">
                      Westside YMCA
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#ff9500]"></div>
                      <span className="font-dm-sans text-gray-600">
                        Next booking: Jan 10 at 5:00 AM
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Primary Rounded Button */}
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                    style={{
                      boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
                    }}
                  >
                    Skip Next
                  </button>
                  {/* Secondary Ghost Button */}
                  <button className="px-6 py-3 bg-gray-100 text-gray-700 font-dm-sans font-medium rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all">
                    Edit
                  </button>
                  <button className="p-3 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Class Card 3 - With Waitlist status */}
          <div className="ml-0 lg:ml-8 animate-fadeInUp-delay-8">
            <div
              className="bg-white rounded-2xl p-8 border border-gray-200/50 backdrop-blur-sm relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Subtle gradient accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1a6fff]/5 to-transparent rounded-full blur-3xl"></div>

              <div className="relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-sora text-4xl font-bold text-gray-900">
                        YOGA
                      </h3>
                      {/* Diagonal cut badge - Waitlisted */}
                      <div
                        className="px-4 py-1.5 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans text-sm font-medium"
                        style={{
                          clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                        }}
                      >
                        Waitlisted
                      </div>
                    </div>
                    <p className="font-dm-sans text-lg text-gray-700">
                      Wednesday 6:00 PM
                    </p>
                    <p className="font-dm-sans text-gray-500 mt-1">
                      Downtown YMCA
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#1a6fff]"></div>
                      <span className="font-dm-sans text-gray-600">
                        Position #3 on waitlist
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Primary Rounded Button */}
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                    style={{
                      boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
                    }}
                  >
                    Skip Next
                  </button>
                  {/* Secondary Ghost Button */}
                  <button className="px-6 py-3 bg-gray-100 text-gray-700 font-dm-sans font-medium rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all">
                    Edit
                  </button>
                  <button className="p-3 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {/* Achievement Card - Electric Purple */}
        <div
          className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 relative overflow-hidden hover:-translate-y-1 transition-all duration-300 animate-fadeInUp-delay-9"
          style={{
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1)',
            clipPath: 'polygon(0% 0%, calc(100% - 24px) 0%, 100% 24px, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0% 100%)'
          }}
        >
          {/* Accent gradient overlays */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8B5CF6]/25 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#00c853]/15 to-transparent rounded-full blur-3xl"></div>

          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-dm-sans text-sm text-slate-400 uppercase tracking-wider">Achievement Unlocked</span>
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-dm-sans text-sm font-medium"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                  }}
                >
                  12 Week Streak
                </div>
              </div>
              <h3 className="font-sora text-4xl font-bold text-white mb-2">
                Perfect Attendance
              </h3>
              <p className="font-dm-sans text-slate-300">
                You haven't missed a single class in 12 weeks. Incredible commitment!
              </p>
            </div>
            <div className="text-7xl">🔥</div>
          </div>
        </div>
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

        @keyframes progressFill {
          from {
            width: 0;
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

        .animate-fadeInUp-delay-5 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.5s both;
        }

        .animate-fadeInUp-delay-6 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.6s both;
        }

        .animate-fadeInUp-delay-7 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.7s both;
        }

        .animate-fadeInUp-delay-8 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.8s both;
        }

        .animate-fadeInUp-delay-9 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.9s both;
        }

        .animate-progressFill {
          animation: progressFill 1.5s ease-out forwards;
        }

        /* Responsive diagonal progress bar */
        .progress-bar-diagonal {
          /* Mobile: 4% diagonal for visibility */
          clip-path: polygon(0% 0%, 100% 0%, 96% 100%, 0% 100%);
        }

        @media (min-width: 640px) {
          .progress-bar-diagonal {
            /* Tablet: 2% diagonal for balance */
            clip-path: polygon(0% 0%, 100% 0%, 98% 100%, 0% 100%);
          }
        }

        @media (min-width: 1024px) {
          .progress-bar-diagonal {
            /* Desktop: 1% diagonal for precision */
            clip-path: polygon(0% 0%, 100% 0%, 99% 100%, 0% 100%);
          }
        }
      `}</style>
    </div>
  )
}
