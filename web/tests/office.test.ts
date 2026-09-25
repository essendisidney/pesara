import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import { acquisitionSource, articleSlug, completedStageDays, groupedCounts, medianDays, orderedCounts, reachedStage } from "../src/lib/admin/office";

describe("office timing", () => {
  it("times a completed stage and leaves an open stage out", () => {
    const events = [
      { applicationId: "a", toStage: "screening", at: "2026-09-01T00:00:00Z" },
      { applicationId: "a", toStage: "interview", at: "2026-09-04T00:00:00Z" },
      { applicationId: "b", toStage: "validation", at: "2026-09-02T00:00:00Z" },
    ];
    expect(completedStageDays(events, "screening")).toEqual([3]);
    expect(completedStageDays(events, "validation")).toEqual([]);
    expect(medianDays([1, 9])).toBe(5);
    expect(medianDays([])).toBeNull();
    expect(reachedStage(events, [{ id: "b", stage: "validation" }], "validation")).toBe(1);
  });

  it("groups a funnel without inventing an empty country", () => {
    expect(orderedCounts(["screening", "screening", "live"], ["submitted", "screening", "live"])).toEqual([
      { key: "submitted", count: 0 },
      { key: "screening", count: 2 },
      { key: "live", count: 1 },
    ]);
    expect(groupedCounts(["Kenya", "", "Kenya"])).toEqual([
      { key: "Kenya", count: 2 },
      { key: "Not recorded", count: 1 },
    ]);
    expect(acquisitionSource(true)).toBe("Introduction");
    expect(acquisitionSource(false)).toBe("Direct");
  });

  it("keeps article slugs inside a single path segment", () => {
    expect(articleSlug("Hello, Nairobi")).toBe("hello-nairobi");
    expect(articleSlug("../secret")).toBe("secret");
    expect(articleSlug("ab")).toBeNull();
  });

  it("does not put note, meeting, or article text into the activity line", () => {
    const names = new Map<string, string>();
    expect(activitySummary("FOUNDER_NOTE", { note_id: "1", body: "private" }, names)).toBe("Internal founder note added");
    expect(activitySummary("MEETING_RECORDED", { meeting_id: "1", summary: "private" }, names)).toBe("Meeting recorded");
    expect(activitySummary("ARTICLE_SAVED", { article_id: "1", body: "private" }, names)).toBe("Article saved");
  });
});
