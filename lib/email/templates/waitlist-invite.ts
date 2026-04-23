/**
 * Waitlist Invite Email Template
 *
 * Sent to a waitlist entry when the admin approves them in the
 * /admin/waitlist review UI. Replaces Supabase's plain
 * built-in "You have been invited" email so the first touchpoint
 * between a prospect and the product matches the rest of the brand.
 *
 * Voice: bridges showcase → coach per docs/VOICE.md. The reader opens
 * still a prospect (showcase scope line) and finishes essentially
 * activated (coach forward-motion). The "two minutes to first class"
 * beat mirrors the welcome email so the tone is continuous when they
 * land on the dashboard.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign, escapeHtml } from '../design-tokens';

export type WaitlistInviteEmailProps = {
  email: string;
  inviteUrl: string; // Magic link generated via supabase.auth.admin.generateLink
  siteUrl: string;   // Landing page URL (used for the base template branding footer fallback)
};

export function waitlistInviteEmail(
  props: WaitlistInviteEmailProps
): { subject: string; html: string } {
  const subject = `You're in — let's get your first class on the schedule`;

  const safeEmail = escapeHtml(props.email);

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Your invite to My Workout Scheduler is here.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Welcome in. You're part of the closed beta for the YMCA of Western North Carolina — the product auto-books your recurring classes the instant registration opens, so you can stop setting 4:59 AM alarms.
    </p>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      Click the button below to set up your account. From there it's about two minutes: add your gym login, add your first class, and we handle the rest every week.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.small}; font-weight: 600;">
            Heads up
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            This link is tied to ${safeEmail}. Opening it signs you in automatically and lets you set a password in your account settings whenever you're ready.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Thanks for your patience on the waitlist.<br>
      — My Workout Scheduler
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Your invite to My Workout Scheduler',
    preheader: 'Accept your invite and add your first class in under two minutes.',
    body,
    severity: 'info',
    ctaText: 'Accept your invite',
    ctaLink: props.inviteUrl,
    // Pre-user email: no dashboard/settings footer links yet, no unsubscribe
    // (they signed up for exactly this).
    dashboardUrl: props.siteUrl,
    settingsUrl: props.siteUrl,
    hideFooterLinks: true,
    showUnsubscribe: false,
  });

  return { subject, html };
}
