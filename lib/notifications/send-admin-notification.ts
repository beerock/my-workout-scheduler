/**
 * Admin Notification for Custom Class Names
 *
 * Sends a one-time email to admins when a user submits a custom class name
 * not in the official YMCA master list. Deduplicates on normalized class name
 * so admins only get one email per unique custom name.
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendEmailNotification } from '@/lib/email/send-notification';
import { adminCustomClassEmail } from '@/lib/email/templates/admin-custom-class';
import { normalizeClassName } from '@/lib/constants/ymca';
import { getAdminUserIds, getSiteUrl } from '@/lib/env-utils';

export type AdminCustomClassParams = {
  userId: string;
  className: string;
  classId: string;
  branch: string;
  dayOfWeek: number;
  classTime: string;
};

/**
 * Extract Supabase project ref from NEXT_PUBLIC_SUPABASE_URL
 * e.g. "https://abc123.supabase.co" -> "abc123"
 */
function getSupabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

/**
 * Notify admins about a new custom class name.
 * Deduplicates on normalized name - only sends once per unique custom name.
 */
export async function notifyAdminCustomClass(params: AdminCustomClassParams): Promise<void> {
  const { userId, className, classId, branch, dayOfWeek, classTime } = params;

  try {
    const supabase = createServiceRoleClient();
    const normalized = normalizeClassName(className);

    // 1. Check if this normalized name has already been notified
    const { data: existing } = await supabase
      .from('custom_class_names')
      .select('id')
      .eq('normalized_name', normalized)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[AdminNotify] Custom class "${className}" (normalized: "${normalized}") already notified, skipping`);
      return;
    }

    // 2. Get user details
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email || 'unknown';
    const userName = userData?.user?.user_metadata?.full_name || userData?.user?.user_metadata?.name || null;

    // 3. Insert into dedup table
    const { error: insertError } = await supabase
      .from('custom_class_names')
      .insert({
        normalized_name: normalized,
        display_name: className,
        submitted_by: userId,
        submitted_by_email: userEmail,
        submitted_by_name: userName,
        recurring_class_id: classId,
        branch,
        day_of_week: dayOfWeek,
        class_time: classTime,
      });

    if (insertError) {
      // Unique constraint violation = another request beat us, skip
      if (insertError.code === '23505') {
        console.log(`[AdminNotify] Race condition: "${className}" already inserted, skipping`);
        return;
      }
      console.error(`[AdminNotify] Failed to insert custom class name:`, insertError);
      return;
    }

    // 4. Get admin user IDs and resolve their emails
    const adminUserIds = getAdminUserIds();
    if (adminUserIds.length === 0) {
      console.log(`[AdminNotify] No ADMIN_USER_IDS configured, skipping email send`);
      return;
    }

    // 5. Build email URLs
    const siteUrl = getSiteUrl();
    const dashboardUrl = `${siteUrl}/dashboard`;
    const settingsUrl = `${siteUrl}/dashboard/account`;

    const projectRef = getSupabaseProjectRef();
    const RECURRING_CLASSES_TABLE_ID = '17486';
    const supabaseStudioUrl = projectRef
      ? `https://supabase.com/dashboard/project/${projectRef}/editor/${RECURRING_CLASSES_TABLE_ID}?schema=public&filter=id%3Aeq%3A${classId}`
      : undefined;

    // 6. Generate email
    const { subject, html } = adminCustomClassEmail({
      className,
      classId,
      branch,
      dayOfWeek,
      classTime,
      userEmail,
      userName: userName || undefined,
      userId,
      dashboardUrl,
      settingsUrl,
      supabaseStudioUrl,
    });

    // 7. Resolve admin emails from user IDs and send
    for (const adminId of adminUserIds) {
      const { data: adminData } = await supabase.auth.admin.getUserById(adminId);
      const adminEmail = adminData?.user?.email;

      if (!adminEmail) {
        console.error(`[AdminNotify] Could not resolve email for admin ${adminId}, skipping`);
        continue;
      }

      const result = await sendEmailNotification({
        to: adminEmail,
        subject,
        html,
        userId,
        notificationType: 'admin_custom_class',
      });

      if (result.success) {
        console.log(`[AdminNotify] Sent custom class notification to ${adminEmail} for "${className}"`);
      } else {
        console.error(`[AdminNotify] Failed to send to ${adminEmail}:`, result.error);
      }
    }
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.error(`[AdminNotify] Unexpected error:`, error);
  }
}
