interface FooterProps {
  className?: string
  style?: React.CSSProperties
}

export function Footer({ className = '', style }: FooterProps) {
  return (
    <footer
      className={`relative z-0 border-t border-gray-200/50 py-6 mt-auto ${className}`}
      style={style}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-1">
          {/* Row 1 — actionable facts. Support inbox first (VOICE.md makes
              help@beerock.com load-bearing; every email template points here
              for real human help). Personal site surfaces the portfolio
              angle without reading self-promotional because it sits alongside
              support + copyright as equal-weight facts. */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <a
              href="mailto:help@beerock.com"
              className="font-dm-sans text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              help@beerock.com
            </a>
            <span aria-hidden="true" className="font-dm-sans text-sm text-gray-300">·</span>
            <a
              href="https://brockbusby.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-dm-sans text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              brockbusby.com
            </a>
          </div>

          {/* Row 2 — closing signature. Gray-400 gives a quiet hierarchy
              separation from the actionable links above without reading as
              disabled. */}
          <p className="font-dm-sans text-xs text-gray-400">
            &copy; 2026{' '}
            <a
              href="https://beerock.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              Beerock
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
