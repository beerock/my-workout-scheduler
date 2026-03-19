/**
 * Inngest API route - webhook endpoint for Inngest to trigger functions
 * This endpoint is called by Inngest to execute scheduled booking functions
 */
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import {
  bookClassFunction,
  dailySchedulerFunction,
  pauseReminderFunction,
  supabaseKeepAliveFunction,
} from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    bookClassFunction,          // Handles booking attempts with retries
    dailySchedulerFunction,     // Runs daily to schedule upcoming bookings
    pauseReminderFunction,      // Sends reminder 7 days after pausing schedule
    supabaseKeepAliveFunction,  // Prevents Supabase free-tier pause
  ],
});
