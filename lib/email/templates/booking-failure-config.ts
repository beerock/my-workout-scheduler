/**
 * Booking Failure - Configuration Issue Email Template
 *
 * Sent for configuration-related failures:
 * - Class not found
 * - Class disappeared after reload
 * - Branch selection failed
 *
 * User should verify and update their class settings.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign, escapeHtml } from '../design-tokens';

export type BookingFailureConfigEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  errorMessage: string; // User-friendly error from ERROR_MESSAGES.md
  dashboardUrl: string;
  settingsUrl: string;
};

export function bookingFailureConfigEmail(props: BookingFailureConfigEmailProps): { subject: string; html: string } {
  const subject = `⚠️ Configuration Issue: ${props.className} booking failed`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      ⚠️ Configuration Issue
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      We couldn't find or book your class. This might be a simple settings issue that you can fix.
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

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fef3c7; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        What went wrong:
      </p>
      <div style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
        ${escapeHtml(props.errorMessage)}
      </div>
    </div>

    <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <strong>Need help?</strong> Email us at <a href="mailto:help@beerock.com" style="color: ${emailDesign.colors.primary}; text-decoration: none;">help@beerock.com</a> and we'll assist you.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Configuration Issue: ${props.className}`,
    preheader: `We couldn't book ${props.className} on ${props.dayOfWeek} - please check your settings`,
    body,
    severity: 'warning',
    ctaText: 'Update Class Settings',
    ctaLink: `${props.dashboardUrl}/schedule`,
    showUnsubscribe: false, // Failure emails CANNOT be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
