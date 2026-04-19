/**
 * Waitlist Confirmation Email Template
 *
 * Sent after a prospective user submits the waitlist form on the landing
 * page. This is the one email that bridges both voice registers:
 * - Opens in showcase voice (the sender is a product, not yet "your coach")
 * - Warms into coach voice on the closing beat
 *
 * See docs/VOICE.md for the register hand-off convention.
 *
 * Per VOICE.md: no CTA button (there's nothing to click yet), no unsubscribe
 * (they signed up for exactly this), no dashboard/settings footer links.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign, escapeHtml } from '../design-tokens';

export type WaitlistConfirmationEmailProps = {
  email: string;
  siteUrl: string; // Landing page URL, passed to the base template footer branding
};

export function waitlistConfirmationEmail(
  props: WaitlistConfirmationEmailProps
): { subject: string; html: string } {
  const subject = `You're on the waitlist`;

  // email is user-submitted — escape defensively for the preheader, where
  // the base template renders values as raw HTML.
  const safeEmail = escapeHtml(props.email);

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      You're on the waitlist
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Thanks for signing up. We'll reach out as soon as an invite opens up — nothing's expected of you in the meantime.
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      My Workout Scheduler is a small, invite-only beta for the Asheville YMCA — the product auto-books your recurring classes the moment registration opens, so you can stop setting 4:59 AM alarms.
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      When your invite lands, we'll get your first class on the schedule in under two minutes.
    </p>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      — My Workout Scheduler
    </p>
  `;

  const html = baseEmailTemplate({
    title: "You're on the waitlist",
    preheader: `We saved ${safeEmail} — we'll reach out when a spot opens up.`,
    body,
    severity: 'info',
    // No CTA button: there's nothing actionable yet.
    // dashboardUrl/settingsUrl are required by the shared base template but
    // hideFooterLinks strips the links from the rendered footer for this
    // pre-user email. Point them at the landing page for defense-in-depth
    // in case the flag is ever dropped by mistake.
    dashboardUrl: props.siteUrl,
    settingsUrl: props.siteUrl,
    hideFooterLinks: true,
    showUnsubscribe: false,
  });

  return { subject, html };
}
