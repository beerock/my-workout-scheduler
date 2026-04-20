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
  const subject = `Couldn't find ${props.className} on the schedule`;
  const scheduleUrl = `${props.dashboardUrl}/schedule`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Couldn't find your class on the schedule.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      ${escapeHtml(props.errorMessage)} Usually a settings thing — class renamed, rescheduled, or moved branches — and easy to fix.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            ${escapeHtml(props.className)}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            📅 ${escapeHtml(props.date)}<br>
            🕐 ${escapeHtml(props.time)}<br>
            📍 ${escapeHtml(props.branchName)}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.small}; font-weight: 600;">
            What to do
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
            Open your <a href="${scheduleUrl}" style="color: ${emailDesign.colors.primary}; text-decoration: underline; font-weight: 600;">class settings</a> and check that the name, time, and branch match what's on the YMCA site. Update anything that drifted — booking picks up next week.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Stuck? Email <a href="mailto:help@beerock.com" style="color: ${emailDesign.colors.primary}; text-decoration: none;">help@beerock.com</a> and we'll take a look.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Couldn't find ${props.className}`,
    preheader: `${props.className} on ${props.dayOfWeek} didn't match the YMCA schedule. Quick settings check unblocks it.`,
    body,
    severity: 'warning',
    ctaText: 'Update class settings',
    ctaLink: `${props.dashboardUrl}/schedule`,
    showUnsubscribe: false, // Failure emails CANNOT be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
