import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GymCredentialsForm from '@/components/GymCredentialsForm'
import { getGymCredentials } from '@/app/actions/gym-credentials'
import EditorialLayout from '@/components/EditorialLayout'
import { Card, Badge } from '@/components/ui'

export default async function CredentialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get existing credentials
  const { credentials } = await getGymCredentials()
  const hasCredentials = !!credentials

  return (
    <EditorialLayout
      title="Gym Credentials"
      subtitle="Store your gym login securely. Your password is encrypted before being stored."
      backLink={{ href: '/dashboard', label: 'Dashboard' }}
    >
      {/* Security Notice */}
      <Card
        variant="outlined"
        padding="md"
        className="mb-6 border-l-4 border-l-primary-500 bg-gradient-to-br from-primary-50/50 to-blue-50/30 opacity-0 animate-fade-in-up"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-sora text-base font-bold text-gray-900">
                Secure Storage
              </h3>
              <Badge variant="success" size="sm">AES-256 Encrypted</Badge>
            </div>
            <p className="font-dm-sans text-sm text-gray-600">
              Your gym password is encrypted with AES-256-GCM before storage. We never store plain text passwords.
            </p>
          </div>
        </div>
      </Card>

      {/* Status Card */}
      <Card
        variant="outlined"
        padding="md"
        className="mb-6 opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${hasCredentials ? 'bg-success-500' : 'bg-gray-300'}`} />
            <span className="font-dm-sans text-sm text-gray-700">
              {hasCredentials ? 'Credentials configured' : 'No credentials saved yet'}
            </span>
          </div>
          <Badge variant={hasCredentials ? 'success' : 'default'} size="sm">
            {hasCredentials ? 'Active' : 'Not Set'}
          </Badge>
        </div>
      </Card>

      {/* Credentials Form */}
      <Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <GymCredentialsForm initialCredentials={credentials} />
      </Card>
    </EditorialLayout>
  )
}

