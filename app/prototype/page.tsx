'use client'

import { sora, dmSans } from '@/lib/fonts'
import Link from 'next/link'
import { Footer } from '@/components/ui'
import { PrototypeNav } from '@/components/PrototypeNav'

export default function PrototypePage() {
  return (
    <div
      className={`min-h-screen relative overflow-x-hidden ${sora.variable} ${dmSans.variable}`}
      style={{
        background: '#f8f9fa'
      }}
    >
      {/* Radial Spotlight Layers */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 10%, rgba(26, 111, 255, 0.12) 0%, transparent 50%)',
        }}
      ></div>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 60%, rgba(0, 200, 83, 0.08) 0%, transparent 50%)',
        }}
      ></div>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 90% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 40%)',
        }}
      ></div>
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

      {/* Navigation */}
      <PrototypeNav />

      {/* ============================================
          SECTION 1: HERO - The Hook
          ============================================ */}
      <header className="relative pt-12 pb-20 px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main headline */}
          <h1
            className="font-sora text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-tight animate-fadeInUp"
            style={{ animationDelay: '0.1s' }}
          >
            A Design System That Doesn&apos;t
            <br />
            <span className="text-gradient-primary">Look Like AI Slop</span>
          </h1>

          {/* Goal statement with accent bar */}
          <div
            className="relative max-w-2xl mx-auto mt-10 animate-fadeInUp"
            style={{ animationDelay: '0.15s' }}
          >
            <div
              className="relative pl-5 py-4 text-left bg-white/60 backdrop-blur-sm rounded-r-lg border-l-0"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Gradient accent bar */}
              <div
                className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, #1a6fff, #00c853)',
                }}
              />
              <p className="font-dm-sans text-gray-700 text-base sm:text-lg leading-relaxed">
                <span className="font-semibold text-gray-900">The challenge:</span>{' '}
                Create a reusable, scalable design system guided by clear product goals—then build a workflow where every design decision stays consistent, documented, and production-ready.
              </p>
            </div>
          </div>

          {/* Subtext */}
          <p
            className="font-dm-sans text-lg text-gray-500 mt-8 max-w-xl mx-auto animate-fadeInUp"
            style={{ animationDelay: '0.2s' }}
          >
            5 days. 18 components. One methodology for every future project.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16 sm:space-y-24 relative">

        {/* ============================================
            SECTION 2: IT STARTED WITH 3 DIRECTIONS
            ============================================ */}
        <section className="animate-fadeInUp-delay-1">
          <div className="text-center mb-12">
            <h2 className="font-sora text-3xl sm:text-4xl font-bold text-gray-900">
              It Started With 3 Directions
            </h2>
            <p className="font-dm-sans text-gray-600 mt-3 max-w-xl mx-auto">
              Before committing to any aesthetic, we explored distinct visual directions—each designed for a gym/fitness audience.
            </p>
          </div>

          {/* 3 Direction Cards - Enhanced with Visual Personality */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            {/* Direction 1: Brutalist */}
            <div
              className="relative bg-white rounded-lg p-6 overflow-hidden"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Harsh geometric accent */}
              <div
                className="absolute top-0 right-0 w-16 h-16"
                style={{
                  background: '#ff3b3b',
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                }}
              />

              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1.5">
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#0a0a0a' }} />
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#ffffff' }} />
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#ff3b3b' }} />
                </div>
                <span className="font-dm-sans text-xs text-gray-400 uppercase tracking-wider">01</span>
              </div>

              {/* Typography hero */}
              <h3
                className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none"
                style={{ fontFamily: 'Impact, Haettenschweiler, sans-serif' }}
              >
                BRUTALIST
              </h3>

              {/* Harsh divider line */}
              <div className="w-full h-0.5 bg-black my-3" />

              <p className="font-dm-sans text-sm text-gray-500">
                Impact · Raw · High Contrast
              </p>
            </div>

            {/* Direction 2: Soft/Organic */}
            <div
              className="relative bg-white rounded-lg p-6 overflow-hidden"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Soft blob accent */}
              <div
                className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-40"
                style={{ background: 'linear-gradient(135deg, #fda4af, #a78bfa)' }}
              />
              <div
                className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full opacity-30"
                style={{ background: 'linear-gradient(135deg, #93c5fd, #a5f3fc)' }}
              />

              {/* Header row */}
              <div className="flex items-center justify-between mb-4 relative">
                <div className="flex gap-1.5">
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#fda4af' }} />
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#a78bfa' }} />
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#93c5fd' }} />
                </div>
                <span className="font-dm-sans text-xs text-gray-400 uppercase tracking-wider">02</span>
              </div>

              {/* Typography hero */}
              <h3
                className="text-3xl font-normal text-gray-800 leading-tight italic relative"
                style={{ fontFamily: 'Georgia, Cambria, serif' }}
              >
                Soft &amp; Organic
              </h3>

              {/* Soft gradient divider */}
              <div
                className="w-2/3 h-0.5 rounded-full my-3"
                style={{ background: 'linear-gradient(to right, #fda4af, #a78bfa, transparent)' }}
              />

              <p className="font-dm-sans text-sm text-gray-500 relative">
                Georgia · Calming · Approachable
              </p>
            </div>

            {/* Direction 3: Editorial (SELECTED) */}
            <div
              className="relative bg-white rounded-lg p-6 overflow-hidden ring-2 ring-success-500 ring-offset-2"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Selected checkmark */}
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-success-500 rounded-full flex items-center justify-center z-10">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Diagonal accent element */}
              <div
                className="absolute top-0 right-8 w-2 h-12"
                style={{
                  background: 'linear-gradient(to bottom, #1a6fff, #00c853)',
                  transform: 'skewX(-12deg)',
                }}
              />

              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1.5">
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#1a6fff' }} />
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#00c853' }} />
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: '#ffffff' }} />
                </div>
                <span className="font-dm-sans text-xs text-gray-400 uppercase tracking-wider">03</span>
              </div>

              {/* Typography hero */}
              <h3 className="font-sora text-3xl font-bold text-gray-900 leading-tight">
                Editorial
              </h3>

              {/* Diagonal gradient divider */}
              <div
                className="w-1/2 h-0.5 my-3"
                style={{
                  background: 'linear-gradient(to right, #1a6fff, #00c853)',
                  clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 0% 100%)',
                }}
              />

              <p className="font-dm-sans text-sm text-gray-500">
                Sora + DM Sans · Confident · Dynamic
              </p>
            </div>
          </div>

          {/* Key insight */}
          <div className="mt-10 text-center">
            <p className="font-dm-sans text-lg text-gray-700">
              <span className="font-medium">The choice:</span> Editorial won—its diagonal energy matched the forward momentum of fitness culture.
            </p>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="editorial-divider"></div>

        {/* ============================================
            SECTION 3: THE JOURNEY - Evolution Timeline
            ============================================ */}
        <section className="animate-fadeInUp-delay-2">
          <div className="text-center mb-12">
            <h2 className="font-sora text-3xl sm:text-4xl font-bold text-gray-900">
              The Journey
            </h2>
            <p className="font-dm-sans text-gray-600 mt-3 max-w-xl mx-auto">
              5 days from exploration to production-ready design system.
            </p>
          </div>

          {/* Starting point context */}
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
              <span className="font-sora text-xs font-bold text-gray-400">v0</span>
            </div>
            <p className="font-dm-sans text-gray-500 text-sm">
              <span className="font-medium text-gray-700">Starting point:</span> A working prototype with basic Tailwind—zero design, purely functional.
            </p>
          </div>

          <div
            className="bg-white rounded-2xl p-8 lg:p-12 border border-gray-200/50 relative overflow-hidden"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Timeline line - desktop only */}
            <div className="absolute left-12 top-12 bottom-12 w-0.5 bg-gradient-to-b from-gray-300 via-primary-300 to-success-400 hidden lg:block"></div>

            <div className="space-y-10 lg:space-y-12">
              {/* Day 1 */}
              <div className="flex gap-6 lg:gap-8 items-start">
                <div className="flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gray-100 flex items-center justify-center relative z-10">
                  <span className="font-sora text-sm lg:text-base font-bold text-gray-500">v1.0</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                    <h3 className="font-sora text-lg lg:text-xl font-bold text-gray-900">Design Exploration</h3>
                    <span className="font-dm-sans text-sm text-gray-500">Day 1</span>
                  </div>
                  <p className="font-dm-sans text-gray-600">
                    Prototype validated. Time for design. Explored 3 visual directions: Brutalist, Soft/Organic, Editorial.
                  </p>
                </div>
              </div>

              {/* v2.0 */}
              <div className="flex gap-6 lg:gap-8 items-start">
                <div className="flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative z-10">
                  <span className="font-sora text-sm lg:text-base font-bold text-primary-600">v2.0</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                    <h3 className="font-sora text-lg lg:text-xl font-bold text-gray-900">Editorial Direction</h3>
                    <span className="font-dm-sans text-sm text-gray-500">Day 2</span>
                  </div>
                  <p className="font-dm-sans text-gray-600">
                    Chose editorial aesthetic. Adopted Sora + DM Sans typography. Created 4-layer shadow system. Added gradient spotlights.
                  </p>
                </div>
              </div>

              {/* v2.13 */}
              <div className="flex gap-6 lg:gap-8 items-start">
                <div className="flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center relative z-10">
                  <span className="font-sora text-sm lg:text-base font-bold text-purple-600">v2.13</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                    <h3 className="font-sora text-lg lg:text-xl font-bold text-gray-900">Diagonal Badge System</h3>
                    <span className="font-dm-sans text-sm text-gray-500">Days 3-4</span>
                  </div>
                  <p className="font-dm-sans text-gray-600">
                    Invented diagonal badge concept—my signature element. Built scheduler prototype to see design in action. Extracted 15 components.
                  </p>
                </div>
              </div>

              {/* v2.26 - Current */}
              <div className="flex gap-6 lg:gap-8 items-start">
                <div className="flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-success-400 to-success-500 flex items-center justify-center relative z-10 ring-4 ring-success-100">
                  <span className="font-sora text-sm lg:text-base font-bold text-white">v2.26</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                    <h3 className="font-sora text-lg lg:text-xl font-bold text-gray-900">Production Ready</h3>
                    <div
                      className="px-3 py-1 bg-gradient-to-r from-success-500 to-success-600 text-white font-dm-sans text-xs font-medium"
                      style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
                    >
                      Current
                    </div>
                    <span className="font-dm-sans text-sm text-gray-500">Day 5</span>
                  </div>
                  <p className="font-dm-sans text-gray-600">
                    18 production components. Mobile-first responsive. Complete documentation. Public case study and component showcase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="editorial-divider"></div>

        {/* ============================================
            SECTION 4: FROM EXPLORATION TO ITERATION
            ============================================ */}
        <section className="animate-fadeInUp-delay-3">
          <div className="text-center mb-12">
            <h2 className="font-sora text-3xl sm:text-4xl font-bold text-gray-900">
              From Exploration to Iteration
            </h2>
            <p className="font-dm-sans text-gray-600 mt-3 max-w-xl mx-auto">
              With the editorial direction chosen, we refined every detail through back-and-forth iteration.
            </p>
          </div>

          {/* Process steps grid */}
          <div
            className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Step 1: Typography */}
              <div className="p-6 lg:p-8 border-b md:border-r border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white font-sora font-bold text-sm"
                    style={{
                      background: 'linear-gradient(to right, #1a6fff, #0052e6)',
                      clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                    }}
                  >
                    1
                  </div>
                  <h3 className="font-sora text-lg font-bold text-gray-900">Typography Pairing</h3>
                </div>
                <p className="font-dm-sans text-gray-600 text-sm mb-4">
                  Tested multiple font combinations. Settled on <span className="font-medium text-gray-900">Sora</span> for bold headlines and <span className="font-medium text-gray-900">DM Sans</span> for readable body text.
                </p>
                <div className="flex gap-4 items-baseline">
                  <span className="font-sora text-2xl font-bold text-gray-900">Sora</span>
                  <span className="font-dm-sans text-lg text-gray-600">DM Sans</span>
                </div>
              </div>

              {/* Step 2: Card Styles */}
              <div className="p-6 lg:p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white font-sora font-bold text-sm"
                    style={{
                      background: 'linear-gradient(to right, #1a6fff, #0052e6)',
                      clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                    }}
                  >
                    2
                  </div>
                  <h3 className="font-sora text-lg font-bold text-gray-900">Shadow System</h3>
                </div>
                <p className="font-dm-sans text-gray-600 text-sm mb-4">
                  Developed a 4-layer shadow approach. Creates natural depth without harsh drop shadows.
                </p>
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}></div>
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)' }}></div>
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.08)' }}></div>
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.08)' }}></div>
                </div>
              </div>

              {/* Step 3: Button Treatments */}
              <div className="p-6 lg:p-8 border-b md:border-b-0 md:border-r border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white font-sora font-bold text-sm"
                    style={{
                      background: 'linear-gradient(to right, #1a6fff, #0052e6)',
                      clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                    }}
                  >
                    3
                  </div>
                  <h3 className="font-sora text-lg font-bold text-gray-900">Button Variants</h3>
                </div>
                <p className="font-dm-sans text-gray-600 text-sm mb-4">
                  9 button variants with gradient backgrounds and brand-colored shadows.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-medium rounded-lg" style={{ boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)' }}>Primary</button>
                  <button className="px-3 py-1.5 bg-gradient-to-r from-success-500 to-success-600 text-white text-xs font-medium rounded-lg" style={{ boxShadow: '0 4px 12px rgba(0, 200, 83, 0.25)' }}>Success</button>
                  <button className="px-3 py-1.5 bg-gradient-to-r from-danger-500 to-danger-600 text-white text-xs font-medium rounded-lg" style={{ boxShadow: '0 4px 12px rgba(244, 63, 94, 0.25)' }}>Danger</button>
                </div>
              </div>

              {/* Step 4: Scheduler Mockup */}
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white font-sora font-bold text-sm"
                    style={{
                      background: 'linear-gradient(to right, #1a6fff, #0052e6)',
                      clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                    }}
                  >
                    4
                  </div>
                  <h3 className="font-sora text-lg font-bold text-gray-900">Scheduler Mockup</h3>
                </div>
                <p className="font-dm-sans text-gray-600 text-sm mb-4">
                  Built a full prototype to see the design &ldquo;in action&rdquo;—not just isolated components.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/prototype/scheduler-v2"
                    className="text-primary-500 hover:text-primary-600 font-dm-sans text-sm font-medium flex items-center gap-1"
                  >
                    View prototype <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Key insight */}
          <div className="mt-8 text-center">
            <p className="font-dm-sans text-lg text-gray-700">
              <span className="font-medium">The method:</span> Each decision informed the next. Typography led to shadows. Shadows led to buttons. Buttons led to the scheduler.
            </p>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="editorial-divider"></div>

        {/* ============================================
            SECTION 5: THE BREAKTHROUGH - Diagonal Badge
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="text-center mb-12">
            <h2 className="font-sora text-3xl sm:text-4xl font-bold text-gray-900">
              The Diagonal Badge: A Signature Element
            </h2>
            <p className="font-dm-sans text-gray-600 mt-3 max-w-xl mx-auto">
              I wanted something uniquely my own—not just another AI-generated design system.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: The Story */}
            <div
              className="bg-white rounded-2xl p-8 lg:p-10 border border-gray-200/50 relative overflow-hidden"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>

              <div className="relative">
                <div
                  className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-dm-sans text-sm font-medium mb-6"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
                >
                  Creative Contribution
                </div>

                <h3 className="font-sora text-xl font-bold text-gray-900 mb-4">
                  &ldquo;What makes this distinctly mine?&rdquo;
                </h3>

                <div className="space-y-4 font-dm-sans text-gray-600">
                  <p>
                    After iterating on typography, shadows, and colors, something was still missing. The system looked polished but could have been generated by any AI tool.
                  </p>
                  <p>
                    The diagonal badge concept emerged from wanting to <span className="font-medium text-gray-900">stand apart</span>. It captures the forward momentum of fitness—the energy of pushing through a workout, the angle of a sprinter mid-stride.
                  </p>
                  <p>
                    We debated: should buttons also be diagonal? The answer was no—<span className="font-medium text-gray-900">badges get diagonal cuts, buttons stay rounded</span>. Clear UX affordance, distinctive visual identity.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: The Visual */}
            <div className="space-y-6">
              {/* Large badge showcase */}
              <div className="text-center">
                <div
                  className="inline-block px-8 py-4 bg-gradient-to-r from-success-500 to-success-600 text-white font-sora text-2xl font-bold"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                    boxShadow: '0 4px 16px rgba(0, 200, 83, 0.3)'
                  }}
                >
                  Confirmed
                </div>
              </div>

              {/* Badge variants */}
              <div className="flex flex-wrap justify-center gap-3">
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-dm-sans text-sm font-medium"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
                >
                  Primary
                </div>
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-warning-500 to-warning-600 text-white font-dm-sans text-sm font-medium"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
                >
                  Pending
                </div>
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-danger-500 to-danger-600 text-white font-dm-sans text-sm font-medium"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
                >
                  Failed
                </div>
                <div
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-dm-sans text-sm font-medium"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
                >
                  Premium
                </div>
              </div>

              {/* The formula */}
              <div
                className="bg-slate-900 rounded-xl p-6 text-center"
                style={{
                  clipPath: 'polygon(0% 0%, calc(100% - 16px) 0%, 100% 16px, 100% 100%, 0% 100%)'
                }}
              >
                <p className="font-dm-sans text-slate-400 text-sm mb-3">The clip-path formula:</p>
                <code className="font-mono text-success-400 text-sm">
                  polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)
                </code>
              </div>
            </div>
          </div>

          {/* Key insight */}
          <div className="mt-10 text-center">
            <p className="font-dm-sans text-lg text-gray-700">
              <span className="font-medium">The takeaway:</span> A signature element—invented by me, not generated by AI—makes all the difference.
            </p>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="editorial-divider"></div>

        {/* ============================================
            SECTION 6: THE RESULTS - Metrics + Decisions
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="text-center mb-12">
            <h2 className="font-sora text-3xl sm:text-4xl font-bold text-gray-900">
              The Results
            </h2>
            <p className="font-dm-sans text-gray-600 mt-3 max-w-xl mx-auto">
              What was built in 5 days.
            </p>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {[
              { value: '18', label: 'Components', color: 'text-primary-500' },
              { value: '6', label: 'Color Scales', color: 'text-success-500' },
              { value: '4', label: 'Shadow Layers', color: 'text-purple-500' },
              { value: '6', label: 'Clip Paths', color: 'text-warning-500' },
              { value: '7', label: 'Gradients', color: 'text-danger-500' },
              { value: '2', label: 'Custom Fonts', color: 'text-primary-600' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-5 border border-gray-200/50 text-center"
                style={{
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
                  clipPath: 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 10px, 100% 100%, 0% 100%)'
                }}
              >
                <div className={`font-sora text-3xl lg:text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="font-dm-sans text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Key decisions */}
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 lg:p-10 relative overflow-hidden"
            style={{
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1)',
              clipPath: 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 20px 100%, 0% calc(100% - 20px))'
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-success-500/15 to-transparent rounded-full blur-3xl"></div>

            <div className="relative">
              <h3 className="font-sora text-2xl font-bold text-white mb-6">Key Design Decisions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Buttons stay rounded for clear UX affordance',
                  'Only badges get diagonal clip-paths',
                  '4-layer shadows create natural depth',
                  'Mobile-first responsive patterns',
                ].map((decision, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-success-400 mt-0.5">&#10003;</span>
                    <span className="font-dm-sans text-slate-300">{decision}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="editorial-divider"></div>

        {/* ============================================
            SECTION 6: SEE IT IN ACTION - CTAs
            ============================================ */}
        <section className="animate-fadeInUp-delay-5">
          <div className="text-center mb-12">
            <h2 className="font-sora text-3xl sm:text-4xl font-bold text-gray-900">
              See It In Action
            </h2>
            <p className="font-dm-sans text-gray-600 mt-3 max-w-xl mx-auto">
              Explore the design system applied to a real product, or dive into the component toolkit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scheduler CTA */}
            <Link
              href="/prototype/scheduler-v2"
              className="group bg-white rounded-2xl border border-gray-200/50 p-8 lg:p-10 relative overflow-hidden hover:-translate-y-2 transition-all duration-300"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div
                  className="inline-block px-4 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-dm-sans text-sm font-medium mb-4"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
                >
                  Prototype
                </div>
                <h3 className="font-sora text-2xl font-bold text-gray-900 mb-2">
                  View the Scheduler
                </h3>
                <p className="font-dm-sans text-gray-600 mb-6">
                  See the design system in context of a real product. Dashboard, cards, forms, and modals working together.
                </p>
                <div className="flex items-center gap-2 font-dm-sans font-medium text-primary-500 group-hover:text-primary-600 transition-colors">
                  <span>Explore the prototype</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Components CTA */}
            <Link
              href="/prototype/design-system-components"
              className="group bg-white rounded-2xl border border-gray-200/50 p-8 lg:p-10 relative overflow-hidden hover:-translate-y-2 transition-all duration-300"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div
                  className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-dm-sans text-sm font-medium mb-4"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
                >
                  Component Library
                </div>
                <h3 className="font-sora text-2xl font-bold text-gray-900 mb-2">
                  Explore the Toolkit
                </h3>
                <p className="font-dm-sans text-gray-600 mb-6">
                  18 production-ready components. Buttons, forms, modals, and more. Each with consistent APIs and variants.
                </p>
                <div className="flex items-center gap-2 font-dm-sans font-medium text-purple-500 group-hover:text-purple-600 transition-colors">
                  <span>Browse all components</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </div>
        </section>

      </div>

      {/* Bottom Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/prototype/scheduler-v2"
            className="flex items-center justify-between p-4 sm:p-6 bg-white rounded-xl border border-gray-200/50 hover:border-primary-200 hover:-translate-y-0.5 transition-all group"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)' }}
          >
            <div>
              <p className="font-dm-sans text-sm text-gray-500">Next</p>
              <p className="font-sora font-semibold text-gray-900">View the Prototype →</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* CSS */}
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

        .animate-fadeInUp-delay-5 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.5s both;
        }

        .text-gradient-primary {
          background: linear-gradient(to right, #1a6fff, #0052e6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .editorial-divider {
          position: relative;
          height: 1px;
          display: flex;
          justify-content: center;
        }

        .editorial-divider::before {
          content: '';
          width: 60%;
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
        }

        .editorial-divider::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(to right, #1a6fff, #00c853);
          border-radius: 2px;
          clip-path: polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%);
        }
      `}</style>
    </div>
  )
}
