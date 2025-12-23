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
  settingsUrl: string;
};

export function bookingWaitlistEmail(props: BookingWaitlistEmailProps): { subject: string; html: string } {
  const subject = `⏳ Waitlisted: ${props.className} on ${props.dayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      ⏳ You're on the waitlist
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      The class was full, but we added you to the waitlist. If a spot opens up, you'll be automatically confirmed.
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
      <strong>What happens next:</strong>
    </p>
    <ul style="margin: 0 0 ${emailDesign.spacing.lg}; padding-left: ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      <li style="margin-bottom: ${emailDesign.spacing.sm};">If someone cancels, you'll move up the list</li>
      <li style="margin-bottom: ${emailDesign.spacing.sm};">You'll get a confirmation email if you get in</li>
      <li>Plan as if you're attending, but check your email closer to class time</li>
    </ul>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <em>Waitlisted at ${props.bookingTimestamp}</em>
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Waitlisted: ${props.className}`,
    preheader: `You're on the waitlist for ${props.className} on ${props.dayOfWeek}`,
    body,
    severity: 'warning',
    ctaText: 'View My Schedule',
    ctaLink: props.dashboardUrl,
    showUnsubscribe: true, // Success-like emails can be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
