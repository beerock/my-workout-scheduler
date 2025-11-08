'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type UserSettingsResult = {
  success: boolean
  error?: string
}

/**
 * Get user settings for the current user
 * Creates default settings if they don't exist
 */
export async function getUserSettings() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
        settings: null,
      }
    }

    let { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // If settings don't exist, create default ones
    if (!settings && !error) {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          schedule_paused: false,
        })
        .select()
        .single()

      if (insertError) {
        return {
          success: false,
          error: insertError.message,
          settings: null,
        }
      }

      settings = newSettings
    }

    if (error) {
      return {
        success: false,
        error: error.message,
        settings: null,
      }
    }

    return {
      success: true,
      settings: settings || { user_id: user.id, schedule_paused: false },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      settings: null,
    }
  }
}

/**
 * Update schedule paused status
 */
export async function updateSchedulePaused(
  paused: boolean
): Promise<UserSettingsResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('user_settings')
        .update({ schedule_paused: paused })
        .eq('user_id', user.id)

      if (error) {
        return {
          success: false,
          error: `Failed to update settings: ${error.message}`,
        }
      }
    } else {
      // Create new settings
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          schedule_paused: paused,
        })

      if (error) {
        return {
          success: false,
          error: `Failed to create settings: ${error.message}`,
        }
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/schedule')
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

