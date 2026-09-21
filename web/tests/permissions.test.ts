import { describe, expect, it } from "vitest";
import { canAccessOwnedRecord, isStaffRole } from "../src/lib/permissions/roles";

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
  });
});
