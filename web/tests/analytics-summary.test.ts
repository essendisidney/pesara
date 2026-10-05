import { describe, expect, it } from "vitest";
import { ANALYTICS_EVENTS } from "../src/lib/analytics/events";
import { completionRate, EVENT_LABELS } from "../src/lib/analytics/summary";

describe("analytics summary", () => {
  it("labels every event", () => {
    for (const name of ANALYTICS_EVENTS) expect(EVENT_LABELS[name]).toBeTruthy();
  });

  it("computes the completion rate", () => {
    expect(completionRate(0, 0)).toBeNull();
    expect(completionRate(8, 2)).toBe(25);
    expect(completionRate(3, 5)).toBe(100);
  });
});
