/**
 * API endpoint to manually trigger a booking for a class
 * Used when user adds/updates a class and booking window is already open
 */
import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/lib/supabase/server';

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
    const { data: classData, error: classError } = await supabase
      .from('recurring_classes')
      .select('id, user_id')
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

    // Trigger Inngest booking event
    await inngest.send({
      name: 'booking/attempt',
      data: {
        classId,
        attemptNumber: 1,
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
