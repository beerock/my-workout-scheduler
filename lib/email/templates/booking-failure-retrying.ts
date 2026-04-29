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
  const subject = `Class is packed — watching for a spot on ${props.className}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Class is packed — watching for an opening.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Registration opened and both the class and the waitlist were already full — no spot to grab and no seat to save. Not the end of the line, though: waitlists clear all the time, and the retry loop is already running.
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
        What's happening:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.8;">
        <li>Checking every 15 minutes until class starts</li>
        <li>Grabbing your seat the moment a spot opens</li>
        <li>Confirmation email fires the moment the booking lands</li>
        <li>Nothing you need to do on your end</li>
      </ul>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>First try:</strong> ${props.firstAttemptTime}
          </p>
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>Status:</strong> Checking every 15 minutes
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>Watching until:</strong> ${props.classStartTime}
          </p>
        </td>
      </tr>
    </table>

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fef3c7; border-radius: ${emailDesign.borderRadius};">
      <p style="margin: 0; color: #92400e; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
        <strong>Want a backup?</strong> Add another class at a different time to your schedule — that one books normally while this one stays on the watch.
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    title: `Watching for a spot — ${props.className}`,
    preheader: `${props.className} is packed. Watching every 15 minutes until ${props.classStartTime}.`,
    body,
    severity: 'info', // Blue informational color
    ctaText: 'View schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true, // Users CAN disable retry notifications
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
