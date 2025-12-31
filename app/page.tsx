import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="text-center max-w-lg" padding="lg">
        <h1 className="font-sora text-4xl font-bold text-gray-900 mb-4">
          My Workout Scheduler
        </h1>
        <p className="font-dm-sans text-gray-600 mb-8 text-lg">
          Automatically book gym classes when registration opens
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Sign Up
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
