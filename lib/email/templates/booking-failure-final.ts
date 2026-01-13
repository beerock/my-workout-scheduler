/**
 * Booking Failure - Final (Retries Exhausted) Email Template
 *
 * Sent when all retries have been exhausted and the class could not be booked:
 * - Class was full and remained full until class start time
 * - OR timeout retries ran out of time
 * - User may want to try again next week or add a backup class
 *
 * This is the "closure" email that completes the promise made in the
 * "Class Full - Retrying" email.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingFailureFinalEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  firstAttemptTime: string; // When we first tried to book
  classStartTime: string; // When the class started (retries ended)
  retryCount: number; // How many times we tried
  dashboardUrl: string;
  scheduleUrl: string;
  settingsUrl: string;
};

export function bookingFailureFinalEmail(props: BookingFailureFinalEmailProps): { subject: string; html: string } {
  const subject = `⏱️ Could Not Get You In - ${props.className} on ${props.dayOfWeek}`;

  const retryText = props.retryCount > 1
    ? `We tried ${props.retryCount} times (every 15 minutes)`
    : 'We tried multiple times';

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      ⏱️ Retries Complete - No Luck This Time
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      We kept trying to book your class, but it <strong>stayed full until class time</strong>. Sometimes timing just doesn't work out.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.neutralLight};">
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

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>First attempt:</strong> ${props.firstAttemptTime}
          </p>
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>What happened:</strong> ${retryText}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>Retries ended:</strong> ${props.classStartTime} (class started)
          </p>
        </td>
      </tr>
    </table>

    <div style="margin: 0 0 ${emailDesign.spacing.lg};">
      <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        What you can do:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.8;">
        <li><strong>Next week:</strong> We'll automatically try again at the same time</li>
        <li><strong>Backup option:</strong> Consider adding a different class as a backup</li>
        <li><strong>More options:</strong> Try this class on a different day or at another branch for better availability</li>
      </ul>
    </div>

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #eff6ff; border-radius: ${emailDesign.borderRadius};">
      <p style="margin: 0; color: #1e40af; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
        <strong>💡 Tip:</strong> This class is in high demand! People often cancel 24-48 hours before. You can also check your gym's app directly closer to class time.
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    title: `Retries Exhausted: ${props.className}`,
    preheader: `We tried to book ${props.className} but it stayed full until class time`,
    body,
    severity: 'warning', // Yellow/amber tone - not critical, but informational
    ctaText: 'View My Schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: false, // Failure emails are always sent (no opt-out)
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
