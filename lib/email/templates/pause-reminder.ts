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
  const subject = `Still paused — quick check-in`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Still paused — quick check-in.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      A week ago you paused automated bookings. Nothing's been running since.
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      No pressure either way. If you're ready to get back to it, unpause from the dashboard and booking picks up where it left off. If you're still on break, stay paused — that's the whole point.
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      Just a quiet check-in — ignore this one and we'll leave you alone.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Still paused — quick check-in',
    preheader: "Still paused. Unpause anytime — or ignore this and stay paused.",
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
