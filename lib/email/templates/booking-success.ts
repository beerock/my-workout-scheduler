/**
 * Booking Success Email Template
 *
 * Sent when a class booking is confirmed successfully.
 * Includes: Class details, confirmation message, next steps
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingSuccessEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string; // Formatted date (e.g., "Monday, January 15, 2025")
  time: string; // Class time (e.g., "4:15 PM")
  branchName: string;
  bookingTimestamp: string; // When booking was made
  dashboardUrl: string;
  scheduleUrl: string; // Link to schedule page (CTA destination)
  settingsUrl: string;
};

export function bookingSuccessEmail(props: BookingSuccessEmailProps): { subject: string; html: string } {
  const subject = `Got you in — ${props.className} on ${props.dayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.success}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Got you in.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Your seat is locked in. Here's what's on the schedule:
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

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      <strong>Before you go:</strong>
    </p>
    <ul style="margin: 0 0 ${emailDesign.spacing.lg}; padding-left: ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      <li style="margin-bottom: ${emailDesign.spacing.sm};">Show up a few minutes early</li>
      <li style="margin-bottom: ${emailDesign.spacing.sm};">Bring water and a towel</li>
      <li>If your plans change, cancel through the YMCA so the spot opens up for someone else</li>
    </ul>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <em>Booked at ${props.bookingTimestamp}</em>
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Got you in — ${props.className}`,
    preheader: `Seat locked in for ${props.className} on ${props.dayOfWeek}.`,
    body,
    severity: 'success',
    ctaText: 'View schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true, // Success emails can be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
