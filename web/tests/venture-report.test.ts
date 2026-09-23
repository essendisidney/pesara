import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import { buildOpportunityReport, reportFromFile } from "../src/lib/admin/report";
import { publicVentureCard } from "../src/lib/admin/venture";
import { formatReviewDate, latestFounderDecision, presentFounderDecision } from "../src/lib/founder/outcome";

describe("founder outcome", () => {
  it("shows the stored decision and leaves internal fields out", () => {
    const row = {
      decision: "DECLINE",
      founder_feedback: "We are not proceeding.",
      next_steps: "Keep the conversations you already have.",
      review_date: "2026-10-01",
      created_at: "2026-09-01T00:00:00Z",
      reason: "internal rationale",
      commercial_notes: "equity terms",
    };
    const shown = presentFounderDecision(row);
    expect(shown?.title).toBe("Decline");
    expect(shown?.feedback).toBe("We are not proceeding.");
    expect(shown?.nextSteps).toBe("Keep the conversations you already have.");
    expect(formatReviewDate(shown?.reviewDate ?? "")).toBe("01 Oct 2026");
    expect(JSON.stringify(shown)).not.toContain("equity");
    expect(JSON.stringify(shown)).not.toContain("internal rationale");
    expect(presentFounderDecision({})).toBeNull();
  });

  it("uses the latest recorded outcome", () => {
    const latest = latestFounderDecision([
      { decision: "PARK", founder_feedback: "Earlier", created_at: "2026-01-01T00:00:00Z" },
      { decision: "BUILD", founder_feedback: "Later", created_at: "2026-06-01T00:00:00Z" },
    ]);
    expect(latest?.decision).toBe("BUILD");
    expect(latest?.feedback).toBe("Later");
  });
});

describe("opportunity report", () => {
  it("keeps empty sections honest and lists only weak or limited scores as risks", () => {
    const report = buildOpportunityReport({
      idea: "Market stall",
      oneLiner: "A stall for evening trade.",
      founder: "Amina",
      country: "Kenya",
      sector: "Trade",
      reference: null,
      scores: [
        { category: "Problem", label: "Severity", score: 1, weight: 1, note: "Rare" },
        { category: "Market", label: "Market depth", score: 4, weight: 1, note: "Deep" },
      ],
      experiments: [],
      decision: null,
    });
    const text = JSON.stringify(report);
    expect(text.toLowerCase()).not.toContain("chance");
    expect(report.disclaimer).toBe("Scores support human commercial judgement and do not predict venture success.");
    expect(report.sections.find((section) => section.title === "Recommended MVP")?.body).toBe(
      "No MVP recommendation has been written.",
    );
    expect(report.sections.find((section) => section.title === "Customer")?.body).toBe("Not scored");
    expect(report.sections.find((section) => section.title === "Key risks")?.lines).toEqual([
      { label: "Problem · Severity", value: "1 / 5 · Weak — Rare" },
    ]);
    expect(report.sections.find((section) => section.title === "Pesara decision")?.body).toBe(
      "No committee decision has been recorded.",
    );
  });

  it("builds the staff report from the latest assessment", () => {
    const source = reportFromFile({
      idea: "Market stall",
      oneLiner: "",
      founder: "Amina",
      country: "Kenya",
      sector: "Trade",
      reference: "PSR-2026-000001",
      assessments: [
        { scores: [{ category: "Problem", label: "Severity", score: 2, weight: 1, note: null }] },
        { scores: [{ category: "Problem", label: "Severity", score: 5, weight: 1, note: "older" }] },
      ],
      experiments: [{ title: "Waitlist", lines: [{ label: "Outcome", value: "Inconclusive" }] }],
      decisions: [
        {
          code: "BUILD",
          shared: [
            { label: "Founder feedback", value: "The recorded note." },
            { label: "Next steps", value: "Start structuring." },
          ],
          internal: [
            { label: "Rationale", value: "secret rationale" },
            { label: "Commercial considerations", value: "secret terms" },
          ],
        },
      ],
    });
    expect(source.scores[0]?.score).toBe(2);
    const report = buildOpportunityReport(source);
    expect(report.sections.find((section) => section.title === "Pesara decision")?.body).toBe("Build");
    expect(report.sections.find((section) => section.title === "Commercial considerations")?.lines[0]?.value).toBe(
      "secret terms",
    );
    expect(report.sections.find((section) => section.title === "Key risks")?.lines).toHaveLength(1);
  });
});

describe("venture boundary", () => {
  it("keeps a public card to name, relationship, and website", () => {
    expect(publicVentureCard({ name: "Athi Gardens", website: "https://athigardens.com", relationship: "none" })).toEqual({
      name: "Athi Gardens",
      relationship: "Not set",
      website: "https://athigardens.com",
    });
    expect(
      activitySummary(
        "VENTURE_CREATED",
        { venture_id: "secret-id", commercial_terms: "equity terms" },
        new Map(),
      ),
    ).toBe("Venture created");
  });
});
