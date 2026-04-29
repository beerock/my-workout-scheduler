/**
 * Booking Retry Waitlisted Email Template
 *
 * Sent when a previously full class opens a waitlist spot during retries and
 * we successfully add the user to the waitlist. Mirrors retry-successful's
 * "watching paid off" framing but uses warning severity since the outcome is
 * a waitlist seat, not a confirmed booking.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingRetryWaitlistedEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  bookingTimestamp: string;
  retryCount: number;
  dashboardUrl: string;
  scheduleUrl: string;
  settingsUrl: string;
};

export function bookingRetryWaitlistedEmail(props: BookingRetryWaitlistedEmailProps): { subject: string; html: string } {
  const checkWord = props.retryCount === 1 ? 'check' : 'checks';
  const subject = `On the waitlist after ${props.retryCount} ${checkWord} — ${props.className} on ${props.dayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      A waitlist spot opened — you're on it.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Checked ${props.retryCount} ${checkWord} while the class was full. The waitlist opened up — we grabbed a spot. If someone cancels before class, the YMCA bumps you up automatically and a confirmation email follows.
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
      <em>Added to waitlist at ${props.bookingTimestamp} · took ${props.retryCount} ${checkWord} to land a waitlist spot</em>
    </p>
  `;

  const html = baseEmailTemplate({
    title: `On the waitlist — ${props.className}`,
    preheader: `Watching paid off — ${props.className} on ${props.dayOfWeek} has a waitlist spot.`,
    body,
    severity: 'warning',
    ctaText: 'View schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true,
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
