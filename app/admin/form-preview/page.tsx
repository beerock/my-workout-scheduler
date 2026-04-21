import type { Metadata } from 'next'
import EditorialLayout from '@/components/EditorialLayout'
import { Alert } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Form Preview (admin)',
}

/**
 * RecurringClassForm preview — task 4 variant review surface. Renders the
 * inline first-booking preview in every copy × visual-treatment combo, plus
 * polish options (field hints, success alerts), so the owner can pick a
 * direction without committing to code yet.
 *
 * Everything here is static presentation — the actual form at
 * /dashboard/schedule/add isn't wired to any of this until a variant lands.
 */
export default function FormPreviewPage() {
  // Shared dummy data: Monday 4:15 PM BODYPUMP @ Woodfin — booking window
  // opens Sunday 2:15 PM (class-time - 26h). Formatted in gym timezone (ET).
  const previewCopy = {
    dayDate: 'Sun Apr 27',
    time: '2:15 PM',
    classTime: '4:15 PM',
  }

  const copyA = (
    <>
      <p className="font-sora font-bold text-gray-900">
        First booking fires {previewCopy.dayDate} · {previewCopy.time}
      </p>
      <p className="font-dm-sans text-sm text-gray-600 mt-1">
        Watching the list the moment registration opens.
      </p>
    </>
  )

  const copyB = (
    <>
      <p className="font-sora font-bold text-gray-900">
        Next Sunday at {previewCopy.time}, we grab your spot.
      </p>
      <p className="font-dm-sans text-sm text-gray-600 mt-1">
        That's when the YMCA opens registration for your {previewCopy.classTime} class. You'll get a confirmation email the moment it lands.
      </p>
    </>
  )

  const copyC = (
    <p className="font-dm-sans text-gray-800">
      Booking fires <strong>{previewCopy.dayDate} · {previewCopy.time}</strong>. You just show up.
    </p>
  )

  const copyWindowOpen = (
    <>
      <p className="font-sora font-bold text-gray-900">
        Window's open right now.
      </p>
      <p className="font-dm-sans text-sm text-gray-600 mt-1">
        Save and we'll book immediately — no waiting.
      </p>
    </>
  )

  // ──────────────────────────────────────────────────────────────────────
  // Visual treatments
  // ──────────────────────────────────────────────────────────────────────

  const LeftBorderCard = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-gray-50 border-l-4 border-l-primary-500 rounded-lg p-4">
      <p className="font-dm-sans text-xs uppercase tracking-wider text-primary-600 font-semibold mb-2">
        First booking
      </p>
      {children}
    </div>
  )

  const InfoAlert = ({ children }: { children: React.ReactNode }) => (
    <Alert variant="info">
      <div>{children}</div>
    </Alert>
  )

  const BareHint = ({ children }: { children: React.ReactNode }) => (
    <div className="py-2">
      {children}
    </div>
  )

  // ──────────────────────────────────────────────────────────────────────
  // Polish — field hints + success alerts
  // ──────────────────────────────────────────────────────────────────────

  return (
    <EditorialLayout
      title="Form Preview"
      subtitle="Admin-only variant surface for the RecurringClassForm inline preview + polish choices."
    >
      <div className="max-w-3xl space-y-12">
        {/* ────────────────────── PART 1: COPY VARIANTS ────────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            Copy variants
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            All rendered in the "left-border card" treatment so copy differences stand out. Based on dummy data: Monday 4:15 PM BODYPUMP @ Woodfin, 26-hour window.
          </p>

          <div className="space-y-6">
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Variant A — Factual / calendar-anchored
              </p>
              <LeftBorderCard>{copyA}</LeftBorderCard>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Variant B — Anticipatory coach-voice
              </p>
              <LeftBorderCard>{copyB}</LeftBorderCard>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Variant C — Minimal / single-line
              </p>
              <LeftBorderCard>{copyC}</LeftBorderCard>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Edge case — booking window is already open
              </p>
              <LeftBorderCard>{copyWindowOpen}</LeftBorderCard>
            </div>
          </div>
        </section>

        {/* ──────────────────── PART 2: VISUAL TREATMENTS ──────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            Visual treatments
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            All rendered with copy variant A so visual differences stand out.
          </p>

          <div className="space-y-6">
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Treatment 1 — Left-border card (highest visual weight)
              </p>
              <LeftBorderCard>{copyA}</LeftBorderCard>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Treatment 2 — Info Alert (matches other form feedback)
              </p>
              <InfoAlert>{copyA}</InfoAlert>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Treatment 3 — Bare hint (lightest touch)
              </p>
              <BareHint>{copyA}</BareHint>
            </div>
          </div>
        </section>

        {/* ──────────────────────── PART 3: POLISH ─────────────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            Polish
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            Small clarity wins on existing form labels + success alerts. Current vs proposed shown side by side.
          </p>

          <div className="space-y-8">
            {/* Field hint polish */}
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-3">
                "Registration Opens" field — hint copy
              </p>

              <div className="space-y-3">
                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Current</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                      Registration Opens
                    </label>
                    <input
                      type="number"
                      defaultValue={26}
                      className="w-20 px-3 py-2 border border-gray-300 rounded text-sm"
                      readOnly
                    />
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">
                      Hours before class (default: 26)
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Proposed A — adds nuance without softening</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                      Registration Opens
                    </label>
                    <input
                      type="number"
                      defaultValue={26}
                      className="w-20 px-3 py-2 border border-gray-300 rounded text-sm"
                      readOnly
                    />
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">
                      Hours before class — YMCA usually opens 26 hrs ahead, confirm for your branch.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Proposed B — drops the default reference entirely</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                      Registration Opens
                    </label>
                    <input
                      type="number"
                      defaultValue={26}
                      className="w-20 px-3 py-2 border border-gray-300 rounded text-sm"
                      readOnly
                    />
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">
                      Check your YMCA branch — typically 26 hrs before class.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success alert polish */}
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-3">
                Success alert after save
              </p>

              <div className="space-y-3">
                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Current</p>
                  <Alert variant="success">
                    Saved. The next registration window starts booking automatically.
                  </Alert>
                </div>

                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Proposed — closes the loop on the preview</p>
                  <Alert variant="success">
                    Saved. First booking fires {previewCopy.dayDate} · {previewCopy.time}.
                  </Alert>
                </div>
              </div>
            </div>

            {/* Other polish options */}
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-3">
                Other polish options (no visual needed — yes / no calls)
              </p>
              <ul className="font-dm-sans text-sm text-gray-700 space-y-2 list-disc pl-5">
                <li>
                  <strong>Hide timezone field.</strong> All active classes are ET. Move to an "Advanced" disclosure or hardcode for YMCA WNC — removes one decision.
                </li>
                <li>
                  <strong>Add light section headers.</strong> Group current fields under "What class" (name + branch), "When" (day + time), "Advanced" (booking-window). Reduces single-list fatigue.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </EditorialLayout>
  )
}
