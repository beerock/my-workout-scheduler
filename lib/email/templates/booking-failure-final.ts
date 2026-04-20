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

  const subject = `Couldn't get you into ${safeClassName} on ${safeDayOfWeek}`;

  // Phone link setup - phone comes from YMCA_BRANCH_INFO constants (not user input)
  // but we still extract digits only for the tel: href for safety.
  const phoneDigits = props.branchPhone?.replace(/\D/g, '') ?? '';
  const telHref = phoneDigits ? `tel:+1${phoneDigits}` : null;
  const safePhoneDisplay = props.branchPhone ? escapeHtml(props.branchPhone) : '';
  const hasPhone = telHref !== null && safePhoneDisplay !== '';

  // Optional 4th "Call the branch" bullet - only when phone is provided
  const callBullet = hasPhone
    ? `<li><strong>Call the branch:</strong> <a href="${telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${safePhoneDisplay}</a> — ask the front desk if anyone just dropped or whether you can walk in for this session</li>`
    : '';

  // Tip box copy varies based on whether we provided a phone number.
  const tipText = hasPhone
    ? `<strong>One more thing:</strong> Popular classes often open up last-minute. Calling the front desk or walking in can work when the online system doesn't.`
    : `<strong>One more thing:</strong> Popular classes often open up last-minute. Worth checking the YMCA app directly closer to class time.`;

  const retryText = props.retryCount > 1
    ? `Checked ${props.retryCount} times every 15 minutes. No seats opened up before class started.`
    : 'Checked for an opening, but no seats opened up before class started.';

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Couldn't get you in this time.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Watched for an opening right up until class started. Every seat stayed filled. Sometimes the timing just doesn't break your way.
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
            <strong>Watching started:</strong> ${safeBookingStartedTime}
          </p>
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>What we did:</strong> ${retryText}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">
            <strong>Stopped watching:</strong> ${safeStoppedCheckingTime} (class started)
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
          <ul style="margin: 0; padding-left: 20px; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.7;">
            <li><strong>Next week:</strong> Same class, same time — we run it back automatically.</li>
            <li><strong>Want a backup?</strong> Add a different class or time so future weeks have a fallback.</li>
            <li><strong>More chances:</strong> Try another day or branch where it's less packed.</li>
            ${callBullet}
          </ul>
        </td>
      </tr>
    </table>

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #eff6ff; border-radius: ${emailDesign.borderRadius};">
      <p style="margin: 0; color: #1e40af; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
        ${tipText}
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    title: `Couldn't get you in — ${safeClassName}`,
    preheader: `Watched right up to class time. ${safeClassName} stayed full.`,
    body,
    severity: 'warning', // Yellow/amber tone - not critical, but informational
    ctaText: 'View schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: true, // Users can opt out via emailOnRetry preference
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
