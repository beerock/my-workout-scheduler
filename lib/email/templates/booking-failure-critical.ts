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
import { emailDesign, escapeHtml } from '../design-tokens';

export type BookingFailureCriticalEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  errorMessage: string; // User-friendly error from ERROR_MESSAGES.md
  // Optional phone - only rendered when provided. The routing layer in
  // get-email-template.ts only passes this for class-cancelled errors,
  // where calling the front desk to confirm is a useful action. For login
  // failures, credentials issues, and time conflicts, phone doesn't help
  // and is not passed.
  branchPhone?: string;
  dashboardUrl: string;
  credentialsUrl: string; // Link to credentials page for login-related errors
  settingsUrl: string;
};

/**
 * Check if error is credentials/login related
 */
function isCredentialsError(errorMessage: string): boolean {
  const message = errorMessage.toLowerCase();
  const credentialsKeywords = ['login', 'password', 'credentials', 'sign in', 'authentication'];
  return credentialsKeywords.some(keyword => message.includes(keyword));
}

export function bookingFailureCriticalEmail(props: BookingFailureCriticalEmailProps): { subject: string; html: string } {
  const subject = `🔴 Action Required: ${props.className} booking failed`;

  // Determine CTA and error type context
  const isCredentialsProblem = isCredentialsError(props.errorMessage);
  const ctaText = isCredentialsProblem ? 'Update Credentials' : 'Go to Dashboard';
  const ctaLink = isCredentialsProblem ? props.credentialsUrl : props.dashboardUrl;

  // Phone link setup - phone comes from YMCA_BRANCH_INFO constants (not user input)
  // but we still extract digits only for the tel: href for safety.
  const phoneDigits = props.branchPhone?.replace(/\D/g, '') ?? '';
  const telHref = phoneDigits ? `tel:+1${phoneDigits}` : null;
  const safePhoneDisplay = props.branchPhone ? escapeHtml(props.branchPhone) : '';
  const hasPhone = telHref !== null && safePhoneDisplay !== '';

  // "What to do next" section for credentials errors. This is shown for login
  // failures, password issues, and auth errors - tells the user explicitly
  // that they need to verify/update their credentials in our app. The CTA
  // button at the bottom is also routed to the credentials page in this case.
  const credentialsGuidanceSection = isCredentialsProblem
    ? `
    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #eff6ff; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        What to do next:
      </p>
      <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
        Your gym account credentials may be out of date. <strong>Open your <a href="${props.credentialsUrl}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">credentials page</a></strong> to confirm they're correct. If you recently changed your gym password, update it in our system so we can log in on your behalf.
      </p>
    </div>`
    : '';

  // Neutral copy - the routing layer enforces that phone is only passed for
  // class-cancelled errors, so we don't hardcode "cancelled" here. This keeps
  // the template flexible if the routing logic expands in the future.
  const callSection = hasPhone
    ? `
    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fef3c7; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        You can also call the YMCA directly:
      </p>
      <p style="margin: 0 0 ${emailDesign.spacing.sm}; font-size: ${emailDesign.fontSize.body};">
        <a href="${telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${safePhoneDisplay}</a>
      </p>
      <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
        Ask the front desk to confirm the cancellation or tell you about alternative class times.
      </p>
    </div>`
    : '';

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
        ${escapeHtml(props.errorMessage)}
      </div>
    </div>
    ${credentialsGuidanceSection}
    ${callSection}

    <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <strong>Need help?</strong> Email us at <a href="mailto:help@beerock.com" style="color: ${emailDesign.colors.primary}; text-decoration: none;">help@beerock.com</a> and we'll assist you.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Action Required: ${props.className} Booking Failed`,
    preheader: `We couldn't book ${props.className} on ${props.dayOfWeek} - action required`,
    body,
    severity: 'error',
    ctaText,
    ctaLink,
    showUnsubscribe: false, // Critical emails CANNOT be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
