/**
 * Booking No Registration Email Template
 *
 * Sent when a class doesn't offer online registration through GroupExPro.
 * This covers drop-in classes, special programs, paid programs, etc.
 * Informational tone -- not an error.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign, escapeHtml } from '../design-tokens';

export type BookingNoRegistrationEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  bookingTimestamp: string;
  branchPhone?: string; // Optional - when provided, renders phone as tel: link for the "how to register" action
  dashboardUrl: string;
  scheduleUrl: string;
  settingsUrl: string;
};

export function bookingNoRegistrationEmail(props: BookingNoRegistrationEmailProps): { subject: string; html: string } {
  const safeClassName = escapeHtml(props.className);
  const safeDayOfWeek = escapeHtml(props.dayOfWeek);
  const safeDate = escapeHtml(props.date);
  const safeTime = escapeHtml(props.time);
  const safeBranchName = escapeHtml(props.branchName);
  const safeTimestamp = escapeHtml(props.bookingTimestamp);

  // Build the phone-integrated "how to register" line.
  // Phone comes from YMCA_BRANCH_INFO constants (not user input) so it's safe
  // to interpolate. We still extract digits only for the tel: href to prevent
  // any injection via malformed constant data.
  const phoneDigits = props.branchPhone?.replace(/\D/g, '') ?? '';
  const telHref = phoneDigits ? `tel:+1${phoneDigits}` : null;
  const registerInstructionLine = telHref
    ? `Call your YMCA branch at <a href="${telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${escapeHtml(props.branchPhone || '')}</a> to find out how to register. If this class never requires online registration, you can remove it from your schedule to stop these notifications.`
    : `Check with your YMCA branch for details. If this class never requires online registration, you can remove it from your schedule to stop these notifications.`;

  const subject = `No Auto-Registration: ${safeClassName} on ${safeDayOfWeek}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      This class doesn't offer online registration
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      We checked the YMCA schedule and this class doesn't have an online booking option, so we couldn't auto-register you.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            ${safeClassName}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            📅 ${safeDate}<br>
            🕐 ${safeTime}<br>
            📍 ${safeBranchName}
          </p>
        </td>
      </tr>
    </table>

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius};">
      <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        This usually means:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.8;">
        <li>It's a drop-in class -- just show up!</li>
        <li>It requires in-person or phone registration</li>
        <li>It's a special program with separate enrollment</li>
      </ul>
    </div>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      ${registerInstructionLine}
    </p>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <em>Checked at ${safeTimestamp}</em>
    </p>
  `;

  const html = baseEmailTemplate({
    title: `No Auto-Registration: ${safeClassName}`,
    preheader: `${safeClassName} on ${safeDayOfWeek} doesn't offer online registration`,
    body,
    severity: 'info',
    ctaText: 'View My Schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true,
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
