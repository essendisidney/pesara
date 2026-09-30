import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import { assignableRoles, canAccessOwnedRecord, isAdminRole, isCommitteeRole, isStaffRole } from "../src/lib/permissions/roles";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("application ownership", () => {
  it("does not let founder A read founder B", () => {
    expect(canAccessOwnedRecord("founder-a", "founder-b", "FOUNDER")).toBe(false);
  });

  it("lets a founder read their own application", () => {
    expect(canAccessOwnedRecord("founder-a", "founder-a", "FOUNDER")).toBe(true);
  });

  it("lets staff read any application", () => {
    expect(canAccessOwnedRecord("analyst-1", "founder-b", "ANALYST")).toBe(true);
    expect(isStaffRole("ADMIN")).toBe(true);
    expect(isStaffRole("FOUNDER")).toBe(false);
    expect(isCommitteeRole("ANALYST")).toBe(false);
    expect(isCommitteeRole("INVESTMENT_COMMITTEE")).toBe(true);
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("INVESTMENT_COMMITTEE")).toBe(false);
  });

  it("lets an admin name staff and keeps admin rights with a super admin", () => {
    expect(assignableRoles("ADMIN", "FOUNDER", false)).toEqual([
      "FOUNDER",
      "ANALYST",
      "PRODUCT",
      "ENGINEER",
      "INVESTMENT_COMMITTEE",
    ]);
    expect(assignableRoles("ADMIN", "ADMIN", false)).toEqual([]);
    expect(assignableRoles("ADMIN", "SUPER_ADMIN", false)).toEqual([]);
    expect(assignableRoles("SUPER_ADMIN", "FOUNDER", false)).toContain("ADMIN");
    expect(assignableRoles("SUPER_ADMIN", "ADMIN", true)).toEqual([]);
    expect(assignableRoles("ANALYST", "FOUNDER", false)).toEqual([]);
    expect(activitySummary("ROLE_ASSIGNED", { role: "ANALYST", email: "secret@example.com" }, new Map())).toBe(
      "Role set to Analyst",
    );
    const sql = readFileSync(path.join(root, "supabase/migrations/20260927230000_pesara_os_staff_role.sql"), "utf8");
    expect(sql).toContain("p_user = auth.uid()");
    expect(sql).toContain("'role'");
    expect(sql).not.toContain("user_metadata");
    expect(sql).not.toContain("email");
  });
});
