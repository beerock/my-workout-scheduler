/**
 * Booking Retry Successful Email Template
 *
 * Sent when a previously full class becomes available and we successfully book it.
 * This is a special celebration email - "We got you in!"
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
  settingsUrl: string;
};

export function bookingRetrySuccessfulEmail(props: BookingRetrySuccessfulEmailProps): { subject: string; html: string } {
  const subject = `🎉 We got you in! ${props.className} on ${props.dayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.success}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      🎉 Great news - we got you in!
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      The class was full earlier, but a spot opened up and we grabbed it for you. You're all set!
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

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fef3c7; border-radius: ${emailDesign.borderRadius}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      💡 <strong>Pro tip:</strong> We kept trying every 15 minutes and snagged this spot when it opened up. That's what we're here for!
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      <strong>What's next:</strong>
    </p>
    <ul style="margin: 0 0 ${emailDesign.spacing.lg}; padding-left: ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      <li style="margin-bottom: ${emailDesign.spacing.sm};">Show up ready to workout</li>
      <li style="margin-bottom: ${emailDesign.spacing.sm};">Bring water and a towel</li>
      <li>Enjoy your class!</li>
    </ul>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <em>Confirmed at ${props.bookingTimestamp} after ${props.retryCount} ${props.retryCount === 1 ? 'retry' : 'retries'}</em>
    </p>
  `;

  const html = baseEmailTemplate({
    title: `We got you in! ${props.className}`,
    preheader: `A spot opened up for ${props.className} on ${props.dayOfWeek} and we booked it!`,
    body,
    severity: 'success',
    ctaText: 'View My Schedule',
    ctaLink: props.dashboardUrl,
    showUnsubscribe: true, // Success emails can be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
