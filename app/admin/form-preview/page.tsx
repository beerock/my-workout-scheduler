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

  // Variant A sub-options — same tier + anchor, different supporting line.
  // Eyebrow now reads "Registration opens" so the heading datetime reads
  // as an answer to the eyebrow ("Registration opens [when?] Sun Apr 27 ·
  // 2:15 PM"). Supporting line tells the user what the system does at
  // that moment.
  const copyA1 = (
    <>
      <p className="font-sora font-bold text-gray-900">
        {previewCopy.dayDate} · {previewCopy.time}
      </p>
      <p className="font-dm-sans text-sm text-gray-600 mt-1">
        We click Reserve the second it opens.
      </p>
    </>
  )

  const copyA2 = (
    <>
      <p className="font-sora font-bold text-gray-900">
        {previewCopy.dayDate} · {previewCopy.time}
      </p>
      <p className="font-dm-sans text-sm text-gray-600 mt-1">
        That's when the YMCA opens registration for your {previewCopy.classTime} class. We grab the spot automatically — you'll get a confirmation email.
      </p>
    </>
  )

  const copyA3 = (
    <>
      <p className="font-sora font-bold text-gray-900">
        {previewCopy.dayDate} · {previewCopy.time}
      </p>
      <p className="font-dm-sans text-sm text-gray-600 mt-1">
        We grab your spot, email follows.
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

  // Edge case needs a different eyebrow — "Registration opens" doesn't
  // read right when registration is ALREADY open. "Booking now" keeps the
  // same structural pattern (eyebrow + heading + supporting line) but
  // signals the different temporal state.
  //
  // Supporting line must be purely informational. The actual flow is:
  // save → BookNowDialog modal → user chooses to Book Now or Skip. The
  // preview must NOT imply we'll book on save.
  const copyWindowOpen = (
    <>
      <p className="font-sora font-bold text-gray-900">
        Registration's already open.
      </p>
      <p className="font-dm-sans text-sm text-gray-600 mt-1">
        After saving, you'll choose whether to book this one now or skip.
      </p>
    </>
  )

  // ──────────────────────────────────────────────────────────────────────
  // Visual treatments
  // ──────────────────────────────────────────────────────────────────────

  // Eyebrow default is "Registration opens" — reads naturally alongside a
  // datetime heading ("Registration opens [when?] Sun Apr 27 · 2:15 PM").
  // Edge case (window already open) passes a different eyebrow since
  // "Registration opens" doesn't fit when registration is already open.
  const LeftBorderCard = ({
    children,
    eyebrow = 'Registration opens',
  }: {
    children: React.ReactNode
    eyebrow?: string
  }) => (
    <div className="bg-gray-50 border-l-4 border-l-primary-500 rounded-lg p-4">
      <p className="font-dm-sans text-xs uppercase tracking-wider text-primary-600 font-semibold mb-2">
        {eyebrow}
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
                Variant A1 — Factual, plain-language supporting line
              </p>
              <LeftBorderCard>{copyA1}</LeftBorderCard>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Variant A2 — Factual, names the class context
              </p>
              <LeftBorderCard>{copyA2}</LeftBorderCard>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Variant A3 — Factual, ultra-compact
              </p>
              <LeftBorderCard>{copyA3}</LeftBorderCard>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Variant B — Anticipatory coach-voice (original, kept for comparison)
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
                Edge case — booking window is already open (eyebrow switches to "Booking now")
              </p>
              <LeftBorderCard eyebrow="Booking now">{copyWindowOpen}</LeftBorderCard>
            </div>
          </div>
        </section>

        {/* ──────────────────── PART 2: VISUAL TREATMENTS ──────────────────── */}
        <section>
          <h2 className="font-sora text-xl font-bold text-gray-900 mb-2">
            Visual treatments
          </h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            All rendered with copy variant A1 so visual differences stand out.
          </p>

          <div className="space-y-6">
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Treatment 1 — Left-border card (highest visual weight)
              </p>
              <LeftBorderCard>{copyA1}</LeftBorderCard>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Treatment 2 — Info Alert (matches other form feedback)
              </p>
              <InfoAlert>{copyA1}</InfoAlert>
            </div>

            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-2">
                Treatment 3 — Bare hint (lightest touch)
              </p>
              <BareHint>{copyA1}</BareHint>
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
                "Registration Opens" field — hint copy (context: ~95% of classes use 26 hrs, but it's class-specific and needs user confirmation)
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
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Proposed A — names the per-class variability</p>
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
                      Hours before class. Most are 26 — double-check the class page on the YMCA site if yours is different.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Proposed B — shorter, same intent</p>
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
                      Hours before class. Usually 26 — verify on the YMCA class page to be safe.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timezone hidden — ET indicator */}
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-3">
                Timezone field hidden — "Time" label carries the ET signal
              </p>

              <div className="space-y-3">
                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Option A — label suffix + hint</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                      Time (Eastern)
                    </label>
                    <input
                      type="text"
                      defaultValue="04:15 PM"
                      className="w-32 px-3 py-2 border border-gray-300 rounded text-sm"
                      readOnly
                    />
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">
                      All YMCA WNC classes run in Eastern time, wherever you are.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Option B — hint only, standard label</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      defaultValue="04:15 PM"
                      className="w-32 px-3 py-2 border border-gray-300 rounded text-sm"
                      readOnly
                    />
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">
                      Eastern time — all YMCA WNC classes run ET regardless of where you are.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-dm-sans text-xs text-gray-400 mb-1">Option C — inline badge (visual marker)</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                      Time
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue="04:15 PM"
                        className="w-32 px-3 py-2 border border-gray-300 rounded text-sm"
                        readOnly
                      />
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 font-dm-sans">
                        ET
                      </span>
                    </div>
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">
                      All YMCA WNC classes are in Eastern time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section headers */}
            <div>
              <p className="font-dm-sans text-xs uppercase tracking-wider text-gray-500 mb-3">
                Light section headers — two groupings (Registration Opens folds under "When" since it's just another when-related field)
              </p>

              <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-6">
                <div>
                  <h3 className="font-sora text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
                    What class
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                        Class Name
                      </label>
                      <input
                        type="text"
                        defaultValue="BODYPUMP"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        defaultValue="Woodfin YMCA"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-sora text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
                    When
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                        Day
                      </label>
                      <input
                        type="text"
                        defaultValue="Monday"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="font-sora text-sm font-semibold text-gray-700 block mb-1">
                        Time (Eastern)
                      </label>
                      <input
                        type="text"
                        defaultValue="04:15 PM"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        readOnly
                      />
                      <p className="font-dm-sans text-xs text-gray-500 mt-1">
                        All YMCA WNC classes run in Eastern time, wherever you are.
                      </p>
                    </div>
                    <div>
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
                        Hours before class. Most are 26 — double-check the class page on the YMCA site if yours is different.
                      </p>
                    </div>
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
