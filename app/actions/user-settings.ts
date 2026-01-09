'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateBookingWindowOpen, scheduleBooking } from '@/lib/inngest/scheduler'
import { inngest } from '@/lib/inngest/client'

export type UserSettingsResult = {
  success: boolean
  error?: string
  classesWithOpenWindows?: Array<{
    id: string
    class_type: string
    day_of_week: number
    class_time: string
    branch: string
  }>
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

    // If PAUSING (paused = true), send pause event for reminder and clean up skips
    if (paused === true) {
      // Send pause event to trigger 7-day reminder
      try {
        await inngest.send({
          name: 'schedule/pause',
          data: { userId: user.id },
        })
        console.log(`[updateSchedulePaused] Sent schedule/pause event for user ${user.id}`)
      } catch (error) {
        console.error(`[updateSchedulePaused] Failed to send pause event:`, error)
        // Non-critical - continue with pause operation
      }
      // Fetch all user's classes with active skips (need full data for window calculation)
      const { data: classesWithSkips, error: fetchError } = await supabase
        .from('recurring_classes')
        .select('id, skip_target_datetime, day_of_week, class_time, booking_window_hours, timezone')
        .eq('user_id', user.id)
        .not('skip_target_datetime', 'is', null)

      if (!fetchError && classesWithSkips && classesWithSkips.length > 0) {
        const now = new Date()
        const classesToClearBoth: string[] = [] // Zone C: Clear both fields
        const classesToClearFlag: string[] = [] // Zone B: Clear flag only

        // Categorize each class into zones
        for (const classItem of classesWithSkips) {
          const classTime = new Date(classItem.skip_target_datetime)

          // Calculate booking window open time
          const bookingWindowOpen = calculateBookingWindowOpen(
            classItem.day_of_week,
            classItem.class_time,
            classItem.booking_window_hours,
            classItem.timezone
          )

          // Three-zone logic
          if (classTime <= now) {
            // Zone C: Past occurrence
            classesToClearBoth.push(classItem.id)
          } else if (bookingWindowOpen <= now) {
            // Zone B: Inside booking window
            classesToClearFlag.push(classItem.id)
          }
          // Zone A: Before booking window - no action (preserve skip)
        }

        // Bulk update Zone C (clear both fields)
        if (classesToClearBoth.length > 0) {
          await supabase
            .from('recurring_classes')
            .update({
              skip_next_occurrence: false,
              skip_target_datetime: null,
            })
            .in('id', classesToClearBoth)
            .eq('user_id', user.id)
          console.log(`[updateSchedulePaused] Zone C: Cleared ${classesToClearBoth.length} past skip(s)`)
        }

        // Bulk update Zone B (clear flag only)
        if (classesToClearFlag.length > 0) {
          await supabase
            .from('recurring_classes')
            .update({
              skip_next_occurrence: false,
              // skip_target_datetime preserved for UI
            })
            .in('id', classesToClearFlag)
            .eq('user_id', user.id)
          console.log(`[updateSchedulePaused] Zone B: Cleared ${classesToClearFlag.length} flag(s) inside window`)
        }
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

    // If UNPAUSING (paused = false), cancel pause reminder and check all active classes for scheduling
    if (paused === false) {
      // Send unpause event to cancel any pending pause reminder
      try {
        await inngest.send({
          name: 'schedule/unpause',
          data: { userId: user.id },
        })
        console.log(`[updateSchedulePaused] Sent schedule/unpause event for user ${user.id}`)
      } catch (error) {
        console.error(`[updateSchedulePaused] Failed to send unpause event:`, error)
        // Non-critical - continue with unpause operation
      }

      const { data: activeClasses } = await supabase
        .from('recurring_classes')
        .select('id, class_type, day_of_week, class_time, booking_window_hours, timezone, branch')
        .eq('user_id', user.id)
        .eq('active', true)

      if (activeClasses && activeClasses.length > 0) {
        const classesWithOpenWindows = []
        let scheduledCount = 0

        for (const classItem of activeClasses) {
          try {
            // Calculate booking window
            const bookingTime = calculateBookingWindowOpen(
              classItem.day_of_week,
              classItem.class_time,
              classItem.booking_window_hours || 26,
              classItem.timezone || 'America/New_York'
            )

            const isWindowOpen = bookingTime.getTime() <= Date.now()

            if (isWindowOpen) {
              // Booking window open - add to list for user prompt
              classesWithOpenWindows.push({
                id: classItem.id,
                class_type: classItem.class_type,
                day_of_week: classItem.day_of_week,
                class_time: classItem.class_time,
                branch: classItem.branch
              })
            } else {
              // Window not open yet - schedule silently
              await scheduleBooking(classItem)
              scheduledCount++
            }
          } catch (error) {
            console.error(`Failed to process class ${classItem.id}:`, error)
          }
        }

        console.log(`[Unpause] Scheduled ${scheduledCount} classes, ${classesWithOpenWindows.length} need user decision`)

        // Return classes with open windows to show dialog
        if (classesWithOpenWindows.length > 0) {
          revalidatePath('/dashboard')
          revalidatePath('/dashboard/schedule')
          return {
            success: true,
            classesWithOpenWindows
          }
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

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  notification_email: boolean
  notification_frequency: 'immediate' | 'critical_only' | 'off'
  email_on_success: boolean
  email_on_waitlist: boolean
  email_on_failure: boolean
  email_on_retry: boolean
  email_on_pause_reminder: boolean
}): Promise<UserSettingsResult> {
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
        .update({
          notification_email: preferences.notification_email,
          notification_frequency: preferences.notification_frequency,
          email_on_success: preferences.email_on_success,
          email_on_waitlist: preferences.email_on_waitlist,
          email_on_failure: preferences.email_on_failure,
          email_on_retry: preferences.email_on_retry,
          email_on_pause_reminder: preferences.email_on_pause_reminder,
        })
        .eq('user_id', user.id)

      if (error) {
        return {
          success: false,
          error: `Failed to update notification preferences: ${error.message}`,
        }
      }
    } else {
      // Create new settings with notification preferences
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          schedule_paused: false,
          notification_email: preferences.notification_email,
          notification_frequency: preferences.notification_frequency,
          email_on_success: preferences.email_on_success,
          email_on_waitlist: preferences.email_on_waitlist,
          email_on_failure: preferences.email_on_failure,
          email_on_retry: preferences.email_on_retry,
          email_on_pause_reminder: preferences.email_on_pause_reminder,
        })

      if (error) {
        return {
          success: false,
          error: `Failed to create notification preferences: ${error.message}`,
        }
      }
    }

    revalidatePath('/dashboard/profile')
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

