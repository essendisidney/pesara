import { describe, expect, it } from "vitest";
import { accountRequestKind, accountRequestLabel } from "../src/lib/account-requests";
import { activitySummary } from "../src/lib/admin/present";

describe("account requests", () => {
  it("accepts export and deletion and keeps the activity line free of the account", () => {
    expect(accountRequestKind("export")).toBe("export");
    expect(accountRequestKind("deletion")).toBe("deletion");
    expect(accountRequestKind("erase")).toBeNull();
    expect(accountRequestLabel("deletion")).toBe("Deletion");
    expect(
      activitySummary("ACCOUNT_REQUESTED", { kind: "deletion", email: "secret@example.com" }, new Map()),
    ).toBe("Deletion requested");
    expect(activitySummary("ACCOUNT_REQUEST_RECORDED", { request_id: "secret" }, new Map())).toBe(
      "Account request marked recorded",
    );
  });
});
