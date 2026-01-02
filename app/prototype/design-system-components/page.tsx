'use client'

import { useState } from 'react'
import { sora, dmSans } from '@/lib/fonts'
import Link from 'next/link'
import {
  Button,
  Badge,
  Card,
  Alert,
  StatusIndicator,
  StatCard,
  Divider,
  Footer,
} from '@/components/ui'

export default function DesignSystemComponentsPage() {
  // Form states
  const [inputValue, setInputValue] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [selectValue, setSelectValue] = useState('')
  const [checkboxChecked, setCheckboxChecked] = useState(false)
  const [radioValue, setRadioValue] = useState('option1')
  const [textareaValue, setTextareaValue] = useState('')
  const [textareaFocused, setTextareaFocused] = useState(false)

  // Navigation states
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeNavItem, setActiveNavItem] = useState('schedule')

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Toast states
  const [toasts, setToasts] = useState<Array<{ id: number; type: 'success' | 'error' | 'warning' | 'info'; message: string }>>([])

  // Tabs state
  const [activeTab, setActiveTab] = useState('upcoming')

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  return (
    <div
      className={`min-h-screen relative ${sora.variable} ${dmSans.variable}`}
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

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
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
                Component Library
              </h1>
              <p className="font-dm-sans text-gray-600 mt-2">
                Phase 1 • Forms, Navigation, Modals & UI Elements
              </p>
            </div>
            <Link
              href="/prototype"
              className="font-dm-sans text-sm text-gray-600 hover:text-[#1a6fff] transition-colors"
            >
              ← Back to Prototypes
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-20 relative">

        {/* ============================================
            SECTION 1: FORMS
            ============================================ */}
        <section className="animate-fadeInUp">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Form Elements
            </h2>
            <div
              className="px-4 py-1.5 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans text-sm font-medium"
              style={{
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
              }}
            >
              Interactive
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-10 border border-gray-200/50"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Text Inputs */}
              <div className="space-y-8">
                <h3 className="font-sora text-xl font-semibold text-gray-900 mb-6">Text Inputs</h3>

                {/* Default Input with Focus Accent */}
                <div className="space-y-2">
                  <label className="font-dm-sans text-sm font-medium text-gray-700">Class Name</label>
                  <div className="relative">
                    {/* Focus accent bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all duration-300 ${inputFocused ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                        background: 'linear-gradient(to bottom, #1a6fff, #00c853)',
                      }}
                    ></div>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Enter class name..."
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg font-dm-sans text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none ${inputFocused ? 'border-[#1a6fff] bg-white ring-2 ring-[#1a6fff]/10 pl-5' : 'border-gray-200 hover:border-gray-300'}`}
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                  <p className="font-dm-sans text-xs text-gray-500">Focus to see the gradient accent bar</p>
                </div>

                {/* Error State */}
                <div className="space-y-2">
                  <label className="font-dm-sans text-sm font-medium text-gray-700">Email (Error State)</label>
                  <div className="relative">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                      style={{
                        background: '#f43f5e',
                      }}
                    ></div>
                    <input
                      type="email"
                      defaultValue="invalid-email"
                      className="w-full px-4 py-3 pl-5 bg-rose-50 border border-rose-300 rounded-lg font-dm-sans text-gray-900 outline-none ring-2 ring-rose-100"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                  <p className="font-dm-sans text-xs text-rose-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please enter a valid email address
                  </p>
                </div>

                {/* Success State */}
                <div className="space-y-2">
                  <label className="font-dm-sans text-sm font-medium text-gray-700">Username (Success State)</label>
                  <div className="relative">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                      style={{
                        background: '#00c853',
                      }}
                    ></div>
                    <input
                      type="text"
                      defaultValue="fitness_pro"
                      className="w-full px-4 py-3 pl-5 bg-green-50 border border-green-300 rounded-lg font-dm-sans text-gray-900 outline-none ring-2 ring-green-100"
                      style={{ minHeight: '48px' }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="font-dm-sans text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Username is available
                  </p>
                </div>

                {/* Warning State */}
                <div className="space-y-2">
                  <label className="font-dm-sans text-sm font-medium text-gray-700">Password (Warning State)</label>
                  <div className="relative">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                      style={{
                        background: '#ff9500',
                      }}
                    ></div>
                    <input
                      type="password"
                      defaultValue="weak123"
                      className="w-full px-4 py-3 pl-5 bg-orange-50 border border-orange-300 rounded-lg font-dm-sans text-gray-900 outline-none ring-2 ring-orange-100"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                  <p className="font-dm-sans text-xs text-orange-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Password strength: Weak
                  </p>
                </div>
              </div>

              {/* Select, Checkbox, Radio, Textarea */}
              <div className="space-y-8">
                <h3 className="font-sora text-xl font-semibold text-gray-900 mb-6">Other Controls</h3>

                {/* Select */}
                <div className="space-y-2">
                  <label className="font-dm-sans text-sm font-medium text-gray-700">Select Location</label>
                  <div className="relative">
                    <select
                      value={selectValue}
                      onChange={(e) => setSelectValue(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-dm-sans text-gray-900 appearance-none cursor-pointer hover:border-gray-300 focus:border-[#1a6fff] focus:bg-white focus:ring-2 focus:ring-[#1a6fff]/10 outline-none transition-all duration-200"
                      style={{ minHeight: '48px' }}
                    >
                      <option value="">Choose a gym...</option>
                      <option value="downtown">Downtown YMCA</option>
                      <option value="westside">Westside YMCA</option>
                      <option value="northgate">Northgate YMCA</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="font-dm-sans text-sm font-medium text-gray-700">Notifications</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={checkboxChecked}
                          onChange={(e) => setCheckboxChecked(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded-md peer-checked:bg-[#1a6fff] peer-checked:border-[#1a6fff] transition-all duration-200 flex items-center justify-center group-hover:border-gray-400 peer-focus:ring-2 peer-focus:ring-[#1a6fff]/20">
                          <svg className={`w-4 h-4 text-white transition-transform duration-200 ${checkboxChecked ? 'scale-100' : 'scale-0'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <span className="font-dm-sans text-gray-700">Email notifications for bookings</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded-md peer-checked:bg-[#1a6fff] peer-checked:border-[#1a6fff] transition-all duration-200 flex items-center justify-center group-hover:border-gray-400">
                          <svg className="w-4 h-4 text-white peer-checked:scale-100" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <span className="font-dm-sans text-gray-700">Push notifications for reminders</span>
                    </label>
                  </div>
                </div>

                {/* Radio Buttons */}
                <div className="space-y-3">
                  <label className="font-dm-sans text-sm font-medium text-gray-700">Booking Window</label>
                  <div className="space-y-3">
                    {['24 hours before', '26 hours before', '48 hours before'].map((option, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="radio"
                            name="booking-window"
                            value={`option${i + 1}`}
                            checked={radioValue === `option${i + 1}`}
                            onChange={(e) => setRadioValue(e.target.value)}
                            className="sr-only peer"
                          />
                          <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded-full peer-checked:border-[#1a6fff] transition-all duration-200 flex items-center justify-center group-hover:border-gray-400">
                            <div className={`w-3 h-3 rounded-full bg-[#1a6fff] transition-transform duration-200 ${radioValue === `option${i + 1}` ? 'scale-100' : 'scale-0'}`}></div>
                          </div>
                        </div>
                        <span className="font-dm-sans text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="space-y-2">
                  <label className="font-dm-sans text-sm font-medium text-gray-700">Notes</label>
                  <div className="relative">
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all duration-300 ${textareaFocused ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                        background: 'linear-gradient(to bottom, #1a6fff, #00c853)',
                      }}
                    ></div>
                    <textarea
                      value={textareaValue}
                      onChange={(e) => setTextareaValue(e.target.value)}
                      onFocus={() => setTextareaFocused(true)}
                      onBlur={() => setTextareaFocused(false)}
                      placeholder="Add any notes about your booking preferences..."
                      rows={4}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg font-dm-sans text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none resize-none ${textareaFocused ? 'border-[#1a6fff] bg-white ring-2 ring-[#1a6fff]/10 pl-5' : 'border-gray-200 hover:border-gray-300'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="relative h-px overflow-visible flex justify-center">
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
            SECTION 2: NAVIGATION
            ============================================ */}
        <section className="animate-fadeInUp-delay-1">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Navigation
            </h2>
            <div
              className="px-4 py-1.5 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-sm font-medium"
              style={{
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
              }}
            >
              Interactive
            </div>
          </div>

          <div className="space-y-8">
            {/* Header Demo */}
            <div
              className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="font-sora text-lg font-semibold text-gray-900">Header with Nav Items</h3>
                <p className="font-dm-sans text-sm text-gray-500 mt-1">Click nav items to see active state with diagonal underline</p>
              </div>

              {/* Demo Header */}
              <div className="relative bg-white border-b border-gray-200">
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{
                    background: 'linear-gradient(to right, #1a6fff, #00c853)',
                    clipPath: 'polygon(0% 0%, 100% 0%, 99.5% 100%, 0.5% 100%)'
                  }}
                ></div>

                <div className="px-8 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a6fff] to-[#0052e6] flex items-center justify-center">
                      <span className="text-white font-sora font-bold text-lg">W</span>
                    </div>
                    <span className="font-sora font-bold text-xl text-gray-900">Workout</span>
                  </div>

                  <nav className="hidden md:flex items-center gap-8">
                    {[
                      { id: 'schedule', label: 'Schedule' },
                      { id: 'classes', label: 'Classes' },
                      { id: 'history', label: 'History' },
                      { id: 'settings', label: 'Settings' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveNavItem(item.id)}
                        className="relative font-dm-sans text-sm font-medium py-2 group"
                      >
                        <span className={`transition-colors ${activeNavItem === item.id ? 'text-[#1a6fff]' : 'text-gray-600 hover:text-gray-900'}`}>
                          {item.label}
                        </span>
                        {/* Diagonal underline for active state */}
                        <div
                          className={`absolute -bottom-1 left-0 right-0 h-0.5 transition-all duration-300 ${activeNavItem === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
                          style={{
                            background: activeNavItem === item.id ? 'linear-gradient(to right, #1a6fff, #00c853)' : '#d1d5db',
                            clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
                          }}
                        ></div>
                      </button>
                    ))}
                  </nav>

                  {/* Mobile hamburger */}
                  <button
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setMobileNavOpen(true)}
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50">
                <p className="font-dm-sans text-sm text-gray-600">
                  Active: <span className="font-medium text-[#1a6fff]">{activeNavItem}</span>
                </p>
              </div>
            </div>

            {/* Breadcrumb */}
            <div
              className="bg-white rounded-2xl p-8 border border-gray-200/50"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Breadcrumb Navigation</h3>

              <nav className="flex items-center gap-2 font-dm-sans text-sm">
                <a href="#" className="text-gray-500 hover:text-[#1a6fff] transition-colors">Dashboard</a>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <a href="#" className="text-gray-500 hover:text-[#1a6fff] transition-colors">Schedule</a>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-medium">Edit Class</span>
              </nav>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="relative h-px overflow-visible flex justify-center">
          <div
            className="w-[60%] h-px relative"
            style={{
              background: 'linear-gradient(to right, rgba(0, 200, 83, 0) 0%, rgba(0, 200, 83, 0.15) 50%, rgba(0, 200, 83, 0) 100%)',
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5"
              style={{
                background: 'linear-gradient(to right, #00c853, #1a6fff)',
                clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
                opacity: 0.4,
                boxShadow: '0 0 20px rgba(0, 200, 83, 0.3)'
              }}
            ></div>
          </div>
        </div>

        {/* ============================================
            SECTION 3: MODALS & MENUS
            ============================================ */}
        <section className="animate-fadeInUp-delay-2">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Modals & Menus
            </h2>
            <div
              className="px-4 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-dm-sans text-sm font-medium"
              style={{
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
              }}
            >
              Interactive
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-10 border border-gray-200/50"
            style={{
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                style={{
                  boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
                }}
              >
                Open Modal
              </button>

              <button
                onClick={() => setConfirmModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                style={{
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.25)'
                }}
              >
                Delete Confirmation
              </button>

              <button
                onClick={() => setBottomSheetOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 200, 83, 0.25)'
                }}
              >
                Bottom Sheet
              </button>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-dm-sans font-medium rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  Dropdown Menu
                  <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                    <div
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 z-50 overflow-hidden"
                      style={{
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <div className="py-2">
                        {['Edit Class', 'Duplicate', 'Skip Next', 'View History'].map((item, i) => (
                          <button
                            key={i}
                            className="w-full px-4 py-3 text-left font-dm-sans text-gray-700 hover:bg-gray-50 hover:text-[#1a6fff] transition-colors flex items-center gap-3"
                            onClick={() => setDropdownOpen(false)}
                          >
                            {item}
                          </button>
                        ))}
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          className="w-full px-4 py-3 text-left font-dm-sans text-rose-600 hover:bg-rose-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Delete Class
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Class Card Actions Menu Demo */}
            <div className="mt-10 pt-10 border-t border-gray-200">
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Class Card Actions Menu</h3>
              <p className="font-dm-sans text-sm text-gray-500 mb-8">Click the three-dot menu on any card to see the actions dropdown.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card with menu closed */}
                <div
                  className="bg-white p-6 border border-gray-200/50 relative overflow-hidden rounded-xl"
                  style={{
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00c853]/8 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-sora text-xl font-bold text-gray-900">BODYPUMP</h4>
                        <div
                          className="px-3 py-1 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-xs font-medium"
                          style={{
                            clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                          }}
                        >
                          Booked
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-dm-sans text-gray-700">Monday 4:15 PM</p>
                    <p className="font-dm-sans text-sm text-gray-500 mt-1">Downtown YMCA</p>
                    <div className="mt-4 flex gap-3">
                      <button
                        className="px-4 py-2 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium text-sm rounded-lg hover:-translate-y-0.5 transition-all"
                        style={{ boxShadow: '0 2px 8px rgba(26, 111, 255, 0.2)' }}
                      >
                        Skip Next
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 font-dm-sans font-medium text-sm rounded-lg hover:bg-gray-200 transition-all">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card with menu open (static demo) */}
                <div
                  className="bg-white p-6 border border-gray-200/50 relative overflow-visible rounded-xl"
                  style={{
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ff9500]/8 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-sora text-xl font-bold text-gray-900">CYCLING</h4>
                        <div
                          className="px-3 py-1 bg-gradient-to-r from-[#ff9500] to-[#ff6b00] text-white font-dm-sans text-xs font-medium"
                          style={{
                            clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
                          }}
                        >
                          Pending
                        </div>
                      </div>
                      <div className="relative">
                        <button className="p-2 bg-gray-100 rounded-lg">
                          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {/* Static open dropdown */}
                        <div
                          className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 overflow-hidden z-10"
                          style={{
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08)'
                          }}
                        >
                          <div className="py-1">
                            <button className="w-full px-4 py-3 text-left font-dm-sans text-gray-700 hover:bg-gray-50 hover:text-[#1a6fff] transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Class
                            </button>
                            <button className="w-full px-4 py-3 text-left font-dm-sans text-gray-700 hover:bg-gray-50 hover:text-[#1a6fff] transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Duplicate
                            </button>
                            <button className="w-full px-4 py-3 text-left font-dm-sans text-gray-700 hover:bg-gray-50 hover:text-[#1a6fff] transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                              Skip Next
                            </button>
                            <button className="w-full px-4 py-3 text-left font-dm-sans text-gray-700 hover:bg-gray-50 hover:text-[#1a6fff] transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              View History
                            </button>
                            <button className="w-full px-4 py-3 text-left font-dm-sans text-gray-700 hover:bg-gray-50 hover:text-[#1a6fff] transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pause Class
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button className="w-full px-4 py-3 text-left font-dm-sans text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Class
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="font-dm-sans text-gray-700">Friday 7:00 AM</p>
                    <p className="font-dm-sans text-sm text-gray-500 mt-1">Westside YMCA</p>
                    <div className="mt-4 flex gap-3">
                      <button
                        className="px-4 py-2 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium text-sm rounded-lg hover:-translate-y-0.5 transition-all"
                        style={{ boxShadow: '0 2px 8px rgba(26, 111, 255, 0.2)' }}
                      >
                        Skip Next
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 font-dm-sans font-medium text-sm rounded-lg hover:bg-gray-200 transition-all">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Menu Specs */}
              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <h4 className="font-sora font-semibold text-gray-900 mb-4">Menu Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-dm-sans text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1a6fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-gray-700">Edit Class</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1a6fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700">Duplicate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1a6fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-700">Skip Next</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1a6fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">View History</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1a6fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Pause Class</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-rose-600">Delete Class</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <div className="relative h-px overflow-visible flex justify-center">
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
            SECTION 4: UI ELEMENTS
            ============================================ */}
        <section className="animate-fadeInUp-delay-3">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              UI Elements
            </h2>
            <div
              className="px-4 py-1.5 bg-gradient-to-r from-[#ff9500] to-[#ff6b00] text-white font-dm-sans text-sm font-medium"
              style={{
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
              }}
            >
              Interactive
            </div>
          </div>

          <div className="space-y-8">
            {/* Toasts */}
            <div
              className="bg-white rounded-2xl p-8 border border-gray-200/50"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Toast Notifications</h3>

              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => showToast('success', 'Class booked successfully!')}
                  className="px-4 py-2 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                >
                  Success Toast
                </button>
                <button
                  onClick={() => showToast('error', 'Failed to book class. Please try again.')}
                  className="px-4 py-2 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                >
                  Error Toast
                </button>
                <button
                  onClick={() => showToast('warning', 'Class is almost full. Book soon!')}
                  className="px-4 py-2 bg-gradient-to-r from-[#ff9500] to-[#ff6b00] text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                >
                  Warning Toast
                </button>
                <button
                  onClick={() => showToast('info', 'Schedule sync in progress...')}
                  className="px-4 py-2 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                >
                  Info Toast
                </button>
              </div>

              {/* Static toast examples */}
              <div className="space-y-3">
                {[
                  { type: 'success', color: '#00c853', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', message: 'Class booked successfully!' },
                  { type: 'error', color: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', message: 'Failed to book class.' },
                  { type: 'warning', color: '#ff9500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', message: 'Class is almost full.' },
                  { type: 'info', color: '#1a6fff', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', message: 'Schedule sync in progress...' },
                ].map((toast, i) => (
                  <div
                    key={i}
                    className={`relative ${toast.bg} ${toast.border} border rounded-lg px-4 py-3 overflow-hidden`}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{
                        background: toast.color,
                        clipPath: 'polygon(0% 0%, 100% 8%, 100% 92%, 0% 100%)',
                      }}
                    ></div>
                    <p className={`font-dm-sans text-sm ${toast.text} pl-2`}>{toast.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div
              className="bg-white rounded-2xl p-8 border border-gray-200/50"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Tabs with Diagonal Underline</h3>

              <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                  {[
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'skipped', label: 'Skipped' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="relative pb-4 font-dm-sans font-medium transition-colors"
                    >
                      <span className={activeTab === tab.id ? 'text-[#1a6fff]' : 'text-gray-500 hover:text-gray-700'}>
                        {tab.label}
                      </span>
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 ${activeTab === tab.id ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                          background: 'linear-gradient(to right, #1a6fff, #00c853)',
                          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
                        }}
                      ></div>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="py-6">
                <p className="font-dm-sans text-gray-600">
                  Active tab: <span className="font-medium text-[#1a6fff]">{activeTab}</span>
                </p>
              </div>
            </div>

            {/* Loading Skeleton */}
            <div
              className="bg-white rounded-2xl p-8 border border-gray-200/50"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-6">Loading Skeleton</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-4/5 animate-pulse"></div>
                <div className="flex gap-3 pt-2">
                  <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-100 rounded-lg w-20 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            <div
              className="bg-white rounded-2xl p-12 border border-gray-200/50 text-center"
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-8">Empty State</h3>

              <div className="max-w-sm mx-auto">
                <div
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center"
                  style={{
                    clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 12px, 100% 100%, 0% 100%)'
                  }}
                >
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-sora text-xl font-bold text-gray-900 mb-2">No Classes Scheduled</h4>
                <p className="font-dm-sans text-gray-500 mb-6">Get started by adding your first recurring class to automate your gym bookings.</p>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                  style={{
                    boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
                  }}
                >
                  Add Your First Class
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Divider */}
        <Divider variant="editorial" />

        {/* ============================================
            SECTION 5: COMPONENT LIBRARY - BUTTON
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Button Component
            </h2>
            <Badge variant="info">Component Library</Badge>
          </div>

          <Card padding="lg">
            <div className="space-y-8">
              {/* Variants */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Variants</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="purple">Purple</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="outline-primary">Outline Primary</Button>
                  <Button variant="outline-danger">Outline Danger</Button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* States */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">States</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Editorial Divider */}
        <Divider variant="editorial" />

        {/* ============================================
            SECTION 6: COMPONENT LIBRARY - BADGE
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Badge Component
            </h2>
            <Badge variant="purple">Component Library</Badge>
          </div>

          <Card padding="lg">
            <div className="space-y-8">
              {/* Status Badges */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Status Badges (with icons)</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Badge status="confirmed">Booked</Badge>
                  <Badge status="pending">Pending</Badge>
                  <Badge status="waitlisted">Waitlisted</Badge>
                  <Badge status="failed">Failed</Badge>
                  <Badge status="skipped">Skipped</Badge>
                  <Badge status="retrying">Retrying</Badge>
                </div>
              </div>

              {/* Variant Badges */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Variant Badges</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="purple">Purple</Badge>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Badge size="sm" variant="success">Small</Badge>
                  <Badge size="md" variant="success">Medium</Badge>
                  <Badge size="lg" variant="success">Large</Badge>
                </div>
              </div>

              {/* Non-diagonal */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Rounded (non-diagonal)</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Badge diagonal={false} variant="success">Rounded Badge</Badge>
                  <Badge diagonal={false} variant="info">Info Pill</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Editorial Divider */}
        <Divider variant="editorial" />

        {/* ============================================
            SECTION 7: COMPONENT LIBRARY - ALERT
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Alert Component
            </h2>
            <Badge variant="warning">Component Library</Badge>
          </div>

          <Card padding="lg">
            <div className="space-y-4">
              <Alert variant="success">Class booked successfully! You&apos;re all set for Monday 4:15 PM.</Alert>
              <Alert variant="error">Failed to book class. The class may be full or cancelled.</Alert>
              <Alert variant="warning">Class is almost full. Book soon to secure your spot!</Alert>
              <Alert variant="info">Schedule sync in progress. Your bookings will be updated shortly.</Alert>
            </div>
          </Card>
        </section>

        {/* Editorial Divider */}
        <Divider variant="editorial" />

        {/* ============================================
            SECTION 8: COMPONENT LIBRARY - STATUS INDICATOR
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Status Indicator
            </h2>
            <Badge variant="success">Component Library</Badge>
          </div>

          <Card padding="lg">
            <div className="space-y-6">
              {/* With Labels */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">With Labels</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <StatusIndicator status="confirmed" />
                  <StatusIndicator status="pending" />
                  <StatusIndicator status="waitlisted" />
                  <StatusIndicator status="failed" />
                  <StatusIndicator status="skipped" />
                  <StatusIndicator status="retrying" />
                </div>
              </div>

              {/* Dots Only */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Dots Only (no label)</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <StatusIndicator status="confirmed" showLabel={false} />
                  <StatusIndicator status="pending" showLabel={false} />
                  <StatusIndicator status="waitlisted" showLabel={false} />
                  <StatusIndicator status="failed" showLabel={false} />
                  <StatusIndicator status="skipped" showLabel={false} />
                  <StatusIndicator status="retrying" showLabel={false} />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <StatusIndicator status="confirmed" size="sm" />
                  <StatusIndicator status="confirmed" size="md" />
                  <StatusIndicator status="confirmed" size="lg" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Editorial Divider */}
        <Divider variant="editorial" />

        {/* ============================================
            SECTION 9: COMPONENT LIBRARY - STAT CARD
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Stat Card
            </h2>
            <Badge variant="danger">Component Library</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Classes Booked"
              value="24"
              trend={{ value: 12, direction: 'up' }}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
            <StatCard
              label="Success Rate"
              value="92%"
              variant="success"
              trend={{ value: 5, direction: 'up' }}
            />
            <StatCard
              label="On Waitlist"
              value="3"
              variant="warning"
              trend={{ value: 2, direction: 'neutral' }}
            />
            <StatCard
              label="Missed Classes"
              value="1"
              variant="danger"
              trend={{ value: 50, direction: 'down' }}
            />
          </div>
        </section>

        {/* Editorial Divider */}
        <Divider variant="editorial" />

        {/* ============================================
            SECTION 10: COMPONENT LIBRARY - DIVIDER
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Divider Component
            </h2>
            <Badge variant="default">Component Library</Badge>
          </div>

          <Card padding="lg">
            <div className="space-y-2">
              <p className="font-dm-sans text-sm text-gray-600 mb-4">Default Divider</p>
              <Divider />

              <p className="font-dm-sans text-sm text-gray-600 mb-4 mt-8">Gradient Divider</p>
              <Divider variant="gradient" />

              <p className="font-dm-sans text-sm text-gray-600 mb-4 mt-8">Editorial Divider</p>
              <Divider variant="editorial" />
            </div>
          </Card>
        </section>

        {/* Editorial Divider */}
        <Divider variant="editorial" />

        {/* ============================================
            SECTION 11: COMPONENT LIBRARY - FOOTER
            ============================================ */}
        <section className="animate-fadeInUp-delay-4">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sora text-3xl font-bold text-gray-900">
              Footer Component
            </h2>
            <Badge variant="info">New</Badge>
          </div>

          <Card padding="lg">
            <div className="space-y-8">
              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">With Tagline (default)</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Footer />
                </div>
              </div>

              <div>
                <h3 className="font-sora text-lg font-semibold text-gray-900 mb-4">Without Tagline</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Footer showTagline={false} />
                </div>
              </div>
            </div>
          </Card>
        </section>

      </div>

      {/* ============================================
          MODALS
          ============================================ */}

      {/* Standard Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          ></div>
          <div
            className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-modalIn"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              clipPath: 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%)'
            }}
          >
            {/* Header with gradient accent */}
            <div className="relative px-6 py-5 border-b border-gray-100">
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: 'linear-gradient(to right, #1a6fff, #00c853)',
                }}
              ></div>
              <h3 className="font-sora text-xl font-bold text-gray-900">Edit Class</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="font-dm-sans text-gray-600 mb-6">
                Update your class details below. Changes will take effect for the next booking window.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="font-dm-sans text-sm font-medium text-gray-700 mb-2 block">Class Name</label>
                  <input
                    type="text"
                    defaultValue="BODYPUMP"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-dm-sans text-gray-900 focus:border-[#1a6fff] focus:ring-2 focus:ring-[#1a6fff]/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="font-dm-sans text-sm font-medium text-gray-700 mb-2 block">Time</label>
                  <input
                    type="text"
                    defaultValue="Monday 4:15 PM"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-dm-sans text-gray-900 focus:border-[#1a6fff] focus:ring-2 focus:ring-[#1a6fff]/10 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-dm-sans font-medium rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                style={{
                  boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmModalOpen(false)}
          ></div>
          <div
            className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden animate-modalIn"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="relative px-6 py-5 border-b border-gray-100">
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: '#f43f5e',
                }}
              ></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-sora text-xl font-bold text-gray-900">Delete Class</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="font-dm-sans text-gray-600">
                Are you sure you want to delete <span className="font-medium text-gray-900">BODYPUMP - Monday 4:15 PM</span>? This action cannot be undone and all scheduled bookings will be cancelled.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-dm-sans font-medium rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all"
                style={{
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.25)'
                }}
              >
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      {bottomSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBottomSheetOpen(false)}
          ></div>
          <div
            className="relative bg-white rounded-t-3xl w-full max-w-lg overflow-hidden animate-slideUp"
            style={{
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-8">
              <h3 className="font-sora text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>

              <div className="space-y-2">
                {[
                  { icon: '📅', label: 'Skip Next Occurrence', desc: 'Skip the next booking only' },
                  { icon: '✏️', label: 'Edit Class', desc: 'Modify class details' },
                  { icon: '📋', label: 'Duplicate', desc: 'Create a copy of this class' },
                  { icon: '📊', label: 'View History', desc: 'See past booking attempts' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setBottomSheetOpen(false)}
                    className="w-full p-4 text-left rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-4"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-dm-sans font-medium text-gray-900">{item.label}</p>
                      <p className="font-dm-sans text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setBottomSheetOpen(false)}
                className="w-full mt-4 py-3 bg-gray-100 text-gray-700 font-dm-sans font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Nav Slide-in */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          ></div>
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-white animate-slideInRight overflow-hidden"
            style={{
              clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 16px)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <span className="font-sora font-bold text-xl text-gray-900">Menu</span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                {['Schedule', 'Classes', 'History', 'Settings'].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setMobileNavOpen(false)}
                    className="w-full p-4 text-left rounded-xl hover:bg-gray-50 transition-colors font-dm-sans text-gray-700 hover:text-[#1a6fff]"
                  >
                    {item}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {toasts.map((toast) => {
          const colors = {
            success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', accent: '#00c853' },
            error: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', accent: '#f43f5e' },
            warning: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', accent: '#ff9500' },
            info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', accent: '#1a6fff' },
          }[toast.type]

          return (
            <div
              key={toast.id}
              className={`relative ${colors.bg} ${colors.border} border rounded-lg px-4 py-3 pr-10 min-w-[300px] animate-slideInRight overflow-hidden`}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{
                  background: colors.accent,
                  clipPath: 'polygon(0% 0%, 100% 8%, 100% 92%, 0% 100%)',
                }}
              ></div>
              <p className={`font-dm-sans text-sm ${colors.text} pl-2`}>{toast.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out both;
        }

        .animate-fadeInUp-delay-1 {
          animation: fadeInUp 0.6s ease-out 0.1s both;
        }

        .animate-fadeInUp-delay-2 {
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .animate-fadeInUp-delay-3 {
          animation: fadeInUp 0.6s ease-out 0.3s both;
        }

        .animate-modalIn {
          animation: modalIn 0.3s ease-out both;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out both;
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out both;
        }
      `}</style>

      {/* Page Footer */}
      <Footer />
    </div>
  )
}
