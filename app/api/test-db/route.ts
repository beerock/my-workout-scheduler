import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test query - get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json(
        { error: 'Not authenticated', details: authError.message },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      )
    }

    // Test query - check if gym credentials exist (don't expose actual data)
    const { data: credentials, error: dbError } = await supabase
      .from('gym_credentials')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      database: {
        connected: true,
        hasCredentials: !!credentials,
        error: dbError?.message || null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

