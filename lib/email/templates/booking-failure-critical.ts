/**
 * Booking Failure - Critical Email Template
 *
 * Sent for critical failures requiring immediate user action:
 * - Login failed
 * - Class cancelled
 * - Class not reservable
 * - Time conflict
 *
 * User must take action to resolve these issues.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type BookingFailureCriticalEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  errorMessage: string; // User-friendly error from ERROR_MESSAGES.md
  dashboardUrl: string;
  settingsUrl: string;
};

export function bookingFailureCriticalEmail(props: BookingFailureCriticalEmailProps): { subject: string; html: string } {
  const subject = `🔴 Action Required: ${props.className} booking failed`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.error}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      🔴 Action Required
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      We couldn't book your class. This requires your attention to resolve.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.error};">
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

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fee2e2; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.error};">
      <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        What went wrong:
      </p>
      <div style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
        ${props.errorMessage}
      </div>
    </div>

    <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <strong>Need help?</strong> Email us at <a href="mailto:help@beerock.com" style="color: ${emailDesign.colors.primary}; text-decoration: none;">help@beerock.com</a> and we'll assist you.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Action Required: ${props.className} Booking Failed`,
    preheader: `We couldn't book ${props.className} on ${props.dayOfWeek} - action required`,
    body,
    severity: 'error',
    ctaText: 'Fix in Dashboard',
    ctaLink: props.dashboardUrl,
    showUnsubscribe: false, // Critical emails CANNOT be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
