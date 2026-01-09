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
  const subject = `⏸️ Your workout schedule is still paused`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      ⏸️ Your schedule is paused
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      It's been a week since you paused your automated bookings.
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      No rush—take all the time you need. But when you're ready to get back to your workout routine, we'll be here to handle the bookings for you.
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      💡 If you're on a longer break, no worries! This is just a friendly check-in. You can unpause anytime from your dashboard.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Your workout schedule is paused',
    preheader: "Ready to get back to it? We're here when you are.",
    body,
    severity: 'warning',
    ctaText: 'Unpause My Schedule',
    ctaLink: props.dashboardUrl,
    showUnsubscribe: true, // Pause reminders can be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
