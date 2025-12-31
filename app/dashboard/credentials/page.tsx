import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import GymCredentialsForm from '@/components/GymCredentialsForm'
import { getGymCredentials } from '@/app/actions/gym-credentials'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'

export default async function CredentialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get existing credentials
  const { credentials } = await getGymCredentials()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-card border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="font-sora text-xl font-semibold text-gray-900">
                My Workout Scheduler
              </Link>
              <span className="text-gray-400">|</span>
              <span className="font-dm-sans text-gray-600">Gym Credentials</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="mb-6">
            <h1 className="font-sora text-2xl font-bold text-gray-900 mb-2">Gym Credentials</h1>
            <p className="font-dm-sans text-gray-600 text-sm">
              Store your gym website login credentials securely. Your password is encrypted before being stored.
            </p>
          </div>

          <GymCredentialsForm initialCredentials={credentials} />
        </Card>

        <div className="mt-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

