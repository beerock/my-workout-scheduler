/**
 * Bulk cancel all queued runs for the book-class function
 * Used during migration after fixing the cancelOn CEL expression
 *
 * Run with: npx tsx scripts/cancel-all-queued-runs.ts
 */

import { inngest } from '@/lib/inngest/client';

async function cancelAllQueuedRuns() {
  console.log('Starting bulk cancellation of queued book-class runs...\n');

  try {
    // Fetch all queued runs for the book-class function
    // Using the Inngest SDK to query runs
    console.log('Fetching all queued runs for book-class function...');

    // The Inngest SDK provides a way to cancel runs
    // We'll use the REST API approach for bulk operations
    const INNGEST_API_BASE = 'https://api.inngest.com/v1';
    const eventKey = process.env.INNGEST_EVENT_KEY;

    if (!eventKey) {
      throw new Error('INNGEST_EVENT_KEY environment variable is not set');
    }

    // Query for all queued book-class runs
    const response = await fetch(`${INNGEST_API_BASE}/runs?function=book-class&status=queued`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${eventKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch runs: ${response.statusText}`);
    }

    const data = (await response.json()) as { runs: Array<{ id: string; data?: { classId: string; classDate: string } }> };
    const runs = data.runs || [];

    console.log(`Found ${runs.length} queued runs\n`);

    if (runs.length === 0) {
      console.log('No queued runs to cancel. Done!');
      return;
    }

    // Cancel each run
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const classInfo = run.data?.classId ? ` [Class: ${run.data.classId.substring(0, 8)}... Date: ${run.data.classDate}]` : '';

      try {
        const cancelResponse = await fetch(`${INNGEST_API_BASE}/runs/${run.id}/cancel`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${eventKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!cancelResponse.ok) {
          throw new Error(`HTTP ${cancelResponse.status}`);
        }

        console.log(`[${i + 1}/${runs.length}] ✓ Cancelled ${run.id}${classInfo}`);
        successCount++;
      } catch (error) {
        console.error(`[${i + 1}/${runs.length}] ✗ Failed to cancel ${run.id}${classInfo}: ${error}`);
        failureCount++;
      }
    }

    console.log(`\n✅ Bulk cancellation complete!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log(`\nNext step: Trigger the daily scheduler to reschedule with the fixed cancelOn pattern`);
  } catch (error) {
    console.error('❌ Error during bulk cancellation:', error);
    process.exit(1);
  }
}

// Run the cancellation
cancelAllQueuedRuns().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
