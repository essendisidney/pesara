export const NOTIFICATION_KINDS = [
  "application_received",
  "stage_changed",
  "interview_requested",
  "document_requested",
  "validation_started",
  "committee_decision",
  "venture_accepted",
  "new_message",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationAdapter = {
  inApp: (userId: string, kind: NotificationKind, body: string) => Promise<void>;
  email: (userId: string, kind: NotificationKind, body: string) => Promise<void>;
};

/** In-app and email first. SMS and WhatsApp adapters can implement this later. */
export const notificationChannels = ["in-app", "email"] as const;
