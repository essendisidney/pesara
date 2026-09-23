import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import {
  ASSESSMENT_DISCLAIMER,
  COMMITTEE_DECISIONS,
  VIABILITY_CATALOG,
  assessmentSummary,
  catalogDimensions,
  scoreLabel,
  weightedMean,
} from "../src/lib/admin/viability";

describe("viability catalog", () => {
  it("covers twelve dimensions", () => {
    expect(VIABILITY_CATALOG).toHaveLength(12);
    expect(catalogDimensions()).toHaveLength(52);
    const keys = catalogDimensions().map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("names scores without turning them into a success chance", () => {
    expect(scoreLabel(1)).toBe("Weak");
    expect(scoreLabel(5)).toBe("Exceptional");
    expect(ASSESSMENT_DISCLAIMER).toContain("do not predict venture success");
    expect(ASSESSMENT_DISCLAIMER.toLowerCase()).not.toContain("chance");
  });

  it("keeps decline and leaves out reject", () => {
    expect(COMMITTEE_DECISIONS).toContain("DECLINE");
    expect(COMMITTEE_DECISIONS).not.toContain("REJECT");
  });
});

describe("weighted assessment", () => {
  it("weights a category and the overall mean", () => {
    expect(weightedMean([{ score: 5, weight: 1 }, { score: 1, weight: 3 }])).toBe(2);
    const summary = assessmentSummary([
      { category: "Problem", score: 4, weight: 1 },
      { category: "Problem", score: 2, weight: 1 },
      { category: "Evidence", score: 5, weight: 2 },
    ]);
    expect(summary.categories.find((item) => item.category === "Problem")?.mean).toBe(3);
    expect(summary.categories.find((item) => item.category === "Customer")?.mean).toBeNull();
    expect(summary.overall).toBe(4);
    expect(summary.scored).toBe(3);
    expect(summary.total).toBe(52);
  });
});

describe("sprint 3 activity", () => {
  it("records the decision name and leaves the rationale out of the summary", () => {
    expect(activitySummary("COMMITTEE_DECIDED", { decision: "BUILD", rationale: "secret" }, new Map())).toBe(
      "Committee recorded Build",
    );
    expect(activitySummary("ASSESSMENT_RECORDED", { version: "2", note: "secret" }, new Map())).toBe(
      "Opportunity assessment version 2 recorded",
    );
  });
});
