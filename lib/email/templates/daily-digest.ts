/**
 * Daily Digest Email Template
 *
 * Skeleton for post-MVP daily digest feature.
 * Batches all booking results from the past 24 hours into one summary email.
 *
 * NOTE: This is a SKELETON ONLY for MVP. Full implementation is post-MVP.
 */

import { baseEmailTemplate } from './_base-template';
import { emailDesign } from '../design-tokens';

export type DigestItem = {
  className: string;
  time: string;
  date: string;
  status: 'confirmed' | 'waitlisted' | 'failed';
  errorSummary?: string; // Short error message (if failed)
};

export type DailyDigestEmailProps = {
  items: DigestItem[];
  dashboardUrl: string;
  settingsUrl: string;
};

export function dailyDigestEmail(props: DailyDigestEmailProps): { subject: string; html: string } {
  const successCount = props.items.filter(i => i.status === 'confirmed').length;
  const waitlistCount = props.items.filter(i => i.status === 'waitlisted').length;
  const failureCount = props.items.filter(i => i.status === 'failed').length;

  const subject = `Yesterday's bookings — ${props.items.length} ${props.items.length === 1 ? 'class' : 'classes'}`;

  const itemsHtml = props.items.map(item => {
    const statusColor = {
      confirmed: emailDesign.colors.success,
      waitlisted: emailDesign.colors.warning,
      failed: emailDesign.colors.error,
    }[item.status];

    const statusIcon = {
      confirmed: '✅',
      waitlisted: '⏳',
      failed: '❌',
    }[item.status];

    const statusText = {
      confirmed: 'Booked',
      waitlisted: 'Waitlisted',
      failed: 'Needs attention',
    }[item.status];

    return `
      <tr>
        <td style="padding: ${emailDesign.spacing.md}; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0 0 ${emailDesign.spacing.xs}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; font-weight: 600;">
            ${statusIcon} ${item.className}
          </p>
          <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
            ${item.date} at ${item.time} - <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
          </p>
          ${item.errorSummary ? `
          <p style="margin: ${emailDesign.spacing.xs} 0 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.4;">
            ${item.errorSummary}
          </p>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');

  const body = `
    <h2 style="margin: 0 0 ${emailDesign.spacing.md}; color: ${emailDesign.colors.primary}; font-size: ${emailDesign.fontSize.h2}; font-weight: 600;">
      Here's what booked yesterday.
    </h2>

    <p style="margin: 0 0 ${emailDesign.spacing.lg}; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.body}; line-height: 1.6;">
      A quick rundown of everything that ran over the past 24 hours.
    </p>

    <div style="margin: 0 0 ${emailDesign.spacing.lg}; padding: ${emailDesign.spacing.md}; background-color: ${emailDesign.colors.backgroundAlt}; border-radius: ${emailDesign.borderRadius};">
      <p style="margin: 0; color: ${emailDesign.colors.neutral}; font-size: ${emailDesign.fontSize.small}; line-height: 1.6;">
        ✅ <strong>${successCount}</strong> booked
        &nbsp;·&nbsp;
        ⏳ <strong>${waitlistCount}</strong> waitlisted
        &nbsp;·&nbsp;
        ❌ <strong>${failureCount}</strong> need attention
      </p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0 0 ${emailDesign.spacing.lg}; background-color: ${emailDesign.colors.background}; border: 1px solid #e5e7eb; border-radius: ${emailDesign.borderRadius};">
      ${itemsHtml}
    </table>

    <p style="margin: 0; color: ${emailDesign.colors.neutralLight}; font-size: ${emailDesign.fontSize.small}; line-height: 1.5;">
      Full details on every attempt live on the dashboard.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Yesterday\'s bookings',
    preheader: `${successCount} booked · ${waitlistCount} waitlisted · ${failureCount} need attention.`,
    body,
    severity: 'info',
    ctaText: 'Open dashboard',
    ctaLink: props.dashboardUrl,
    showUnsubscribe: true, // Digest emails can be unsubscribed
    dashboardUrl: props.dashboardUrl,
    settingsUrl: props.settingsUrl,
  });

  return { subject, html };
}
