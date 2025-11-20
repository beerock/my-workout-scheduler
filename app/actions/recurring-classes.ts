'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { scheduleBooking, calculateBookingWindowOpen } from '@/lib/inngest/scheduler'

export type RecurringClassFormData = {
  day_of_week: number
  class_time: string
  class_type: string
  branch: string
  booking_window_hours: number
  timezone: string
}

export type RecurringClassResult = {
  success: boolean
  error?: string
  id?: string
  bookingWindowAlreadyOpen?: boolean
  bookingTime?: Date
}

/**
 * Save or update a recurring class for the current user
 */
export async function saveRecurringClass(
  data: RecurringClassFormData,
  id?: string
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

    const classData = {
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

    if (id) {
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

      if (isBookingWindowOpen) {
        // Booking window is already open
        // Don't schedule anything yet - let the user decide via dialog
        // If they click "Book Now", /api/trigger-booking will handle it
        // If they click "Skip", the daily scheduler will schedule next week's occurrence
        revalidatePath('/dashboard/schedule')
        return {
          success: true,
          id: resultId,
          bookingWindowAlreadyOpen: true,
          bookingTime,
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
 */
export async function toggleRecurringClassActive(
  id: string,
  active: boolean
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

    const { error } = await supabase
      .from('recurring_classes')
      .update({ active })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this class

    if (error) {
      return {
        success: false,
        error: `Failed to update class: ${error.message}`,
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

