import Link from 'next/link'
import { Card } from '@/components/ui'
import type { DashboardActionItem } from '@/app/actions/dashboard-stats'

type Props = {
  items: DashboardActionItem[]
  animationDelay?: string
}

/**
 * ActionItemsCard — dashboard failure surface for the Need-your-help tier.
 *
 * Renders only when at least one class has a recent failure that requires
 * user action (credentials stopped working, class settings drifted). Lives
 * in the quick-actions grid so users see it exactly where they go to take
 * action. Single-item layout is tuned for the common case; multi-item
 * collapses to a compact list under one heading so the card doesn't balloon.
 */
export default function ActionItemsCard({ items, animationDelay = '0.25s' }: Props) {
  if (items.length === 0) return null

  const first = items[0]
  const rest = items.slice(1)
  const href = items.length === 1 ? first.ctaHref : '/dashboard/schedule'

  return (
    <Link href={href} className="group block mb-6">
      <Card
        variant="outlined"
        padding="md"
        hover
        className="opacity-0 animate-fade-in-up border-l-4 border-l-error-500 group-hover:border-l-error-600 transition-colors"
        style={{ animationDelay }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-error-100 flex items-center justify-center flex-shrink-0 group-hover:bg-error-200 transition-colors">
            <svg
              className="w-6 h-6 text-error-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-sora text-lg font-bold text-gray-900 group-hover:text-error-600 transition-colors">
              {items.length === 1 ? 'Needs your help' : `${items.length} classes need your help`}
            </h3>

            <p className="font-dm-sans text-sm text-gray-700 mt-1">
              {first.message}
            </p>

            <p className="font-dm-sans text-xs text-gray-500 mt-1">
              {first.className} · {first.dayTime} · {first.branch}
            </p>

            {rest.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-gray-100 pt-2">
                {rest.map((item) => (
                  <li key={item.classId} className="font-dm-sans text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{item.className}</span>
                    {' · '}
                    {item.dayTime} · {item.branch}
                    {' — '}
                    <span className="text-gray-500">{item.ctaText.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            )}

            <span className="mt-3 inline-flex items-center gap-1 font-dm-sans text-sm font-semibold text-error-600 group-hover:text-error-700 transition-colors">
              {items.length === 1 ? first.ctaText : 'Review all'}
              <svg
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
