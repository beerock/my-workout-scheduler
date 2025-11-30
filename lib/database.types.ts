export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      gym_credentials: {
        Row: {
          id: string
          user_id: string
          gym_url: string
          username: string
          encrypted_password: string
          default_branch: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gym_url: string
          username: string
          encrypted_password: string
          default_branch?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gym_url?: string
          username?: string
          encrypted_password?: string
          default_branch?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recurring_classes: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          class_time: string
          class_type: string
          branch: string
          booking_window_hours: number
          timezone: string
          active: boolean
          skip_next_occurrence: boolean
          skip_target_datetime: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          class_time: string
          class_type: string
          branch: string
          booking_window_hours?: number
          timezone?: string
          active?: boolean
          skip_next_occurrence?: boolean
          skip_target_datetime?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          class_time?: string
          class_type?: string
          branch?: string
          booking_window_hours?: number
          timezone?: string
          active?: boolean
          skip_next_occurrence?: boolean
          skip_target_datetime?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          schedule_paused: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          schedule_paused?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          schedule_paused?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      booking_attempts: {
        Row: {
          id: string
          recurring_class_id: string
          attempt_timestamp: string
          status: 'pending' | 'confirmed' | 'waitlisted' | 'failed' | 'skipped'
          branch_used: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recurring_class_id: string
          attempt_timestamp: string
          status: 'pending' | 'confirmed' | 'waitlisted' | 'failed' | 'skipped'
          branch_used?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recurring_class_id?: string
          attempt_timestamp?: string
          status?: 'pending' | 'confirmed' | 'waitlisted' | 'failed' | 'skipped'
          branch_used?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Helper types for easier use
export type GymCredentials = Database['public']['Tables']['gym_credentials']['Row']
export type RecurringClass = Database['public']['Tables']['recurring_classes']['Row']
export type BookingAttempt = Database['public']['Tables']['booking_attempts']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']

export type NewGymCredentials = Database['public']['Tables']['gym_credentials']['Insert']
export type NewRecurringClass = Database['public']['Tables']['recurring_classes']['Insert']
export type NewBookingAttempt = Database['public']['Tables']['booking_attempts']['Insert']
export type NewUserSettings = Database['public']['Tables']['user_settings']['Insert']

