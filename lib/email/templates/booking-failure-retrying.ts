/**
 * Booking Failure - Class Full (Retrying) Email Template
 *
 * Sent when a class is full and the system is automatically retrying:
 * - Class is full but retries are scheduled
 * - User does not need to take action
 * - Blue/informational tone (not warning/error)
 *
 * This is an informational notification, not an error.
 * The system is working as expected - just waiting for a spot to open.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingFailureRetryingEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  firstAttemptTime: string; // When we first tried to book
  classStartTime: string; // When the class starts (retries will continue until this time)
  dashboardUrl: string;
  scheduleUrl: string;
  settingsUrl: string;
};

export function bookingFailureRetryingEmail(props: BookingFailureRetryingEmailProps): { subject: string; html: string } {
  const subject = `🔄 Class Full - We're Keeping an Eye Out for ${props.className}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      🔄 We've Got This!
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Your class is currently full, but <strong>we're automatically keeping watch</strong> for an opening:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            ${props.className}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            📅 ${props.dayOfWeek}, ${props.date}<br>
            🕐 ${props.time}<br>
            📍 ${props.branchName}
          </p>
        </td>
      </tr>
    </table>

    <div style="margin: 0 0 ${emailDesign.spacing.lg};">
      <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        What we're doing:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.8;">
        <li><strong>Automatically checking every 15 minutes</strong> until the class starts</li>
        <li>If someone cancels, we'll grab that spot for you immediately</li>
        <li>You'll get a confirmation email if we successfully book it</li>
        <li><strong>No action needed from you</strong> - just sit back and relax!</li>
      </ul>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>First attempt:</strong> ${props.firstAttemptTime}
          </p>
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>Status:</strong> Retrying every 15 minutes
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>Will keep trying until:</strong> ${props.classStartTime}
          </p>
        </td>
      </tr>
    </table>

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fef3c7; border-radius: ${emailDesign.borderRadius};">
      <p style="margin: 0; color: #92400e; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
        <strong>Want to try a different time?</strong> You can add another class to your schedule as a backup.
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    title: `Class Full: ${props.className}`,
    preheader: `${props.className} is full - we're automatically retrying until ${props.classStartTime}`,
    body,
    severity: 'info', // Blue informational color
    ctaText: 'View Retry Status',
    ctaLink: props.dashboardUrl,
    showUnsubscribe: true, // Users CAN disable retry notifications
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
