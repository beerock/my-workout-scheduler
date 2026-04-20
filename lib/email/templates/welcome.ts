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
  const subject = `You're in — two quick steps to your first auto-booked class`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Welcome in.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      From here out, your recurring YMCA classes auto-book the instant registration opens — so you can focus on showing up, not setting 4:59 AM alarms.
    </p>

    <h3 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.h3}; font-weight: 600;">
      Two steps to get going
    </h3>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.small}; font-weight: 600;">
            Step 1
          </p>
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            Save your gym login
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            We need your YMCA login to reserve classes on your behalf. Credentials are encrypted end-to-end — nobody on our end ever sees the plain password.
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
            Add your first class
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            Day, time, branch, class type. The form shows you exactly when the first booking will fire before you save — no guessing.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius};">
      About two minutes start to finish. Your first class could book as early as tomorrow.
    </p>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Questions? Just reply to this email — real human reads every one.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Welcome in — get your first class on the schedule',
    preheader: "Two quick steps. First auto-booked class could land as early as tomorrow.",
    body,
    severity: 'info',
    ctaText: 'Get started',
    ctaLink: props.credentialsUrl,
    showUnsubscribe: false, // Welcome emails cannot be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
