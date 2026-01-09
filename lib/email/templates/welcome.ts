/**
 * Welcome Email Template
 * Sent after user signs up and verifies their email.
 * Guides them through the 2-step setup process.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type WelcomeEmailProps = {
  dashboardUrl: string;
  settingsUrl: string;
  credentialsUrl: string;
};

export function welcomeEmail(props: WelcomeEmailProps): { subject: string; html: string } {
  const subject = `🎉 Welcome! Two steps to automate your gym bookings`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      🎉 Welcome to My Workout Scheduler!
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      We'll automatically book your recurring classes the instant registration opens—so you can focus on showing up, not refreshing pages.
    </p>

    <h3 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.h3}; font-weight: 600;">
      Get Started in 2 Steps
    </h3>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.small}; font-weight: 600;">
            Step 1
          </p>
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            Add Your Gym Credentials
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            We need your gym login to book classes on your behalf. Your credentials are encrypted and never shared.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.small}; font-weight: 600;">
            Step 2
          </p>
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            Add Your First Class
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            Tell us which class you want (day, time, location) and we'll handle the rest—automatically, every week.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius};">
      💡 Takes about 2 minutes. Your first booking could happen as soon as tomorrow.
    </p>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Questions? Just reply to this email.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Welcome to My Workout Scheduler',
    preheader: "Let's get your first class scheduled automatically.",
    body,
    severity: 'info',
    ctaText: 'Get Started',
    ctaLink: props.credentialsUrl,
    showUnsubscribe: false, // Welcome emails cannot be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
