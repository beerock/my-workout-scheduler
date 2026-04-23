import Link from 'next/link'
import AuthLayout from '@/components/AuthLayout'
import { WaitlistForm } from '@/components/WaitlistForm'

export default function SignupPage() {
  return (
    <AuthLayout
      title="Join the waitlist"
      subtitle="Currently invite-only. Drop your email and we'll reach out when a spot opens."
    >
      <WaitlistForm />

      <p className="mt-6 text-center font-dm-sans text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
