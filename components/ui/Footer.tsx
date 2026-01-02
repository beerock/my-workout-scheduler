interface FooterProps {
  showTagline?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Footer({ showTagline = true, className = '', style }: FooterProps) {
  return (
    <footer
      className={`relative z-0 border-t border-gray-200/50 py-6 mt-auto ${className}`}
      style={style}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-1">
          {showTagline && (
            <p className="font-dm-sans text-sm text-gray-500">
              Made for gym enthusiasts who value their time
            </p>
          )}
          <p className="font-dm-sans text-xs text-gray-400">
            &copy; 2026 Beerock Studios
          </p>
        </div>
      </div>
    </footer>
  )
}
