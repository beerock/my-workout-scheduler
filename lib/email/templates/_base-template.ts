/**
 * Base Email Template
 *
 * Master template that all email types extend. Provides consistent:
 * - Header with branding
 * - Footer with help link, dashboard link, settings link, optional unsubscribe
 * - Severity color-coding (border color indicates urgency)
 * - Mobile-responsive layout (table-based for email client compatibility)
 *
 * Usage:
 * All specific email templates (booking-success, booking-failure, etc.)
 * call this function with their specific content.
 */

import { emailDesign, type EmailSeverity } from '../design-tokens';

export type BaseEmailProps = {
  title: string;
  preheader?: string; // Hidden text shown in email preview
  body: string; // HTML content for email body
  severity: EmailSeverity; // Determines header border color
  ctaText?: string; // Call-to-action button text
  ctaLink?: string; // Call-to-action button URL
  showUnsubscribe?: boolean; // Only true for success emails
  dashboardUrl: string; // Link to user dashboard
  settingsUrl: string; // Link to notification settings page
};

export function baseEmailTemplate(props: BaseEmailProps): string {
  const severityColor = {
    success: emailDesign.colors.success,
    warning: emailDesign.colors.warning,
    error: emailDesign.colors.error,
    info: emailDesign.colors.primary,
  }[props.severity];

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${props.title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: ${emailDesign.fonts.body}; background-color: ${emailDesign.colors.backgroundAlt};">
        <!-- Preheader text (hidden in email, shown in preview) -->
        ${props.preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${props.preheader}</div>` : ''}

        <!-- Email wrapper -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${emailDesign.colors.backgroundAlt};">
          <tr>
            <td align="center" style="padding: ${emailDesign.spacing.lg} 0;">

              <!-- Email container -->
              <table role="presentation" width="${emailDesign.maxWidth}" cellspacing="0" cellpadding="0" border="0" style="max-width: ${emailDesign.maxWidth}; background-color: ${emailDesign.colors.background}; border-radius: ${emailDesign.borderRadius};">

                <!-- Header -->
                <tr>
                  <td style="padding: ${emailDesign.spacing.xl}; border-bottom: 3px solid ${severityColor};">
                    <h1 style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.h1}; font-weight: 600; line-height: 1.2;">
                      My Workout Scheduler
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: ${emailDesign.spacing.xl}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
                    ${props.body}
                  </td>
                </tr>

                <!-- CTA Button (if provided) -->
                ${props.ctaText && props.ctaLink ? `
                <tr>
                  <td style="padding: 0 ${emailDesign.spacing.xl} ${emailDesign.spacing.xl};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-radius: ${emailDesign.borderRadius}; background-color: ${severityColor};">
                          <a href="${props.ctaLink}" target="_blank" style="display: inline-block; padding: ${emailDesign.spacing.md} ${emailDesign.spacing.lg}; color: #ffffff; text-decoration: none; border-radius: ${emailDesign.borderRadius}; font-weight: 600; font-size: ${emailDesign.fontSize.body};">
                            ${props.ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}

                <!-- Footer -->
                <tr>
                  <td style="padding: ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0 0 ${emailDesign.spacing.sm}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
                      Need help? Email <a href="mailto:help@beerock.com" style="color: ${emailDesign.colors.primary}; text-decoration: none;">help@beerock.com</a>
                    </p>
                    <p style="margin: ${emailDesign.spacing.sm} 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
                      <a href="${props.dashboardUrl}" style="color: ${emailDesign.colors.primary}; text-decoration: none;">View Dashboard</a>
                      &nbsp;|&nbsp;
                      <a href="${props.settingsUrl}" style="color: ${emailDesign.colors.primary}; text-decoration: none;">Notification Settings</a>
                      ${props.showUnsubscribe ? `
                      &nbsp;|&nbsp;
                      <a href="${props.settingsUrl}?unsubscribe=success" style="color: ${emailDesign.colors.neutralLight}; text-decoration: none;">Unsubscribe</a>
                      ` : ''}
                    </p>
                    <p style="margin: ${emailDesign.spacing.sm} 0 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.tiny}; line-height: 1.4;">
                      🤖 Generated by My Workout Scheduler
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `.trim();
}
