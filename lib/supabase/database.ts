import { createClient } from './server'
import type { Database } from '@/lib/database.types'

export async function getSupabaseClient() {
  return await createClient()
}

// Helper function to get typed Supabase client
// Note: This is a convenience wrapper - the actual typing comes from database.types.ts
export type SupabaseClient = Awaited<ReturnType<typeof getSupabaseClient>>

