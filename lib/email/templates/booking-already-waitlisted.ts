/**
 * Booking Already Waitlisted Email Template
 *
 * Sent when the system detects the user is already on the waitlist for a class.
 * No new action was taken -- this is a reassuring informational email.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingAlreadyWaitlistedEmailProps = {
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

export function bookingAlreadyWaitlistedEmail(props: BookingAlreadyWaitlistedEmailProps): { subject: string; html: string } {
  const subject = `Already on the waitlist — ${props.className} on ${props.dayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.success}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Already on the waitlist — no action needed.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Went to book your class and found you already waitlisted. If someone drops before class, the YMCA moves you up and a confirmation email follows.
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
    title: `Already on the waitlist — ${props.className}`,
    preheader: `Already on the waitlist for ${props.className} on ${props.dayOfWeek} — no action needed.`,
    body,
    severity: 'success',
    ctaText: 'View schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true,
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
