import { describe, expect, it } from "vitest";
import { FIRST_ANSWER_WORKING_DAYS, PROMISES } from "../src/config/promises";
import { BUILD_SIZES, EXAMPLE, illustrate } from "../src/config/partnership";
import { addWorkingDays, answerClock, workingDaysBetween } from "../src/lib/answer-clock";
import { groupFingerprint, ideaFingerprint } from "../src/lib/fingerprint";

// Monday 5 October 2026, 10:00 Nairobi (07:00 UTC).
const monday = "2026-10-05T07:00:00.000Z";

describe("answer clock", () => {
  it("counts working days and skips weekends", () => {
    const due = addWorkingDays(new Date(monday), FIRST_ANSWER_WORKING_DAYS);
    // Ten working days after Monday 5 Oct is Monday 19 Oct.
    expect(due.toISOString().slice(0, 10)).toBe("2026-10-19");
    expect(workingDaysBetween(new Date(monday), due)).toBe(10);
    // Friday submission: due two weeks later on Friday.
    expect(addWorkingDays(new Date("2026-10-09T07:00:00.000Z"), 10).toISOString().slice(0, 10)).toBe("2026-10-23");
  });

  it("runs only while the founder is waiting for a first answer", () => {
    const early = new Date("2026-10-07T07:00:00.000Z");
    const clock = answerClock("screening", monday, early);
    expect(clock.state).toBe("due");
    if (clock.state === "due") expect(clock.workingDaysLeft).toBe(8);

    const late = answerClock("submitted", monday, new Date("2026-10-21T07:00:00.000Z"));
    expect(late.state).toBe("overdue");
    if (late.state === "overdue") expect(late.workingDaysLate).toBe(2);

    expect(answerClock("interview", monday, new Date("2026-12-01T07:00:00.000Z")).state).toBe("answered");
    expect(answerClock("declined", monday).state).toBe("answered");
    expect(answerClock("draft", null).state).toBe("none");
    expect(answerClock("withdrawn", monday).state).toBe("none");
  });

  it("states the promise with the configured number", () => {
    expect(PROMISES.find((item) => item.key === "answer")?.title).toContain(String(FIRST_ANSWER_WORKING_DAYS));
    expect(PROMISES).toHaveLength(4);
  });
});

describe("idea fingerprint", () => {
  const payload = {
    ideaName: "Chama Books",
    oneLiner: "Statements every member can read",
    problem: "Treasurers keep paper books",
    whoHasIt: "Chama treasurers",
    proposedSolution: "A shared ledger",
    moneyFlow: "Members pay weekly by M-Pesa",
  };

  it("is stable, and changes when a word changes", () => {
    const a = ideaFingerprint(payload, "PSR-2026-ABC123", monday);
    const b = ideaFingerprint({ ...payload }, "PSR-2026-ABC123", monday);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(ideaFingerprint({ ...payload, problem: "Treasurers keep paper book" }, "PSR-2026-ABC123", monday)).not.toBe(a);
    expect(ideaFingerprint(payload, "PSR-2026-ABC124", monday)).not.toBe(a);
    expect(groupFingerprint(a)).toMatch(/^[0-9a-f]{4} [0-9a-f]{4} [0-9a-f]{4} [0-9a-f]{4}$/);
  });

  it("ignores surrounding whitespace", () => {
    expect(ideaFingerprint({ ...payload, ideaName: "  Chama Books " }, "PSR-2026-ABC123", monday)).toBe(
      ideaFingerprint(payload, "PSR-2026-ABC123", monday),
    );
  });
});

describe("keep calculator", () => {
  it("never shows a broken number for zero revenue", () => {
    const x = illustrate({ ...EXAMPLE, monthlyRevenue: 0, buildCost: BUILD_SIZES[0].cost });
    expect(Number.isFinite(x.keepsEarlyPercent)).toBe(true);
    expect(x.monthsToCap).toBe(0);
  });

  it("repays a bigger build more slowly", () => {
    const small = illustrate({ ...EXAMPLE, monthlyRevenue: 1_000_000, buildCost: BUILD_SIZES[0].cost });
    const large = illustrate({ ...EXAMPLE, monthlyRevenue: 1_000_000, buildCost: BUILD_SIZES[2].cost });
    expect(large.monthsToCap).toBeGreaterThan(small.monthsToCap);
    expect(small.monthsToCap).toBe(47);
  });
});
