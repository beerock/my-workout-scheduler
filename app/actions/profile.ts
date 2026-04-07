'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateEmail, validatePassword, getPasswordErrorMessage } from '@/lib/validation'
import { getAuthCallbackUrl } from '@/lib/env-utils'

export type ProfileResult = {
  success: boolean
  error?: string
  requiresEmailConfirmation?: boolean
}

/**
 * Get current user profile information
 */
export async function getUserProfile() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        success: false,
        error: 'Not authenticated',
        user: null,
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      user: null,
    }
  }
}

/**
 * Update user email address
 * Requires password verification to ensure security
 * Note: User will receive confirmation email at new address only
 */
export async function updateEmail(
  newEmail: string,
  currentPassword: string
): Promise<ProfileResult> {
  try {
    const supabase = await createClient()

    // Validate email format using shared utility
    const emailError = validateEmail(newEmail)
    if (emailError) {
      return {
        success: false,
        error: emailError,
      }
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Check if email is the same as current
    if (user.email === newEmail) {
      return {
        success: false,
        error: 'New email is the same as current email',
      }
    }

    // Verify current password by attempting to sign in
    if (user.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        return {
          success: false,
          error: 'Current password is incorrect',
        }
      }
    }

    // Update email - this will send a confirmation email to the new address only
    const { error: updateError } = await supabase.auth.updateUser(
      {
        email: newEmail,
      },
      {
        emailRedirectTo: getAuthCallbackUrl(),
      }
    )

    if (updateError) {
      // Check for duplicate email error from Supabase
      // Common error messages: "User already registered", "email address is already registered"
      const errorMsg = updateError.message.toLowerCase()
      if (
        errorMsg.includes('already registered') ||
        errorMsg.includes('already exists') ||
        errorMsg.includes('duplicate') ||
        errorMsg.includes('unique constraint')
      ) {
        return {
          success: false,
          error: 'email_already_exists',
        }
      }
      return {
        success: false,
        error: `Failed to update email: ${updateError.message}`,
      }
    }

    revalidatePath('/dashboard/account')
    return {
      success: true,
      requiresEmailConfirmation: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Update user password
 */
export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<ProfileResult> {
  try {
    const supabase = await createClient()

    // Validate new password using shared utility
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: getPasswordErrorMessage(),
      }
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Verify current password by attempting to sign in
    if (user.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        return {
          success: false,
          error: 'Current password is incorrect',
        }
      }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return {
        success: false,
        error: `Failed to update password: ${updateError.message}`,
      }
    }

    revalidatePath('/dashboard/account')
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
 * Delete user account
 * WARNING: This is a destructive action that cannot be undone
 */
export async function deleteAccount(confirmPassword: string): Promise<ProfileResult> {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Verify password by attempting to sign in
    if (user.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: confirmPassword,
      })

      if (signInError) {
        return {
          success: false,
          error: 'Password is incorrect',
        }
      }
    }

    // Create admin client with service role key for user deletion
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
    const supabaseAdmin = createServiceRoleClient()

    // Delete user account using admin client
    // Note: Supabase will automatically cascade delete related data if RLS policies are set up correctly
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      return {
        success: false,
        error: `Failed to delete account: ${deleteError.message}`,
      }
    }

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
