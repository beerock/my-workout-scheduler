/**
 * Booking Failure - Technical Issue Email Template
 *
 * Has two variants controlled by the `variant` prop:
 *
 * - `generic` (default): Unexpected automation-side errors, unclear booking
 *   results, navigation failures, missing buttons. Warning tone, shows the
 *   raw errorMessage in a "What went wrong" box.
 *
 * - `ymca_system_error`: Sent when YMCA's GroupExPro reservation system
 *   returns "Unable to reserve a spot" - a known YMCA backend issue that
 *   typically requires a human at the front desk to notice and fix. Points
 *   the finger at YMCA (not our app), suppresses the raw errorMessage, and
 *   puts "call the YMCA" as the hero action with a tappable phone link.
 *
 * Both variants accept an optional `branchPhone` prop:
 * - In `ymca_system_error`: phone is the HERO action
 * - In `generic`: phone appears as a secondary "if it's urgent" sub-line
 *   in the "What happens next" footer
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign, escapeHtml } from '../design-tokens';

export type BookingFailureTechnicalEmailProps = {
  className: string;
  dayOfWeek: string;
  date: string;
  time: string;
  branchName: string;
  errorMessage: string; // User-friendly error from ERROR_MESSAGES.md
  variant?: 'generic' | 'ymca_system_error'; // Default: 'generic'
  branchPhone?: string; // Display format e.g. "(828) 555-1234"
  dashboardUrl: string;
  scheduleUrl: string; // Link to schedule page (CTA destination)
  settingsUrl: string;
};

export function bookingFailureTechnicalEmail(props: BookingFailureTechnicalEmailProps): { subject: string; html: string } {
  const variant = props.variant ?? 'generic';

  const safeClassName = escapeHtml(props.className);
  const safeDayOfWeek = escapeHtml(props.dayOfWeek);

  // Phone link setup - phone comes from YMCA_BRANCH_INFO constants (not user input)
  // but we still extract digits only for the tel: href to prevent any injection
  // via malformed constant data.
  const phoneDigits = props.branchPhone?.replace(/\D/g, '') ?? '';
  const telHref = phoneDigits ? `tel:+1${phoneDigits}` : null;
  const safePhoneDisplay = props.branchPhone ? escapeHtml(props.branchPhone) : '';
  const hasPhone = telHref !== null && safePhoneDisplay !== '';

  if (variant === 'ymca_system_error') {
    return renderYmcaSystemErrorVariant(props, {
      safeClassName,
      safeDayOfWeek,
      telHref,
      safePhoneDisplay,
      hasPhone,
    });
  }

  return renderGenericVariant(props, {
    safeClassName,
    safeDayOfWeek,
    telHref,
    safePhoneDisplay,
    hasPhone,
  });
}

type RenderContext = {
  safeClassName: string;
  safeDayOfWeek: string;
  telHref: string | null;
  safePhoneDisplay: string;
  hasPhone: boolean;
};

/**
 * Generic variant: existing "Technical Issue" layout with an optional
 * phone sub-line in the footer for users who need to book urgently.
 */
function renderGenericVariant(
  props: BookingFailureTechnicalEmailProps,
  ctx: RenderContext
): { subject: string; html: string } {
  const subject = `⚠️ Technical Issue: ${props.className} booking failed`;

  const phoneSubLine = ctx.hasPhone
    ? `<br><br>If it's urgent, you can also call <a href="${ctx.telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${ctx.safePhoneDisplay}</a> to book this class directly through the YMCA.`
    : '';

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      ⚠️ Technical Issue
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      We encountered a technical issue while trying to book your class. This may be temporary.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            ${ctx.safeClassName}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            📅 ${escapeHtml(props.date)}<br>
            🕐 ${escapeHtml(props.time)}<br>
            📍 ${escapeHtml(props.branchName)}
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

    <p style="margin: 0 0 ${emailDesign.spacing.md}; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      💡 <strong>What happens next:</strong> If this issue is temporary, the system will try again at the next scheduled time. If it happens repeatedly, please report it so we can investigate.${phoneSubLine}
    </p>

    <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <strong>Need help?</strong> Email us at <a href="mailto:help@beerock.com" style="color: ${emailDesign.colors.primary}; text-decoration: none;">help@beerock.com</a> with the error details above.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Technical Issue: ${props.className}`,
    preheader: `We encountered a technical issue booking ${props.className} on ${props.dayOfWeek}`,
    body,
    severity: 'warning',
    ctaText: 'View My Schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: false, // Failure emails CANNOT be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}

/**
 * YMCA system error variant: confident travel-agent tone, points the finger
 * at YMCA, hero action is "call the front desk". No raw errorMessage shown
 * since the action copy IS the explanation.
 */
function renderYmcaSystemErrorVariant(
  props: BookingFailureTechnicalEmailProps,
  ctx: RenderContext
): { subject: string; html: string } {
  const subject = `YMCA is having trouble booking ${props.className}`;

  // Primary "call the YMCA" bullet - includes phone as tappable tel: link when available
  const callBullet = ctx.hasPhone
    ? `<strong>Call the YMCA</strong> - <a href="${ctx.telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${ctx.safePhoneDisplay}</a> - let the front desk know their booking system won't let you reserve ${ctx.safeClassName} on ${ctx.safeDayOfWeek}, and confirm whether the class is still happening`
    : `<strong>Call the YMCA</strong> - let the front desk know their booking system won't let you reserve ${ctx.safeClassName} on ${ctx.safeDayOfWeek}, and confirm whether the class is still happening`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Heads up - YMCA's booking system is acting up
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      We tried to reserve your spot, but YMCA's booking system isn't processing reservations for this class right now. This looks like something on their end.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            ${ctx.safeClassName}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            📅 ${escapeHtml(props.date)}<br>
            🕐 ${escapeHtml(props.time)}<br>
            📍 ${escapeHtml(props.branchName)}
          </p>
        </td>
      </tr>
    </table>

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: #fef3c7; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
        What you can do:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.8;">
        <li style="margin-bottom: ${emailDesign.spacing.sm};">${callBullet}</li>
        <li><strong>Book it directly</strong> - once they've sorted it out, grab your spot through the YMCA website or app</li>
      </ul>
    </div>

    <p style="margin: 0; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Your future classes are still on autopilot - no changes needed.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `YMCA Booking Issue: ${props.className}`,
    preheader: `Call the front desk - they probably don't know yet`,
    body,
    severity: 'warning',
    ctaText: 'View My Schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: false, // Failure emails CANNOT be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
