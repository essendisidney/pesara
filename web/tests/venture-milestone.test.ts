import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import { ventureDocumentPath } from "../src/lib/documents";

const migration = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations/20260925130000_pesara_os_milestone.sql"),
  "utf8",
);

describe("venture kpi readings", () => {
  it("records a later reading without the number", () => {
    const sql = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations/20260927140000_pesara_os_kpi_snapshot.sql"),
      "utf8",
    );
    expect(activitySummary("KPI_SNAPSHOT", { value: "1000000" }, new Map())).toBe("KPI reading recorded");
    expect(sql).toContain("'metric_id'");
    expect(sql).not.toContain("'value'");
  });
});

describe("venture milestones", () => {
  it("records completion without the milestone title", () => {
    expect(activitySummary("MILESTONE_COMPLETED", { title: "Launch the kiosk" }, new Map())).toBe("Milestone completed");
    expect(migration).toContain("'milestone_id'");
    expect(migration).not.toContain("p_title");
  });

  it("stores a venture file under that venture and keeps the path out of the activity line", () => {
    const venture = "11111111-1111-4111-8111-111111111111";
    const token = "22222222-2222-4222-8222-222222222222";
    expect(ventureDocumentPath(venture, "agreement.pdf", token)).toBe(`${venture}/${token}-agreement.pdf`);
    expect(ventureDocumentPath(venture, "../secret.pdf", token)).toBe(`${venture}/${token}-secret.pdf`);
    expect(activitySummary("VENTURE_DOCUMENT", { path: "secret/path.pdf" }, new Map())).toBe("Venture document stored");
  });
});
