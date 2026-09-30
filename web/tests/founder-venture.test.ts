import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { presentFounderVenture } from "../src/lib/founder/venture";

const migration = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations/20260927110000_pesara_os_founder_venture.sql"),
  "utf8",
);

describe("founder venture view", () => {
  it("keeps the public relationship and drops commercial fields", () => {
    const view = presentFounderVenture({
      name: "Kiosk ledger",
      description: "A till for market stalls.",
      stage: "Build",
      status: "BUILDING",
      relationship: "technology_by_pesara",
      website: "https://example.com",
      equity_interest: "20%",
      commercial_terms: "secret",
      technology_notes: "internal",
      milestones: [{ title: "First stall", due_on: "2026-10-01", completed_at: null }],
    });
    expect(view?.relationship).toBe("Technology by Pesara");
    expect(view?.status).toBe("Building");
    expect(view?.milestones[0]?.title).toBe("First stall");
    expect(JSON.stringify(view)).not.toContain("secret");
    expect(JSON.stringify(view)).not.toContain("20%");
    expect(migration).toContain("user_id = auth.uid()");
    for (const column of ["commercial_terms", "equity_interest", "revenue_share", "technology_notes", "venture_documents"]) {
      expect(migration, column).not.toContain(column);
    }
  });
});