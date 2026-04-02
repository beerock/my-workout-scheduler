'use server'

import { createClient } from '@/lib/supabase/server'
import { encryptPassword } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

export type GymCredentialsFormData = {
  username: string
  password: string
  default_branch: string
}

export type GymCredentialsResult = {
  success: boolean
  error?: string
}

/**
 * Save or update gym credentials for the current user
 * Password is encrypted before storing in the database
 */
export async function saveGymCredentials(
  data: GymCredentialsFormData
): Promise<GymCredentialsResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Encrypt the password (only if provided)
    // For updates, password is optional - if not provided, keep existing encrypted password
    let encryptedPassword: string | undefined

    if (data.password) {
      encryptedPassword = encryptPassword(data.password)
    }

    // Check if credentials already exist for this user
    const { data: existing } = await supabase
      .from('gym_credentials')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Update existing credentials
      const updateData: {
        username: string
        encrypted_password?: string
        default_branch: string | null
      } = {
        username: data.username,
        default_branch: data.default_branch || null,
      }

      // Only update password if a new one was provided
      if (encryptedPassword) {
        updateData.encrypted_password = encryptedPassword
      }

      const { error } = await supabase
        .from('gym_credentials')
        .update(updateData)
        .eq('user_id', user.id)

      if (error) {
        return {
          success: false,
          error: `Failed to update credentials: ${error.message}`,
        }
      }
    } else {
      // Insert new credentials
      const { error } = await supabase
        .from('gym_credentials')
        .insert({
          user_id: user.id,
          gym_url: 'https://www.ymcawnc.org/schedules', // Hardcoded for WNC YMCA (single org MVP)
          username: data.username,
          encrypted_password: encryptedPassword,
          default_branch: data.default_branch || null,
        })

      if (error) {
        return {
          success: false,
          error: `Failed to save credentials: ${error.message}`,
        }
      }
    }

    // Revalidate the credentials page to show updated data
    revalidatePath('/dashboard/credentials')

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

/**
 * Get gym credentials for the current user
 * Note: Returns encrypted password - decryption happens only when needed for automation
 */
export async function getGymCredentials() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
        credentials: null,
      }
    }

    const { data: credentials, error } = await supabase
      .from('gym_credentials')
      .select('id, username, default_branch, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      return {
        success: false,
        error: error.message,
        credentials: null,
      }
    }

    return {
      success: true,
      credentials: credentials || null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      credentials: null,
    }
  }
}

