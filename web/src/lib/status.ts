export const STATUSES = [
  "draft",
  "submitted",
  "screening",
  "validation",
  "committee",
  "accepted",
  "building",
  "live",
  "scaling",
  "parked",
  "declined",
] as const;

export type Status = (typeof STATUSES)[number];

export const statusClass: Record<Status, string> = {
  draft: "text-[var(--status-draft)]",
  submitted: "text-[var(--status-submitted)]",
  screening: "text-[var(--status-screening)]",
  validation: "text-[var(--status-validation)]",
  committee: "text-[var(--status-committee)]",
  accepted: "text-[var(--status-accepted)]",
  building: "text-[var(--status-building)]",
  live: "text-[var(--status-live)]",
  scaling: "text-[var(--status-scaling)]",
  parked: "text-[var(--status-parked)]",
  declined: "text-[var(--status-declined)]",
};
