import { site } from "@/config/site";
import type { NotificationKind } from "@/lib/notifications";

export type NotificationContext = {
  reference: string;
  /** Plain stage name for stage_changed, e.g. "Validation". */
  stage?: string;
  /** Document kind for document_requested. */
  document?: string;
  /** Absolute or site-relative link to the place the founder should look. */
  path: string;
};

function absolute(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.url.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Founder-facing email copy. Deliberately short and free of internal detail:
 * committee notes, scores and analyst names never appear in email.
 */
export function notificationEmail(
  kind: NotificationKind,
  context: NotificationContext,
): { subject: string; text: string } {
  const ref = context.reference;
  const link = absolute(context.path);
  const sign = `\n\nPesara Limited\n${site.tagline}`;
  switch (kind) {
    case "application_received":
      return {
        subject: `Pesara received ${ref}`,
        text: `Your idea is in. Its reference is ${ref}.\n\nA person at Pesara reads every submission. You can follow it here:\n${link}${sign}`,
      };
    case "stage_changed":
      return {
        subject: `${ref} moved to ${context.stage ?? "a new stage"}`,
        text: `${ref} is now at: ${context.stage ?? "a new stage"}.\n\nSee what this means and what happens next:\n${link}${sign}`,
      };
    case "interview_requested":
      return {
        subject: `Pesara would like to talk about ${ref}`,
        text: `Pesara would like a founder conversation about ${ref}.\n\nDetails are in your dashboard:\n${link}${sign}`,
      };
    case "document_requested":
      return {
        subject: `Pesara asked for a document on ${ref}`,
        text: `Pesara asked for ${context.document ? `a ${context.document}` : "a document"} for ${ref}.\n\nUpload it here:\n${link}${sign}`,
      };
    case "validation_started":
      return {
        subject: `Validation started on ${ref}`,
        text: `Pesara started validating ${ref}. We may ask you to help gather evidence.\n\n${link}${sign}`,
      };
    case "committee_decision":
      return {
        subject: `A written decision on ${ref} is ready`,
        text: `The Pesara committee recorded a decision on ${ref}. Read it in your dashboard:\n${link}${sign}`,
      };
    case "venture_accepted":
      return {
        subject: `${ref} is becoming a venture`,
        text: `Pesara opened a venture from ${ref}. Your venture workspace is ready:\n${link}${sign}`,
      };
    case "new_message":
      return {
        subject: `New message from Pesara about ${ref}`,
        text: `You have a new message about ${ref}:\n${link}${sign}`,
      };
  }
}
