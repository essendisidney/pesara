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

export function canAccessOwnedRecord(
  actorId: string,
  ownerId: string,
  actorRole: string | null,
): boolean {
  if (isStaffRole(actorRole)) return true;
  return actorId === ownerId;
}
