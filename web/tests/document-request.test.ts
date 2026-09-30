import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";

describe("document requests", () => {
  it("names the kind and leaves the note off the activity line", () => {
    expect(activitySummary("DOCUMENT_REQUESTED", { kind: "PITCH_DECK", note: "passport scan" }, new Map())).toBe(
      "Pitch deck requested",
    );
    expect(activitySummary("DOCUMENT_REQUESTED", {}, new Map())).toBe("Document requested");
  });
});
