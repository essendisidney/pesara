import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import { publishedPortfolioCards } from "../src/lib/admin/venture";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("public portfolio publication", () => {
  it("adds a named venture and leaves the existing cards and commercial terms off the public card", () => {
    const cards = publishedPortfolioCards([
      {
        name: "Marit",
        description: "A duplicate of a card already on the page.",
        country: "Nairobi",
        website: "https://maritevents.com",
        pesara_relationship: "technology_by_pesara",
        commercial_terms: "secret equity",
      },
      {
        name: "North Line",
        description: "A route for produce leaving the farm.",
        country: "Kenya",
        website: "https://northline.example",
        pesara_relationship: "technology_by_pesara",
        equity_interest: "20 percent",
        revenue_share: "half",
        technology_notes: "private stack",
      },
      {
        name: "Unnamed work",
        description: "No relationship has been named.",
        website: "https://unnamed.example",
        pesara_relationship: "none",
      },
    ]);
    expect(cards).toEqual([
      {
        name: "North Line",
        place: "Kenya",
        relationship: "Technology by Pesara",
        body: "A route for produce leaving the farm.",
        domain: "northline.example",
        href: "https://northline.example/",
      },
    ]);
    expect(JSON.stringify(cards)).not.toContain("equity");
    expect(JSON.stringify(cards)).not.toContain("revenue");
    expect(JSON.stringify(cards)).not.toContain("private stack");
    expect(activitySummary("VENTURE_PUBLISHED", { venture_id: "id", commercial_terms: "secret" }, new Map())).toBe(
      "Venture shown on the public portfolio",
    );
    expect(activitySummary("VENTURE_UNPUBLISHED", { equity_interest: "20" }, new Map())).toBe(
      "Venture removed from the public portfolio",
    );
    const sql = readFileSync(path.join(root, "supabase/migrations/20260927220000_pesara_os_venture_publication.sql"), "utf8");
    expect(sql).toContain("function public.set_venture_publication");
    expect(sql).toContain("'technology_by_pesara'");
    expect(sql).toContain("'venture_id'");
    expect(sql).not.toContain("commercial_terms");
    expect(sql).not.toContain("equity_interest");
    expect(sql).not.toContain("revenue_share");
  });
});
