/**
 * Booking Already Registered Email Template
 *
 * Sent when the system detects the user is already registered for a class.
 * No new action was taken -- this is a reassuring informational email.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingAlreadyRegisteredEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  bookingTimestamp: string;
  dashboardUrl: string;
  scheduleUrl: string;
  settingsUrl: string;
};

export function bookingAlreadyRegisteredEmail(props: BookingAlreadyRegisteredEmailProps): { subject: string; html: string } {
  const subject = `Already Registered: ${props.className} on ${props.dayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.success}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Great news! You're already registered
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      We went to book your class and found you're already registered. You're all set!
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.success};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            ${props.className}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            📅 ${props.date}<br>
            🕐 ${props.time}<br>
            📍 ${props.branchName}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <em>Checked at ${props.bookingTimestamp}</em>
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Already Registered: ${props.className}`,
    preheader: `You're already registered for ${props.className} on ${props.dayOfWeek}`,
    body,
    severity: 'success',
    ctaText: 'View My Schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true,
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
