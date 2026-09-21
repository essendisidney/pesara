import { describe, expect, it } from "vitest";
import {
  emptyDraft,
  makeReference,
  makeReferralCode,
  mergeDraft,
} from "../src/lib/application";

describe("application references", () => {
  it("formats PSR-YYYY-XXXXXX", () => {
    const ref = makeReference(new Date("2026-09-21"), () => "abcdef12-zzzz");
    expect(ref).toBe("PSR-2026-ABCDEF");
  });
});

describe("draft merge", () => {
  it("fills missing fields from the empty draft", () => {
    const draft = mergeDraft({ ideaName: "Kiosk ledger", step: 2 });
    expect(draft.ideaName).toBe("Kiosk ledger");
    expect(draft.step).toBe(2);
    expect(draft.email).toBe("");
    expect(draft.submitted).toBe(false);
  });

  it("recovers from garbage", () => {
    expect(mergeDraft(null).step).toBe(1);
    expect(mergeDraft("nope").fullName).toBe("");
  });

  it("starts empty without a submission", () => {
    expect(emptyDraft().reference).toBeNull();
  });
});

describe("referral codes", () => {
  it("builds a stable code without promising money", () => {
    expect(makeReferralCode("Sidney", "X7K9")).toBe("PESARA-SIDNEY-X7K9");
  });
});
