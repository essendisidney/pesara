import { describe, expect, it } from "vitest";
import { emptyDraft } from "../src/lib/application";
import { diagnoseIdea, IDEA_CHECK_DISCLAIMER, parseShare, shareHidesAnswers, shareQuery } from "../src/lib/idea-check";
import { freshPrefill } from "../src/lib/idea-check-draft";
import { presentPipeline } from "../src/lib/public-pipeline";
import { introductionLine, isReferralCode, referralPath } from "../src/lib/referrals";

const thin = {
  problem: "Parking",
  who: "Drivers",
  today: "They wait",
  inadequate: "It is slow",
  payer: "Maybe fleets",
  evidence: "None",
  position: "I drive",
};

describe("idea check", () => {
  it("reads what was written and refuses a success prediction", () => {
    const reading = diagnoseIdea(thin);
    expect(reading.disclaimer).toBe(IDEA_CHECK_DISCLAIMER);
    expect(reading.disclaimer.toLowerCase()).not.toContain("chance");
    expect(JSON.stringify(reading).toLowerCase()).not.toContain("chance");
    expect(reading.categories.find((item) => item.key === "evidence")?.caption).toBe("Early");
    expect(reading.questions.length).toBeGreaterThanOrEqual(3);
    expect(reading.questions.length).toBeLessThanOrEqual(5);
    expect(reading.questions.some((question) => question.includes("seen, heard, or sold"))).toBe(true);
  });

  it("keeps the share card free of the written idea", () => {
    const answers = {
      ...thin,
      problem: "Evening traders in Gikomba lose stock when the rain starts without warning.",
      evidence: "I spoke with twelve stall holders last month and three already pay for storage.",
    };
    const reading = diagnoseIdea(answers);
    const query = shareQuery(reading.categories);
    expect(shareHidesAnswers(query, answers)).toBe(true);
    expect(parseShare({ p: "2", c: "1", e: "0", b: "1", d: "0", f: "3" })?.map((item) => item.level)).toEqual([
      2, 1, 0, 1, 0, 3,
    ]);
    expect(parseShare({ p: "2", c: "1", e: "9", b: "1", d: "0", f: "3" })).toBeNull();
    expect(parseShare({ p: "2", note: answers.problem })).toBeNull();
  });

  it("carries the answers into a new application draft", () => {
    const draft = freshPrefill({
      ...thin,
      problem: "Rain ruins produce before market day.",
    });
    expect(draft.problem).toBe("Rain ruins produce before market day.");
    expect(draft.submitted).toBe(false);
    expect(draft.applicationId).toBe(emptyDraft().applicationId);
  });
});

describe("public pipeline", () => {
  it("shows only positive counts for known metrics", () => {
    expect(
      presentPipeline([
        { metric: "ideas_submitted", total: 0 },
        { metric: "launched", total: "2" },
        { metric: "revenue", total: 9 },
        { metric: "under_review", total: 4 },
      ]),
    ).toEqual([
      { key: "launched", label: "Launched", value: "2" },
      { key: "under_review", label: "Under review", value: "4" },
    ]);
  });
});

describe("referrals", () => {
  it("counts introductions and rejects an application reference as a code", () => {
    expect(introductionLine(0)).toBeNull();
    expect(introductionLine(1)).toBe("You've introduced 1 person to Pesara.");
    expect(introductionLine(4)).toBe("You've introduced 4 people to Pesara.");
    expect(isReferralCode("PESARA-ABC123")).toBe(true);
    expect(isReferralCode("PSR-2026-ABC123")).toBe(false);
    expect(referralPath("pesara-abc123")).toBe("/r/PESARA-ABC123");
  });
});
