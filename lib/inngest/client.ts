/**
 * Inngest client for event-driven class booking automation
 */
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'my-workout-scheduler',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
