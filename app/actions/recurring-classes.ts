'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { scheduleBooking, calculateBookingWindowOpen, calculateNextClassDate } from '@/lib/inngest/scheduler'
import { inngest } from '@/lib/inngest/client'
import { notifyAdminCustomClass } from '@/lib/notifications/send-admin-notification'

export type RecurringClassFormData = {
  day_of_week: number
  class_time: string
  class_type: string
  branch: string
  booking_window_hours: number
  timezone: string
  isCustomClassName?: boolean
}

export type RecurringClassResult = {
  success: boolean
  error?: string
  id?: string
  bookingWindowAlreadyOpen?: boolean
  bookingTime?: Date
  skipClearWarning?: boolean
  skipDate?: string | null
  deactivatedWarning?: boolean  // Signal that class is deactivated and needs user choice
  isCustomClassName?: boolean   // Signal to show custom class toast
  classDetails?: {
    class_type: string
    day_of_week: number
    class_time: string
    branch: string
  }
}

/**
 * Save or update a recurring class for the current user
 */
export async function saveRecurringClass(
  data: RecurringClassFormData,
  id?: string,
  confirmSkipClear?: boolean,
  activateChoice?: 'activate' | 'keep_deactivated'
): Promise<RecurringClassResult> {
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

    // Validate required fields
    if (
      data.day_of_week === undefined ||
      !data.class_time ||
      !data.class_type ||
      !data.branch
    ) {
      return {
        success: false,
        error: 'Please fill in all required fields',
      }
    }

    // Validate day_of_week (0-6)
    if (data.day_of_week < 0 || data.day_of_week > 6) {
      return {
        success: false,
        error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      }
    }

    const classData: {
      user_id: string
      day_of_week: number
      class_time: string
      class_type: string
      branch: string
      booking_window_hours: number
      timezone: string
      active: boolean
      skip_next_occurrence?: boolean
      skip_target_datetime?: string | null
    } = {
      user_id: user.id,
      day_of_week: data.day_of_week,
      class_time: data.class_time,
      class_type: data.class_type,
      branch: data.branch,
      booking_window_hours: data.booking_window_hours || 26,
      timezone: data.timezone || 'America/New_York',
      active: true,
    }

    let resultId: string
    // Only show the custom class toast if it's a new class or the class name changed
    let showCustomClassToast = false

    if (id) {
      // Fetch existing class to check for field changes and active status
      const { data: existingClass, error: fetchError } = await supabase
        .from('recurring_classes')
        .select('day_of_week, class_time, class_type, branch, booking_window_hours, skip_next_occurrence, skip_target_datetime, active')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !existingClass) {
        return {
          success: false,
          error: 'Class not found',
        }
      }

      // Check if ANY field changed - all field changes invalidate skip
      // Use Number() to ensure consistent comparison (form may send string, DB returns number)
      const anyFieldChanged =
        Number(existingClass.day_of_week) !== Number(data.day_of_week) ||
        existingClass.class_time !== data.class_time ||
        existingClass.class_type !== data.class_type ||
        existingClass.branch !== data.branch ||
        Number(existingClass.booking_window_hours) !== Number(data.booking_window_hours)

      // Check if skip is active (use Boolean to handle truthy values from DB)
      const hasActiveSkip = Boolean(existingClass.skip_next_occurrence)

      // If ANY field changed AND skip active AND user hasn't confirmed
      if (anyFieldChanged && hasActiveSkip && !confirmSkipClear) {
        return {
          success: false,
          skipClearWarning: true,
          skipDate: existingClass.skip_target_datetime,
        }
      }

      // Clear skip if any field changed (user already confirmed at this point)
      if (anyFieldChanged && hasActiveSkip) {
        classData.skip_next_occurrence = false
        classData.skip_target_datetime = null
      }

      // Check if class is deactivated and user hasn't made a choice yet
      const isDeactivated = existingClass.active === false
      if (isDeactivated && !activateChoice) {
        return {
          success: false,
          deactivatedWarning: true,
        }
      }

      // Set active status based on user's choice (or default to true for active classes)
      if (activateChoice === 'keep_deactivated') {
        classData.active = false
      } else {
        // 'activate' or no choice (class was already active) → set to true
        classData.active = true
      }

      // Update existing class
      const { error } = await supabase
        .from('recurring_classes')
        .update(classData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user owns this class

      if (error) {
        return {
          success: false,
          error: `Failed to update class: ${error.message}`,
        }
      }

      resultId = id
      // Only notify/toast if the class name itself changed to something custom
      if (data.isCustomClassName && existingClass.class_type !== data.class_type) {
        showCustomClassToast = true
      }
    } else {
      // Insert new class
      const { data: newClass, error } = await supabase
        .from('recurring_classes')
        .insert(classData)
        .select('id')
        .single()

      if (error) {
        return {
          success: false,
          error: `Failed to save class: ${error.message}`,
        }
      }

      resultId = newClass.id
      showCustomClassToast = !!data.isCustomClassName
    }

    // Fire-and-forget: notify admins if custom class name (dedup table handles repeats)
    if (showCustomClassToast) {
      notifyAdminCustomClass({
        userId: user.id,
        className: data.class_type,
        classId: resultId,
        branch: data.branch,
        dayOfWeek: data.day_of_week,
        classTime: data.class_time,
      }).catch((err) => console.error('[CustomClass] Admin notification failed:', err))
    }

    // Schedule booking with Inngest
    try {
      const bookingTime = calculateBookingWindowOpen(
        data.day_of_week,
        data.class_time,
        data.booking_window_hours || 26,
        data.timezone || 'America/New_York'
      )

      const isBookingWindowOpen = bookingTime.getTime() <= Date.now()

      // Only handle booking logic for active classes
      if (!classData.active) {
        // Class is inactive - don't schedule or prompt to book
        revalidatePath('/dashboard/schedule')
        return {
          success: true,
          id: resultId,
          isCustomClassName: showCustomClassToast,
        }
      }

      if (isBookingWindowOpen) {
        // Booking window is already open AND class is active
        // Don't schedule anything yet - let the user decide via dialog
        // If they click "Book Now", /api/trigger-booking will handle it
        // If they click "Skip", the daily scheduler will schedule next week's occurrence
        revalidatePath('/dashboard/schedule')
        return {
          success: true,
          id: resultId,
          bookingWindowAlreadyOpen: true,
          bookingTime,
          isCustomClassName: showCustomClassToast,
          classDetails: {
            class_type: data.class_type,
            day_of_week: data.day_of_week,
            class_time: data.class_time,
            branch: data.branch,
          },
        }
      } else {
        // Booking window is in the future - schedule it normally
        await scheduleBooking({
          id: resultId,
          class_type: data.class_type,
          day_of_week: data.day_of_week,
          class_time: data.class_time,
          booking_window_hours: data.booking_window_hours || 26,
          timezone: data.timezone || 'America/New_York',
        })

        revalidatePath('/dashboard/schedule')
        return {
          success: true,
          id: resultId,
          bookingWindowAlreadyOpen: false,
          bookingTime,
          isCustomClassName: showCustomClassToast,
        }
      }
    } catch (schedulingError) {
      // If scheduling fails, still return success (class was saved)
      // Just log the error and return without scheduling info
      console.error('Failed to schedule booking with Inngest:', schedulingError)
      revalidatePath('/dashboard/schedule')
      return {
        success: true,
        id: resultId,
        isCustomClassName: showCustomClassToast,
        error: 'Class saved but failed to schedule booking. The daily scheduler will pick it up.',
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get all recurring classes for the current user
 */
export async function getRecurringClasses() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
        classes: null,
      }
    }

    const { data: classes, error } = await supabase
      .from('recurring_classes')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week', { ascending: true })
      .order('class_time', { ascending: true })

    if (error) {
      return {
        success: false,
        error: error.message,
        classes: null,
      }
    }

    return {
      success: true,
      classes: classes || [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      classes: null,
    }
  }
}

