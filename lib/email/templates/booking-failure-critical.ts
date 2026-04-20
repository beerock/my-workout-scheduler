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
  // Escape all user-controlled fields defensively. className can be a custom
  // class name typed by the user; branchName comes from a fixed list but is
  // escaped for parity with other templates. Required per CLAUDE.md email
  // template XSS gotcha - the base template renders body/preheader as raw HTML.
  const safeClassName = escapeHtml(props.className);
  const safeDayOfWeek = escapeHtml(props.dayOfWeek);
  const safeDate = escapeHtml(props.date);
  const safeTime = escapeHtml(props.time);
  const safeBranchName = escapeHtml(props.branchName);

  // Classify so we can calibrate voice per VOICE.md tiers:
  // - credentials/login bad → "Need your help" tier
  // - class cancelled by gym → "FYI" tier (briefer, factual)
  // - anything else → "Need your help" tier (default)
  // Class-cancelled detection mirrors isClassCancelledError variants in
  // lib/booking-error-utils.ts — keep these in sync per CLAUDE.md.
  const errorLower = props.errorMessage.toLowerCase();
  const isCredentialsProblem = isCredentialsError(props.errorMessage);
  const isClassCancelled =
    errorLower.includes('class cancelled') ||
    errorLower.includes('class is cancelled') ||
    errorLower.includes('class has been cancelled') ||
    errorLower.includes('class has been canceled');

  // Subject + opening line differ by classification.
  // class-cancelled gets an FYI-tier opener (briefer, factual, no "Action Required").
  // Everything else gets the Need-your-help tier opener.
  const subject = isClassCancelled
    ? `Heads up — the gym cancelled ${safeClassName} on ${safeDayOfWeek}`
    : isCredentialsProblem
    ? `Your gym login isn't working — ${safeClassName}`
    : `${safeClassName} booking needs your help`;

  const ctaText = isCredentialsProblem ? 'Update credentials' : 'Go to dashboard';
  const ctaLink = isCredentialsProblem ? props.credentialsUrl : props.dashboardUrl;

  // Phone link setup — phone comes from YMCA_BRANCH_INFO constants (not user input)
  // but we still extract digits only for the tel: href for safety.
  const phoneDigits = props.branchPhone?.replace(/\D/g, '') ?? '';
  const telHref = phoneDigits ? `tel:+1${phoneDigits}` : null;
  const safePhoneDisplay = props.branchPhone ? escapeHtml(props.branchPhone) : '';
  const hasPhone = telHref !== null && safePhoneDisplay !== '';

  // Credentials guidance — shown only for login/password errors. Need-your-help
  // tier: concrete fix + fallback.
  const credentialsGuidanceSection = isCredentialsProblem
    ? `
    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #eff6ff; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.small}; font-weight: 600;">
        What to do
      </p>
      <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
        Open the <a href="${props.credentialsUrl}" style="color: ${emailDesign.colors.primary}; text-decoration: underline; font-weight: 600;">credentials page</a> and re-save your gym login. Booking resumes the next try.
      </p>
    </div>`
    : '';

  // Phone block — the routing layer only passes phone for class-cancelled
  // errors today, so copy speaks to that case. Kept flexible for future
  // routing-logic expansion.
  const callSection = hasPhone
    ? `
    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fef3c7; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        ${isClassCancelled ? 'Want to double-check?' : 'Prefer to call?'}
      </p>
      <p style="margin: 0 0 ${emailDesign.spacing.sm}; font-size: ${emailDesign.fontSize.body};">
        <a href="${telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${safePhoneDisplay}</a>
      </p>
      <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
        ${isClassCancelled
          ? 'The front desk can confirm the cancellation or point you at an alternative class time.'
          : 'Front desk can help reserve in person if you need to lock this in fast.'}
      </p>
    </div>`
    : '';

  // Header + opener differ by tier.
  const headerText = isClassCancelled
    ? 'Heads up — the gym cancelled this class.'
    : isCredentialsProblem
    ? 'Your gym login isn\'t working.'
    : 'Booking needs your help.';

  const openerText = isClassCancelled
    ? `The YMCA cancelled your class. No action needed unless you want to confirm or find an alternative.`
    : isCredentialsProblem
    ? `Couldn't sign into your YMCA account when it was time to book. Most common cause: gym password changed recently.`
    : `Couldn't finish booking your class. Quick action on your end unblocks the next try.`;

  const whatWentWrongHeader = isClassCancelled ? 'Details from the YMCA:' : 'What went wrong:';

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.error}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      ${headerText}
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      ${openerText}
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.error};">
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

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fee2e2; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.error};">
      <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        ${whatWentWrongHeader}
      </p>
      <div style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
        ${escapeHtml(props.errorMessage)}
      </div>
    </div>
    ${credentialsGuidanceSection}
    ${callSection}

    <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Stuck? Email <a href="mailto:help@beerock.com" style="color: ${emailDesign.colors.primary}; text-decoration: none;">help@beerock.com</a> and we'll take a look.
    </p>
  `;

  const title = isClassCancelled
    ? `Class cancelled — ${safeClassName}`
    : isCredentialsProblem
    ? `Gym login not working — ${safeClassName}`
    : `Booking needs your help — ${safeClassName}`;

  const preheader = isClassCancelled
    ? `The gym cancelled ${safeClassName} on ${safeDayOfWeek}. No action needed unless you want to confirm.`
    : isCredentialsProblem
    ? `Couldn't sign into your gym account. Re-save credentials to resume booking.`
    : `Couldn't finish booking ${safeClassName} on ${safeDayOfWeek}. Quick action unblocks the next try.`;

  const html = baseEmailTemplate({
    title,
    preheader,
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
