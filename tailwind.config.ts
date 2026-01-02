import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Electric Blue (Cobalt)
        primary: {
          50: '#e8f4ff',
          100: '#d4e9ff',
          200: '#b0d7ff',
          300: '#7db9ff',
          400: '#4a96ff',
          500: '#1a6fff', // DEFAULT - Electric cobalt
          600: '#0052e6',
          700: '#003eb8',
          800: '#003399',
          900: '#002666',
        },
        // Secondary - Deep Orange
        secondary: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff5722', // DEFAULT - Deep orange (Material Design)
          600: '#f4511e',
          700: '#e64a19',
          800: '#d84315',
          900: '#bf360c',
        },
        // Success - Lime Victory
        success: {
          50: '#f0fdf4',
          100: '#d9f9e3',
          200: '#aef2c5',
          300: '#6ee79f',
          400: '#2dd872',
          500: '#00c853', // DEFAULT - Electric lime green
          600: '#00a844',
          700: '#008936',
          800: '#006b2b',
          900: '#004d1f',
        },
        // Warning - Gold Rush
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // DEFAULT - Vibrant gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Danger - Hot Pink Alert
        danger: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', // DEFAULT - Hot pink-red
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        // Electric Purple - Achievement/Premium accent
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#8B5CF6', // DEFAULT - Electric purple
          600: '#7C3AED',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Booking Status Colors - Fitness Tracker Rings
        status: {
          confirmed: '#00c853',   // Lime Victory
          pending: '#ff9500',     // Bright orange - Energy and anticipation
          waitlisted: '#00b8ff',  // Cyan - Cool, waiting, hopeful
          failed: '#f43f5e',      // Hot Pink
          skipped: '#94a3b8',     // Slate gray
          retrying: '#ff9500',    // Bright orange (with pulse animation)
        },
        // Class Type Colors - Athletic Disciplines
        classType: {
          yoga: '#9333ea',        // Purple - Mindful, spiritual
          cycling: '#ff3d3d',     // Coral red - High energy, cardio
          strength: '#1a6fff',    // Electric blue - Power, intensity
          cardio: '#ff6b00',      // Vibrant orange - Energy, movement
          swimming: '#00b8ff',    // Cyan - Water, flow
          meditation: '#818cf8',  // Soft indigo - Calm, centered
          hiit: '#ff0080',        // Magenta - Intense, explosive
          pilates: '#ec4899',     // Pink - Grace, strength
        },
      },
      fontFamily: {
        // Design System v2 typography
        sora: ['var(--font-sora)', 'sans-serif'],       // Display/headings
        'dm-sans': ['var(--font-dm-sans)', 'sans-serif'], // Body text
        sans: ['var(--font-dm-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        // Design System v2 - 4-layer shadow system
        'card': '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.08)',
        'floating': '0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08)',
        // Button shadows with brand colors
        'btn-primary': '0 4px 12px rgba(26, 111, 255, 0.25)',
        'btn-primary-lg': '0 4px 16px rgba(26, 111, 255, 0.3), 0 8px 32px rgba(26, 111, 255, 0.15)',
        'btn-success': '0 4px 12px rgba(0, 200, 83, 0.25)',
        'btn-danger': '0 4px 12px rgba(244, 63, 94, 0.25)',
        'btn-purple': '0 4px 12px rgba(139, 92, 246, 0.25)',
      },
      keyframes: {
        // Using CSS 'translate' property (not 'transform') so hover transforms still work
        // The 'translate' and 'transform' properties are independent in modern CSS
        fadeInUp: {
          '0%': { opacity: '0', translate: '0 20px' },
          '100%': { opacity: '1', translate: '0 0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // Using 'forwards' keeps elements visible after animation
        // Hover transforms work because animation uses 'translate' (not 'transform')
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-up-delay-1': 'fadeInUp 0.5s ease-out 0.1s forwards',
        'fade-in-up-delay-2': 'fadeInUp 0.5s ease-out 0.2s forwards',
        'fade-in-up-delay-3': 'fadeInUp 0.5s ease-out 0.3s forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-in-up': 'slideInUp 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config
