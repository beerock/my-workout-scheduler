/**
 * Booking Waitlist Email Template
 *
 * Sent when a class booking results in being waitlisted.
 * Includes: Waitlist explanation, what happens next
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingWaitlistEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  bookingTimestamp: string;
  dashboardUrl: string;
  scheduleUrl: string; // Link to schedule page (CTA destination)
  settingsUrl: string;
};

export function bookingWaitlistEmail(props: BookingWaitlistEmailProps): { subject: string; html: string } {
  const subject = `On the waitlist for ${props.className} on ${props.dayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      On the waitlist.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Class was packed — your name went on the waitlist. If someone drops before class starts, the YMCA moves you up automatically and a confirmation email follows.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
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
      <li style="margin-bottom: ${emailDesign.spacing.sm};">Plan as if you're going — waitlists clear more often than you'd think</li>
      <li style="margin-bottom: ${emailDesign.spacing.sm};">Arrive 5–10 minutes early so the YMCA desk can check you in if a spot opens at the door</li>
      <li style="margin-bottom: ${emailDesign.spacing.sm};">Watch your email closer to class time for the confirmation</li>
      <li>Nothing else needed on your end</li>
    </ul>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <em>Added to waitlist at ${props.bookingTimestamp}</em>
    </p>
  `;

  const html = baseEmailTemplate({
    title: `On the waitlist — ${props.className}`,
    preheader: `On the waitlist for ${props.className} on ${props.dayOfWeek}.`,
    body,
    severity: 'warning',
    ctaText: 'View schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true, // Success-like emails can be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
