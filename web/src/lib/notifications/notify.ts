import { stageLabel } from "@/lib/admin/pipeline";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import type { NotificationKind } from "@/lib/notifications";
import { notificationEmail } from "@/lib/notifications/email";
import { createServiceClient, serviceRoleConfigured } from "@/lib/supabase/service";

/**
 * Emails the founder who owns an application. Call only after the triggering
 * action succeeded and the caller was authorised. Never throws.
 */
export async function notifyFounder(
  applicationId: string,
  kind: NotificationKind,
  extra: { document?: string } = {},
): Promise<void> {
  if (!emailConfigured() || !serviceRoleConfigured()) return;
  try {
    const service = createServiceClient();
    const { data: application } = await service
      .from("idea_applications")
      .select("user_id, reference, stage")
      .eq("id", applicationId)
      .maybeSingle();
    if (!application?.user_id || !application.reference) return;
    const { data: user } = await service.auth.admin.getUserById(application.user_id);
    const to = user?.user?.email;
    if (!to) return;
    const path =
      kind === "document_requested" ? "/dashboard/documents" : `/dashboard/ideas/${applicationId}`;
    await sendEmail({
      to,
      ...notificationEmail(kind, {
        reference: application.reference,
        stage: stageLabel(application.stage),
        document: extra.document,
        path,
      }),
    });
  } catch (error) {
    console.error("[pesara:notify] failed", kind, error);
  }
}
