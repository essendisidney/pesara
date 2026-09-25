export const ACCOUNT_REQUEST_KINDS = ["export", "deletion"] as const;

export type AccountRequestKind = (typeof ACCOUNT_REQUEST_KINDS)[number];

export function accountRequestKind(value: string): AccountRequestKind | null {
  return (ACCOUNT_REQUEST_KINDS as readonly string[]).includes(value) ? (value as AccountRequestKind) : null;
}

export function accountRequestLabel(kind: string): string {
  if (kind === "export") return "Export";
  if (kind === "deletion") return "Deletion";
  return "Request";
}
