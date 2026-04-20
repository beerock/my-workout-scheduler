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
  const subject = `Hit a snag booking ${props.className} — running it back`;

  const phoneSubLine = ctx.hasPhone
    ? `<br><br>If you want to lock it in by hand, you can also call <a href="${ctx.telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${ctx.safePhoneDisplay}</a> and book through the YMCA directly.`
    : '';

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Hit a snag — running it back.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Something hiccupped on the way to booking your class. Usually this clears itself by the next try.
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
        What happened:
      </p>
      <div style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
        ${escapeHtml(props.errorMessage)}
      </div>
    </div>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <strong>What happens next:</strong> Retrying at the next scheduled check. A confirmation email fires if the next try lands; another note like this one fires if it doesn't.${phoneSubLine}
    </p>

    <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <strong>Seeing this repeatedly?</strong> Email <a href="mailto:help@beerock.com" style="color: ${emailDesign.colors.primary}; text-decoration: none;">help@beerock.com</a> with the error details above and we'll chase it down.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Hit a snag — ${props.className}`,
    preheader: `Something hiccupped while booking ${props.className} on ${props.dayOfWeek}. Retrying.`,
    body,
    severity: 'warning',
    ctaText: 'View schedule',
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
  const subject = `YMCA's booking system is stuck — ${props.className}`;

  // Primary "call the YMCA" bullet - includes phone as tappable tel: link when available
  const callBullet = ctx.hasPhone
    ? `<strong>Call the branch</strong> — <a href="${ctx.telHref}" style="color: ${emailDesign.colors.primary}; text-decoration: none; font-weight: 600;">${ctx.safePhoneDisplay}</a> — let the front desk know their booking system won't reserve ${ctx.safeClassName} on ${ctx.safeDayOfWeek}, and ask whether the class is still on.`
    : `<strong>Call the branch</strong> — let the front desk know their booking system won't reserve ${ctx.safeClassName} on ${ctx.safeDayOfWeek}, and ask whether the class is still on.`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      YMCA's booking system is stuck — your call.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Tried to grab your spot. YMCA's booking system isn't processing reservations for this class right now — it's on their end, not ours. A human at the front desk usually fixes this once they know.
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
        What to do:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.8;">
        <li style="margin-bottom: ${emailDesign.spacing.sm};">${callBullet}</li>
        <li><strong>Book it directly</strong> — once the front desk sorts it out, grab your spot through the YMCA website or app.</li>
      </ul>
    </div>

    <p style="margin: 0; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Your other classes stay on autopilot — no changes needed.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `YMCA system error — ${props.className}`,
    preheader: `YMCA's booking system won't let us reserve this class. Call the front desk.`,
    body,
    severity: 'warning',
    ctaText: 'View schedule',
    ctaLink: props.scheduleUrl,
    showUnsubscribe: false, // Failure emails CANNOT be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
