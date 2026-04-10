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
import { emailDesign, escapeHtml } from '../design-tokens';

export type BookingFailureFinalEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  bookingStartedTime: string; // When we started trying to book
  stoppedCheckingTime: string; // When we stopped checking (class started)
  retryCount: number; // How many times we checked for openings
  branchPhone?: string; // Optional - when provided, adds a "Call the YMCA" bullet and updates the tip copy
  dashboardUrl: string;
  scheduleUrl: string;
  settingsUrl: string;
};

export function bookingFailureFinalEmail(props: BookingFailureFinalEmailProps): { subject: string; html: string } {
  // Escape all user-controlled fields defensively. className can be a custom
  // class name typed by the user. Required per CLAUDE.md email template XSS
  // gotcha - the base template renders body/preheader as raw HTML.
  const safeClassName = escapeHtml(props.className);
  const safeDayOfWeek = escapeHtml(props.dayOfWeek);
  const safeDate = escapeHtml(props.date);
  const safeTime = escapeHtml(props.time);
  const safeBranchName = escapeHtml(props.branchName);
  const safeBookingStartedTime = escapeHtml(props.bookingStartedTime);
  const safeStoppedCheckingTime = escapeHtml(props.stoppedCheckingTime);

  const subject = `⏱️ Could Not Get You In - ${safeClassName} on ${safeDayOfWeek}`;

  // Phone link setup - phone comes from YMCA_BRANCH_INFO constants (not user input)
  // but we still extract digits only for the tel: href for safety.
  const phoneDigits = props.branchPhone?.replace(/\D/g, '') ?? '';
  const telHref = phoneDigits ? `tel:+1${phoneDigits}` : null;
  const safePhoneDisplay = props.branchPhone ? escapeHtml(props.branchPhone) : '';
  const hasPhone = telHref !== null && safePhoneDisplay !== '';

  // Optional 4th "Call the YMCA" bullet - only when phone is provided
  const callBullet = hasPhone
    ? `<li><strong>Call the YMCA:</strong> <a href="${telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${safePhoneDisplay}</a> - ask the front desk if anyone just cancelled, or whether you can walk in for this session</li>`
    : '';

  // Tip box copy varies based on whether we provided a phone number.
  // With phone: reference calling the front desk directly.
  // Without phone: fall back to the original "high demand / check the app" copy.
  const tipText = hasPhone
    ? `<strong>💡 Tip:</strong> Classes in high demand often have last-minute openings. Calling the front desk (or walking in) can work when the online system doesn't.`
    : `<strong>💡 Tip:</strong> This class is in high demand! People often cancel 24-48 hours before. You can also check your gym's app directly closer to class time.`;

  const retryText = props.retryCount > 1
    ? `The class was full. We checked for openings ${props.retryCount} times (every 15 minutes) but no spots became available.`
    : 'The class was full. We checked for openings but no spots became available.';

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
            ${safeClassName}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            📅 ${safeDayOfWeek}, ${safeDate}<br>
            🕐 ${safeTime}<br>
            📍 ${safeBranchName}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>Booking started:</strong> ${safeBookingStartedTime}
          </p>
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>What happened:</strong> ${retryText}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>Stopped checking:</strong> ${safeStoppedCheckingTime} (class started)
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
        ${callBullet}
      </ul>
    </div>

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #eff6ff; border-radius: ${emailDesign.borderRadius};">
      <p style="margin: 0; color: #1e40af; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
        ${tipText}
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    title: `Retries Exhausted: ${safeClassName}`,
    preheader: `We tried to book ${safeClassName} but it stayed full until class time`,
    body,
    severity: 'warning', // Yellow/amber tone - not critical, but informational
    ctaText: 'View My Schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true, // Users can opt out via emailOnRetry preference
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
