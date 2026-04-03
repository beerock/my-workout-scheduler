/**
 * Admin Custom Class Notification Email Template
 * Sent to admin(s) when a user submits a custom class name not in the master list.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign, escapeHtml } from '../design-tokens';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type AdminCustomClassEmailProps = {
  className: string;
  classId: string;
  branch: string;
  dayOfWeek: number;
  classTime: string;
  userEmail: string;
  userName?: string;
  userId: string;
  dashboardUrl: string;
  settingsUrl: string;
  editClassUrl: string;
  supabaseStudioUrl?: string;
};

export function adminCustomClassEmail(props: AdminCustomClassEmailProps): { subject: string; html: string } {
  const safeClassName = escapeHtml(props.className);
  const safeBranch = escapeHtml(props.branch);
  const safeUserEmail = escapeHtml(props.userEmail);
  const safeUserName = props.userName ? escapeHtml(props.userName) : null;
  const dayName = DAY_NAMES[props.dayOfWeek] || `Day ${props.dayOfWeek}`;

  const subject = `New custom class name: ${safeClassName}`;

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Custom Class Name Submitted
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      A user added a class name that is not in the official YMCA master list. You may want to verify this against the YMCA schedule and add it to the list if valid.
    </p>

    <!-- Class Details -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.primary};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.small}; font-weight: 600;">
            Class Details
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-top: ${emailDesign.spacing.sm};">
            <tr>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; width: 100px;">Class Name</td>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">${safeClassName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">Branch</td>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small};">${safeBranch}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">Schedule</td>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small};">${dayName} at ${escapeHtml(props.classTime)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">Class ID</td>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.tiny}; font-family: ${emailDesign.fonts.mono};">${escapeHtml(props.classId)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- User Details -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius}; border-left: 4px solid ${emailDesign.colors.warning};">
      <tr>
        <td style="padding: ${emailDesign.spacing.md};">
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.warning}; font-size: ${emailDesign.fontSize.small}; font-weight: 600;">
            Submitted By
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-top: ${emailDesign.spacing.sm};">
            ${safeUserName ? `
            <tr>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; width: 100px;">Name</td>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small};">${safeUserName}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; width: 100px;">Email</td>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small};">${safeUserEmail}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small};">User ID</td>
              <td style="padding: 4px 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.tiny}; font-family: ${emailDesign.fonts.mono};">${escapeHtml(props.userId)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${props.supabaseStudioUrl ? `
    <p style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      <a href="${props.supabaseStudioUrl}" style="color: ${emailDesign.colors.primary}; text-decoration: underline;">View in Supabase Studio</a> for full database details.
    </p>
    ` : ''}

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      To add this class to the official list, update <code style="font-family: ${emailDesign.fonts.mono}; font-size: ${emailDesign.fontSize.tiny}; background: ${emailDesign.colors.backgroundAlt}; padding: 2px 4px; border-radius: 3px;">lib/constants/ymca.ts</code>.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Custom Class Name Submitted',
    preheader: `A user added "${safeClassName}" - not in the official class list`,
    body,
    severity: 'info',
    ctaText: 'View Class',
    ctaLink: props.editClassUrl,
    showUnsubscribe: false,
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
