/**
 * Pause Reminder Email Template
 * Sent 7 days after user pauses their schedule.
 * Friendly reminder to come back when ready.
 * Can be unsubscribed (not a critical email).
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type PauseReminderEmailProps = {
  dashboardUrl: string;
  settingsUrl: string;
};

export function pauseReminderEmail(props: PauseReminderEmailProps): { subject: string; html: string } {
  const subject = `Hope you're somewhere good`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Hope you're somewhere good.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      You paused bookings a week ago — beach week, travel, a season off, something in between. Whatever it was, the schedule's been quiet.
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      When you're back and ready to roll, unpause from the dashboard and booking picks up from the next class on your schedule. Still on break? Stay paused — that's what it's for.
    </p>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Quiet check-in, no reply needed. We'll leave you be unless you come back to us.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Hope you\'re somewhere good',
    preheader: 'Still paused. Unpause when you\'re back — or ignore this and stay off the grid.',
    body,
    severity: 'warning',
    ctaText: 'Unpause schedule',
    ctaLink: props.dashboardUrl,
    showUnsubscribe: true, // Pause reminders can be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
