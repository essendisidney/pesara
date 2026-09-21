import { describe, expect, it } from "vitest";
import {
  emptyDraft,
  formatReference,
  greetingForNairobi,
  makeReference,
  makeReferralCode,
  mergeDraft,
  STEP_TITLES,
} from "../src/lib/application";
import { FOUNDER_TRACK, nextFounderAction, trackIndex } from "../src/lib/applications/stages";
import { canAccessOwnedRecord } from "../src/lib/permissions/roles";

describe("application references", () => {
  it("formats PSR-YYYY-XXXXXX", () => {
    const ref = makeReference(new Date("2026-09-21"), () => "abcdef12-zzzz");
    expect(ref).toBe("PSR-2026-ABCDEF");
    expect(formatReference(2026, "a1b2c3")).toBe("PSR-2026-A1B2C3");
  });
});

describe("draft merge", () => {
  it("fills missing fields from the empty draft", () => {
    const draft = mergeDraft({ ideaName: "Kiosk ledger", step: 2 });
    expect(draft.ideaName).toBe("Kiosk ledger");
    expect(draft.step).toBe(2);
    expect(draft.email).toBe("");
    expect(draft.submitted).toBe(false);
    expect(draft.evidenceKinds).toEqual([]);
  });

  it("recovers from garbage", () => {
    expect(mergeDraft(null).step).toBe(1);
    expect(mergeDraft("nope").fullName).toBe("");
  });

  it("starts empty without a submission", () => {
    expect(emptyDraft().reference).toBeNull();
    expect(emptyDraft().applicationId).toBeNull();
  });

  it("keeps the ten-step order with problem before idea", () => {
    expect(STEP_TITLES[1]).toBe("The problem");
    expect(STEP_TITLES[2]).toBe("The idea");
    expect(STEP_TITLES).toHaveLength(10);
  });
});

describe("referral codes", () => {
  it("builds a stable code without promising money", () => {
    expect(makeReferralCode("Sidney", "X7K9")).toBe("PESARA-SIDNEY-X7K9");
  });
});

describe("founder facing track", () => {
  it("does not treat drafts as submitted", () => {
    expect(trackIndex("draft")).toBe(-1);
    expect(nextFounderAction("submitted")).toContain("opportunity screen");
    expect(FOUNDER_TRACK[0].label).toBe("Submitted");
  });
});

describe("nairobi greeting", () => {
  it("uses evening after 17:00 Nairobi time", () => {
    expect(greetingForNairobi(new Date("2026-09-21T16:00:00Z"))).toBe("Good evening");
  });
});

describe("ownership", () => {
  it("does not let founder A open founder B", () => {
    expect(canAccessOwnedRecord("a", "b", "FOUNDER")).toBe(false);
  });
});
