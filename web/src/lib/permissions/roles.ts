export const ROLES = [
  "FOUNDER",
  "ANALYST",
  "PRODUCT",
  "ENGINEER",
  "INVESTMENT_COMMITTEE",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: readonly Role[] = [
  "ANALYST",
  "PRODUCT",
  "ENGINEER",
  "INVESTMENT_COMMITTEE",
  "ADMIN",
  "SUPER_ADMIN",
];

export function isStaffRole(role: string | null | undefined): boolean {
  return STAFF_ROLES.includes(role as Role);
}

export function isCommitteeRole(role: string | null | undefined): boolean {
  return role === "INVESTMENT_COMMITTEE" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canAccessOwnedRecord(
  actorId: string,
  ownerId: string,
  actorRole: string | null,
): boolean {
  if (isStaffRole(actorRole)) return true;
  return actorId === ownerId;
}
