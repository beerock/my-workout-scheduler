/**
 * API endpoint to manually trigger a booking for a class
 * Used when user adds/updates a class and booking window is already open
 */
import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/lib/supabase/server';
import { calculateNextClassDate } from '@/lib/inngest/scheduler';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json(
        { error: 'classId is required' },
        { status: 400 }
      );
    }

    // Verify the class belongs to the authenticated user
    // Include fields needed to calculate classDate for cancelOn matching
    const { data: classData, error: classError } = await supabase
      .from('recurring_classes')
      .select('id, user_id, class_type, day_of_week, class_time, timezone')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    if (classData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to book this class' },
        { status: 403 }
      );
    }

    // Calculate classDate for cancelOn matching
    const classDate = calculateNextClassDate(
      classData.day_of_week,
      classData.class_time,
      classData.timezone
    );

    // Trigger Inngest booking event (immediate - booking window already open)
    await inngest.send({
      name: 'booking/attempt',
      data: {
        classId,
        className: classData.class_type,
        classDate, // Required for cancelOn matching
        attemptNumber: 1,
        expectedBookingTime: Date.now(), // Immediate booking
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Booking triggered successfully',
    });
  } catch (error) {
    console.error('Error triggering booking:', error);
    return NextResponse.json(
      { error: 'Failed to trigger booking' },
      { status: 500 }
    );
  }
}
