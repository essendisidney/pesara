import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import { teamMember } from "../src/lib/team";

const migration = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations/20260925120000_pesara_os_team.sql"),
  "utf8",
);

describe("team members", () => {
  it("keeps a name and drops a blank one, without putting the name in the activity line", () => {
    expect(teamMember("Amina Otieno", "Operator")?.role).toBe("Operator");
    expect(teamMember("  ", "Operator")).toBeNull();
    expect(teamMember("Amina", "x".repeat(81))).toBeNull();
    expect(activitySummary("TEAM_MEMBER_ADDED", { member_id: "id", full_name: "Amina Otieno" }, new Map())).toBe(
      "Team member added",
    );
    expect(activitySummary("TEAM_MEMBER_REMOVED", { full_name: "Amina Otieno" }, new Map())).toBe("Team member removed");
    expect(migration).toContain("user_id = auth.uid()");
    expect(migration).toContain("'member_id'");
    expect(migration).not.toContain("'full_name'");
  });
});
