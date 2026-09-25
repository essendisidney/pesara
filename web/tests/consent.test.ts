import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { marketingChoice } from "../src/lib/consent";
import { activitySummary } from "../src/lib/admin/present";

const migration = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations/20260924170000_pesara_os_consent.sql"),
  "utf8",
);

describe("marketing consent", () => {
  it("treats a missing box as no and rejects any other value", () => {
    expect(marketingChoice(null)).toBe(false);
    expect(marketingChoice("on")).toBe(true);
    expect(marketingChoice("yes")).toBeNull();
    expect(marketingChoice("")).toBeNull();
  });

  it("records the choice without the address", () => {
    expect(
      activitySummary("CONSENT_RECORDED", { choice: "granted", email: "secret@example.com" }, new Map()),
    ).toBe("Marketing consent granted");
    expect(activitySummary("CONSENT_RECORDED", { choice: "withdrawn" }, new Map())).toBe(
      "Marketing consent withdrawn",
    );
    expect(migration).toContain("where id = auth.uid()");
    expect(migration).toContain("'marketing'");
    expect(migration).not.toContain("new.body");
  });
});
