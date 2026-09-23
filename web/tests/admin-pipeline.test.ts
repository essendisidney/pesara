import { describe, expect, it } from "vitest";
import { emptyDraft } from "../src/lib/application";
import {
  COMMAND_METRICS,
  STAFF_STAGES,
  assessmentLabel,
  formatMean,
  matchesSearch,
  nairobiDayStart,
  nairobiNextDay,
  parsePipelineQuery,
  pipelineHref,
  sortPipelineRows,
  stageLabel,
  type PipelineRow,
} from "../src/lib/admin/pipeline";
import { activitySummary, applicationSections, evidenceLines } from "../src/lib/admin/present";

function row(patch: Partial<PipelineRow>): PipelineRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    reference: "PSR-2026-ABC123",
    idea: "Market stalls",
    founder: "Amina Yusuf",
    country: "Kenya",
    sector: "Trade",
    submittedAt: "2026-09-01T00:00:00.000Z",
    stage: "submitted",
    analyst: "Unassigned",
    assessmentMean: null,
    lastActivityAt: "2026-09-02T00:00:00.000Z",
    ...patch,
  };
}

describe("command centre metrics", () => {
  it("reads the eight operating counts from stages and live ventures", () => {
    expect(COMMAND_METRICS.map((metric) => metric.label)).toEqual([
      "New Applications",
      "Screening",
      "Founder Interviews",
      "Validation",
      "Committee Review",
      "Accepted",
      "Building",
      "Live Ventures",
    ]);
    expect(COMMAND_METRICS.find((metric) => metric.key === "structuring")?.stage).toBe("structuring");
    expect(COMMAND_METRICS.find((metric) => metric.key === "live_ventures")?.stage).toBeNull();
  });

  it("keeps draft off the staff stage list", () => {
    expect(STAFF_STAGES).not.toContain("draft");
    expect(stageLabel("structuring")).toBe("Venture structuring");
  });
});

describe("assessment labels", () => {
  it("says not assessed until scores exist", () => {
    expect(assessmentLabel([])).toBe("Not assessed");
    expect(formatMean(null)).toBe("Not assessed");
  });

  it("shows the mean of recorded scores", () => {
    expect(assessmentLabel([5, 3])).toBe("4.0 / 5");
    expect(formatMean(4)).toBe("4.0 / 5");
  });
});

describe("pipeline query", () => {
  it("drops unknown filters and keeps a valid search", () => {
    const query = parsePipelineQuery({
      stage: "accepted",
      analyst: "not-a-uuid",
      sort: "founder",
      dir: "asc",
      q: "  PSR-2026  ",
      from: "2026-09-23",
      to: "2026-02-31",
    });
    expect(query.stage).toBe("");
    expect(query.analyst).toBe("");
    expect(query.sort).toBe("founder");
    expect(query.dir).toBe("asc");
    expect(query.q).toBe("PSR-2026");
    expect(query.from).toBe("2026-09-23");
    expect(query.to).toBe("");
  });

  it("builds a shareable filter url", () => {
    const query = parsePipelineQuery({ stage: "screening", q: "Amina" });
    expect(pipelineHref(query)).toBe("/admin/applications?stage=screening&q=Amina");
  });

  it("uses Nairobi midnights for submitted dates", () => {
    expect(nairobiDayStart("2026-09-23")).toBe("2026-09-22T21:00:00.000Z");
    expect(nairobiNextDay("2026-09-23")).toBe("2026-09-23T21:00:00.000Z");
  });
});

describe("pipeline rows", () => {
  const rows = [
    row({ id: "11111111-1111-4111-8111-111111111111", idea: "Beta", submittedAt: "2026-09-02T00:00:00.000Z" }),
    row({
      id: "22222222-2222-4222-8222-222222222222",
      idea: "Alpha",
      founder: "Brian Otieno",
      reference: "",
      submittedAt: null,
      assessmentMean: 3,
    }),
  ];

  it("matches idea, founder, and reference", () => {
    expect(matchesSearch(rows[0], "beta")).toBe(true);
    expect(matchesSearch(rows[1], "psr")).toBe(false);
    expect(matchesSearch(rows[1], "brian")).toBe(true);
  });

  it("sorts submitted dates with empty dates last", () => {
    const sorted = sortPipelineRows(rows, "submitted", "desc");
    expect(sorted.map((item) => item.idea)).toEqual(["Beta", "Alpha"]);
    expect(sortPipelineRows(rows, "idea", "asc").map((item) => item.idea)).toEqual(["Alpha", "Beta"]);
  });
});

describe("application file", () => {
  it("shows the founder's answers and keeps scores out of that view", () => {
    const draft = emptyDraft();
    draft.ideaName = "Market stalls";
    draft.problem = "Stock disappears between markets.";
    draft.evidenceKinds = ["Spoken to potential customers"];
    const sections = applicationSections(draft);
    const problem = sections.find((section) => section.title === "The problem");
    expect(problem?.lines.find((item) => item.label === "Problem")?.value).toBe(
      "Stock disappears between markets.",
    );
    expect(JSON.stringify(sections)).not.toContain("Not assessed");
    expect(evidenceLines(draft)[0]?.value).toBe("Spoken to potential customers");
  });
});

describe("activity history", () => {
  it("describes assignment and stage changes without dumping raw metadata", () => {
    const names = new Map([["33333333-3333-4333-8333-333333333333", "Wanjiku Kariuki"]]);
    expect(
      activitySummary(
        "ANALYST_ASSIGNED",
        { from_analyst: null, to_analyst: "33333333-3333-4333-8333-333333333333" },
        names,
      ),
    ).toBe("Analyst set to Wanjiku Kariuki from Unassigned");
    expect(activitySummary("STAGE_CHANGED", { from_stage: "submitted", to_stage: "screening" }, names)).toBe(
      "Stage set to Initial screening from Submitted",
    );
    expect(activitySummary("NOTE_ADDED", { note_id: "secret-body" }, names)).toBe("Internal note added");
  });
});
