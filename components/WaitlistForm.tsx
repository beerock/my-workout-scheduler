'use client'

/**
 * WaitlistForm — public waitlist capture for the landing/signup route.
 *
 * Copy is in showcase voice per docs/VOICE.md (restrained, confident, not
 * self-deprecating). Craft-showcase polish (micro-interactions, animation
 * choreography, typography rhythm) is deferred to task 6 of Sprint 1 — this
 * is the functional baseline.
 *
 * Defense-in-depth: server action submitWaitlist also validates and uses
 * service-role writes, so the form trusts the action and keeps its own
 * client-side validation minimal (email format + note length cap).
 */

import { useState } from 'react'
import { Alert, Button, Input } from '@/components/ui'
import { submitWaitlist } from '@/app/actions/waitlist'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NOTE_LENGTH = 500

type Status =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'submitted' }
  | { phase: 'error'; message: string }

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [status, setStatus] = useState<Status>({ phase: 'idle' })

  const trimmedEmail = email.trim()
  const emailIsValid = EMAIL_REGEX.test(trimmedEmail)
  const emailError = emailTouched && trimmedEmail.length > 0 && !emailIsValid
    ? 'Enter a valid email address.'
    : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailTouched(true)
    if (!emailIsValid) {
      setStatus({ phase: 'error', message: 'Enter a valid email address.' })
      return
    }

    setStatus({ phase: 'submitting' })
    try {
      const result = await submitWaitlist(trimmedEmail, note || null)
      if (result.success) {
        setStatus({ phase: 'submitted' })
      } else {
        setStatus({ phase: 'error', message: result.error })
      }
    } catch (err) {
      setStatus({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Something went sideways. Try again in a moment.',
      })
    }
  }

  if (status.phase === 'submitted') {
    return (
      <div className="space-y-4" aria-live="polite">
        <Alert variant="success">
          <span className="font-dm-sans">
            You're on the waitlist. We'll reach out when a seat opens up — check your inbox for a short note confirming the signup.
          </span>
        </Alert>
        <p className="text-center font-dm-sans text-sm text-gray-600">
          Nothing else needed from you for now.
        </p>
      </div>
    )
  }

  const noteLength = note.length
  const noteTooLong = noteLength > MAX_NOTE_LENGTH

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (status.phase === 'error') setStatus({ phase: 'idle' })
        }}
        onBlur={() => setEmailTouched(true)}
        error={emailError}
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
      />

      <div>
        <label
          htmlFor="waitlist-note"
          className="block font-dm-sans text-sm font-medium text-gray-700 mb-1.5"
        >
          Anything we should know? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="waitlist-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={MAX_NOTE_LENGTH + 50 /* let the user overshoot a bit; server trims */}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-dm-sans text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          placeholder="Which branch, which classes, anything else useful — totally optional."
        />
        <div className="mt-1 flex justify-between text-xs font-dm-sans text-gray-500">
          <span>{noteTooLong ? 'Keep it short — 500 characters max.' : ' '}</span>
          <span className={noteTooLong ? 'text-danger-600' : ''}>
            {noteLength}/{MAX_NOTE_LENGTH}
          </span>
        </div>
      </div>

      {status.phase === 'error' && (
        <Alert variant="error">{status.message}</Alert>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={status.phase === 'submitting'}
        disabled={noteTooLong}
      >
        Join the waitlist
      </Button>

      <p className="text-center font-dm-sans text-xs text-gray-500">
        We'll only email you once — confirmation, and then again when your invite is ready.
      </p>
    </form>
  )
}
