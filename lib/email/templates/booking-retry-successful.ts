/**
 * Booking Retry Successful Email Template
 *
 * Sent when a previously full class becomes available and we successfully book
 * it. Coach-voice Confirmed tier — warm, specific, no hype. See docs/VOICE.md.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingRetrySuccessfulEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  bookingTimestamp: string;
  retryCount: number; // How many times we tried before success
  dashboardUrl: string;
  scheduleUrl: string; // Link to schedule page (CTA destination)
  settingsUrl: string;
};

export function bookingRetrySuccessfulEmail(props: BookingRetrySuccessfulEmailProps): { subject: string; html: string } {
  const subject = `A spot opened up — ${props.className} on ${props.dayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.success}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      A spot opened up. You're in.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      The class was packed earlier. Watching paid off — someone dropped, we grabbed your seat.
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
      <em>Booked at ${props.bookingTimestamp} · took ${props.retryCount} ${props.retryCount === 1 ? 'check' : 'checks'} to land</em>
    </p>
  `;

  const html = baseEmailTemplate({
    title: `A spot opened up — ${props.className}`,
    preheader: `Watching paid off — ${props.className} on ${props.dayOfWeek} is booked.`,
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