/**
 * Get a single recurring class by ID
 */
export async function getRecurringClass(id: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
        class: null,
      }
    }

    const { data: classData, error } = await supabase
      .from('recurring_classes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      return {
        success: false,
        error: error.message,
        class: null,
      }
    }

    return {
      success: true,
      class: classData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      class: null,
    }
  }
}

/**
 * Delete a recurring class
 */
export async function deleteRecurringClass(id: string): Promise<RecurringClassResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Fetch class data first so we can cancel any pending Inngest run
    const { data: classData, error: fetchError } = await supabase
      .from('recurring_classes')
      .select('day_of_week, class_time, timezone')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return {
        success: false,
        error: `Failed to fetch class: ${fetchError.message}`,
      }
    }

    // Cancel any pending scheduled run for this class
    if (classData) {
      try {
        const classDate = calculateNextClassDate(
          classData.day_of_week,
          classData.class_time,
          classData.timezone
        )

        await inngest.send({
          name: 'booking/cancel',
          data: {
            classId: id,
            classDate,
          },
        })
        console.log(`[Delete] Sent cancel event for class ${id} on ${classDate}`)
      } catch (cancelError) {
        // Log but don't fail - the class will still be deleted
        console.error('Failed to send cancel event:', cancelError)
      }
    }

    // Now delete the class
    const { error } = await supabase
      .from('recurring_classes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this class

    if (error) {
      return {
        success: false,
        error: `Failed to delete class: ${error.message}`,
      }
    }

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
 * Toggle active status of a recurring class
 * @param confirmSkipClear - If true, user has confirmed they want to clear the skip when deactivating
 */
export async function toggleRecurringClassActive(
  id: string,
  active: boolean,
  confirmSkipClear?: boolean
): Promise<RecurringClassResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // If DEACTIVATING (active = false), check for skip and prompt user
    let updateData: any = { active }

    if (active === false) {
      // Fetch current class with all fields needed
      const { data: existingClass, error: fetchError } = await supabase
        .from('recurring_classes')
        .select('skip_next_occurrence, skip_target_datetime, day_of_week, class_time, booking_window_hours, timezone')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        return {
          success: false,
          error: 'Class not found',
        }
      }

      // If class has an active skip and user hasn't confirmed, show warning
      const hasActiveSkip = Boolean(existingClass?.skip_next_occurrence)
      if (hasActiveSkip && !confirmSkipClear) {
        return {
          success: false,
          skipClearWarning: true,
          skipDate: existingClass?.skip_target_datetime || null,
        }
      }

      // User confirmed OR no skip - always clear skip when deactivating
      if (hasActiveSkip) {
        updateData.skip_next_occurrence = false
        updateData.skip_target_datetime = null
        console.log('[toggleRecurringClassActive] Clearing skip on deactivate (user confirmed)')
      }
    }

    const { error } = await supabase
      .from('recurring_classes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this class

    if (error) {
      return {
        success: false,
        error: `Failed to update class: ${error.message}`,
      }
    }

    // If ACTIVATING (active = true), check if booking window is open
    if (active === true) {
      try {
        const { data: classData } = await supabase
          .from('recurring_classes')
          .select('id, class_type, day_of_week, class_time, booking_window_hours, timezone, branch')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (classData) {
          const bookingTime = calculateBookingWindowOpen(
            classData.day_of_week,
            classData.class_time,
            classData.booking_window_hours || 26,
            classData.timezone || 'America/New_York'
          )

          const isWindowOpen = bookingTime.getTime() <= Date.now()

          if (isWindowOpen) {
            // Window open - return for user prompt
            console.log(`[Activate] Booking window open for class ${id}, prompting user`)
            revalidatePath('/dashboard/schedule')
            return {
              success: true,
              bookingWindowAlreadyOpen: true,
              classDetails: {
                class_type: classData.class_type,
                day_of_week: classData.day_of_week,
                class_time: classData.class_time,
                branch: classData.branch
              }
            }
          } else {
            // Window not open - schedule silently
            await scheduleBooking(classData)
            console.log(`[Activate] Scheduled class ${id} for ${bookingTime.toISOString()}`)
          }
        }
      } catch (error) {
        console.error(`Failed to process activated class ${id}:`, error)
      }
    }

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
 * Set skip for next occurrence of a recurring class
 * Uses two-field approach: flag for business logic, datetime for UI display
 *
 * @param id Class ID
 * @param skipTargetDatetime ISO string of target class datetime, or null to clear skip
 */
export async function setSkipNextOccurrence(
  id: string,
  skipTargetDatetime: string | null
): Promise<RecurringClassResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Set both fields atomically
    const updateData = skipTargetDatetime
      ? {
          skip_next_occurrence: true, // Flag for Inngest
          skip_target_datetime: skipTargetDatetime, // Datetime for UI
        }
      : {
          skip_next_occurrence: false, // Clear flag
          skip_target_datetime: null, // Clear datetime
        }

    const { error } = await supabase
      .from('recurring_classes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this class

    if (error) {
      return {
        success: false,
        error: `Failed to update skip: ${error.message}`,
      }
    }

    // If CLEARING SKIP (skipTargetDatetime = null), check if booking window is open
    if (skipTargetDatetime === null) {
      try {
        const { data: classData } = await supabase
          .from('recurring_classes')
          .select('id, class_type, day_of_week, class_time, booking_window_hours, timezone, branch, active')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (classData && classData.active) {
          const bookingTime = calculateBookingWindowOpen(
            classData.day_of_week,
            classData.class_time,
            classData.booking_window_hours || 26,
            classData.timezone || 'America/New_York'
          )

          const isWindowOpen = bookingTime.getTime() <= Date.now()

          if (isWindowOpen) {
            // Window open - return for user prompt
            console.log(`[Unskip] Booking window open for class ${id}, prompting user`)
            revalidatePath('/dashboard/schedule')
            return {
              success: true,
              bookingWindowAlreadyOpen: true,
              classDetails: {
                class_type: classData.class_type,
                day_of_week: classData.day_of_week,
                class_time: classData.class_time,
                branch: classData.branch
              }
            }
          } else {
            // Window not open - schedule silently
            await scheduleBooking(classData)
            console.log(`[Unskip] Scheduled class ${id} for ${bookingTime.toISOString()}`)
          }
        }
      } catch (error) {
        console.error(`Failed to process unskipped class ${id}:`, error)
      }
    }

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

