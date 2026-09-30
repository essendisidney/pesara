export const NOTICE_COPY = {
  application_received: "Pesara has your idea.",
  stage_changed: "The stage of your idea changed.",
  interview_requested: "Pesara asked for a founder interview.",
  document_requested: "Pesara asked for a document.",
  validation_started: "Your idea is in validation.",
  committee_decision: "A decision is ready on your idea.",
  venture_accepted: "Your idea has a venture record.",
  new_message: "A new message is on your idea.",
} as const;

export type NoticeKind = keyof typeof NOTICE_COPY;

export function noticeCopy(kind: string): string | null {
  return kind in NOTICE_COPY ? NOTICE_COPY[kind as NoticeKind] : null;
}
