'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateBookingWindowOpen, calculateNextClassDate, scheduleBooking } from '@/lib/inngest/scheduler'
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

    // If PAUSING (paused = true), send pause event for 7-day reminder
    // Skip fields are NOT touched - pause and skip are independent
    if (paused === true) {
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

    // Cancel queued events; getClassById's pause check is the canonical guard, this just avoids wasted Inngest runs.
    if (paused === true) {
      const { data: activeClasses, error: activeError } = await supabase
        .from('recurring_classes')
        .select('id, day_of_week, class_time, timezone')
        .eq('user_id', user.id)
        .eq('active', true)

      if (activeError) {
        console.error(
          `[updateSchedulePaused] Failed to fetch active classes for cancel-on-pause:`,
          activeError
        )
      } else if (activeClasses && activeClasses.length > 0) {
        let cancelledCount = 0
        for (const classItem of activeClasses) {
          try {
            const classDate = calculateNextClassDate(
              classItem.day_of_week,
              classItem.class_time,
              classItem.timezone
            )
            await inngest.send({
              name: 'booking/cancel',
              data: { classId: classItem.id, classDate },
            })
            cancelledCount++
          } catch (cancelError) {
            console.error(
              `[updateSchedulePaused] Failed to send cancel event for class ${classItem.id}:`,
              cancelError
            )
          }
        }
        console.log(
          `[updateSchedulePaused] Sent cancel events for ${cancelledCount}/${activeClasses.length} active classes`
        )
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

      const { data: activeClasses, error: unpauseClassesError } = await supabase
        .from('recurring_classes')
        .select('id, class_type, day_of_week, class_time, booking_window_hours, timezone, branch')
        .eq('user_id', user.id)
        .eq('active', true)

      if (unpauseClassesError) {
        console.error(
          `[updateSchedulePaused] Failed to fetch active classes for unpause reschedule:`,
          unpauseClassesError
        )
      }

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
        // NOTE: Do NOT call revalidatePath here - it causes the page to re-render
        // before the modal can be shown. The refresh will happen after the user
        // finishes with the dialog (via router.refresh in PauseBanner)
        if (classesWithOpenWindows.length > 0) {
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

