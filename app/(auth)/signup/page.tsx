import Link from 'next/link'
import AuthLayout from '@/components/AuthLayout'
import { Alert } from '@/components/ui'

export default function SignupPage() {
  return (
    <AuthLayout title="Invite only" subtitle="My Workout Scheduler is currently in private beta">
      <div className="space-y-4">
        <Alert variant="info">
          Sign-ups are currently closed. If you&apos;d like access, please reach out to the team for an invite.
        </Alert>

        <p className="text-center font-dm-sans text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
