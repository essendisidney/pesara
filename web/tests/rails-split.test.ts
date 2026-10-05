import { describe, expect, it } from "vitest";
import {
  formatBps,
  formatMinor,
  recoveryCap,
  recoveryDelta,
  replay,
  reverseLines,
  splitRevenue,
  sumLines,
  type RailsAgreementTerms,
} from "../src/lib/rails/split";

// The database applies the same algorithm in private.rails_split and
// public.rails_record_event (supabase/migrations/20261005120000_pesara_rails_v0.sql).
// The "matches the database ledger" case below uses the exact figures that
// migration produced against a local Postgres 16 run, so a change to either side
// must change both.

const TERMS: RailsAgreementTerms = {
  revenueShareBps: 800,
  tailBps: 200,
  platformFeeBps: 100,
  buildCostMinor: 1_000_000,
  recoveryMultipleX100: 250,
};

function amounts(lines: ReturnType<typeof splitRevenue>) {
  return Object.fromEntries(lines.map((line) => [line.tier ? `${line.line}:${line.tier}` : line.line, line.amountMinor]));
}

describe("rails split engine", () => {
  it("computes the cap from build cost and recovery multiple", () => {
    expect(recoveryCap(TERMS)).toBe(2_500_000);
    expect(recoveryCap({ buildCostMinor: 333, recoveryMultipleX100: 250 })).toBe(832);
    expect(recoveryCap({ buildCostMinor: 300_000_000_000, recoveryMultipleX100: 300 })).toBe(900_000_000_000);
  });

  it("takes the full revenue share while below the cap", () => {
    const lines = splitRevenue(TERMS, 0, 10_000_000);
    expect(amounts(lines)).toEqual({ venture: 9_100_000, "revenue_share:recovery": 800_000, platform_fee: 100_000 });
    expect(sumLines(lines)).toBe(10_000_000);
  });

  it("rounds Pesara's lines down and gives the remainder to the venture", () => {
    const lines = splitRevenue(TERMS, 0, 1_299);
    // 1299 * 8% = 103.92 -> 103; 1% = 12.99 -> 12
    expect(amounts(lines)).toEqual({ venture: 1_184, "revenue_share:recovery": 103, platform_fee: 12 });
    expect(sumLines(lines)).toBe(1_299);
  });

  it("leaves out Pesara lines that round to zero", () => {
    const lines = splitRevenue(TERMS, 0, 11);
    expect(lines).toEqual([{ line: "venture", tier: null, amountMinor: 11 }]);
  });

  it("splits an event that crosses the cap across both tiers", () => {
    const lines = splitRevenue(TERMS, 2_400_000, 3_333_333);
    // 100,000 left to recover needs 1,250,000 of gross at 8%; the other 2,083,333 is at 2%.
    expect(amounts(lines)).toEqual({
      venture: 3_158_334,
      "revenue_share:recovery": 100_000,
      "revenue_share:tail": 41_666,
      platform_fee: 33_333,
    });
    expect(sumLines(lines)).toBe(3_333_333);
    expect(recoveryDelta(lines)).toBe(100_000);
  });

  it("fills the cap exactly when the event lands on it", () => {
    const lines = splitRevenue(TERMS, 2_400_000, 1_250_000);
    expect(amounts(lines)).toEqual({ venture: 1_137_500, "revenue_share:recovery": 100_000, platform_fee: 12_500 });
  });

  it("rounds the crossing point so the recovery line never exceeds the remaining cap", () => {
    const terms = { ...TERMS, revenueShareBps: 700, buildCostMinor: 1_000, recoveryMultipleX100: 100 };
    const lines = splitRevenue(terms, 995, 1_000);
    // 5 left at 7% needs ceil(5 * 10000 / 700) = 72 of gross; tail on 928 at 2% = 18.
    expect(amounts(lines)).toEqual({ venture: 967, "revenue_share:recovery": 5, "revenue_share:tail": 18, platform_fee: 10 });
    expect(sumLines(lines)).toBe(1_000);
  });

  it("charges only the tail once the cap is reached", () => {
    const lines = splitRevenue(TERMS, 2_500_000, 10_000_000);
    expect(amounts(lines)).toEqual({ venture: 9_700_000, "revenue_share:tail": 200_000, platform_fee: 100_000 });
    expect(amounts(splitRevenue(TERMS, 9_000_000, 10_000_000))).toEqual(amounts(lines));
  });

  it("treats a zero cap as already recovered", () => {
    const lines = splitRevenue({ ...TERMS, buildCostMinor: 0 }, 0, 10_000);
    expect(amounts(lines)).toEqual({ venture: 9_700, "revenue_share:tail": 200, platform_fee: 100 });
  });

  it("charges nothing but the platform fee when the revenue share is zero", () => {
    const lines = splitRevenue({ ...TERMS, revenueShareBps: 0, tailBps: 0 }, 0, 10_000);
    expect(amounts(lines)).toEqual({ venture: 9_900, platform_fee: 100 });
  });

  it("keeps the lines summing to the gross for many awkward amounts", () => {
    const terms = { revenueShareBps: 733, tailBps: 149, platformFeeBps: 133, buildCostMinor: 12_345, recoveryMultipleX100: 275 };
    let recovered = 0;
    for (let gross = 1; gross < 600_000; gross += 9_973) {
      const lines = splitRevenue(terms, recovered, gross);
      expect(sumLines(lines)).toBe(gross);
      for (const line of lines) expect(line.amountMinor).toBeGreaterThanOrEqual(0);
      recovered += recoveryDelta(lines);
      expect(recovered).toBeLessThanOrEqual(recoveryCap(terms));
    }
    expect(recovered).toBe(recoveryCap(terms));
  });

  it("handles large amounts without losing precision", () => {
    const terms = { ...TERMS, buildCostMinor: 10_000_000_000_000, recoveryMultipleX100: 1_000 };
    const lines = splitRevenue(terms, 0, 9_999_999_999_999);
    expect(amounts(lines)).toEqual({
      venture: 9_100_000_000_001,
      "revenue_share:recovery": 799_999_999_999,
      platform_fee: 99_999_999_999,
    });
    expect(sumLines(lines)).toBe(9_999_999_999_999);
  });

  it("refuses invalid input", () => {
    expect(() => splitRevenue(TERMS, 0, 0)).toThrow(RangeError);
    expect(() => splitRevenue(TERMS, 0, -5)).toThrow(RangeError);
    expect(() => splitRevenue(TERMS, 0, 1.5)).toThrow(RangeError);
    expect(() => splitRevenue(TERMS, -1, 100)).toThrow(RangeError);
    expect(() => splitRevenue({ ...TERMS, tailBps: 900 }, 0, 100)).toThrow(/tailBps/);
    expect(() => splitRevenue({ ...TERMS, revenueShareBps: 9_950 }, 0, 100)).toThrow(/exceed/);
  });

  it("reverses a refund exactly and gives the recovery back", () => {
    const original = splitRevenue(TERMS, 0, 10_000_000);
    const refund = reverseLines(original);
    expect(sumLines(refund)).toBe(-10_000_000);
    expect(recoveryDelta(refund)).toBe(-800_000);
    expect(original.map((line, index) => line.amountMinor + refund[index].amountMinor)).toEqual([0, 0, 0]);
  });

  it("matches the database ledger for the same sequence of events", () => {
    const { ledger, recoveredMinor } = replay(TERMS, [
      { sourceEventId: "e1", grossMinor: 10_000_000 },
      { sourceEventId: "e1", grossMinor: 10_000_000 },
      { sourceEventId: "e2", grossMinor: 20_000_000 },
      { sourceEventId: "e3", grossMinor: 3_333_333 },
      { sourceEventId: "x2", grossMinor: -20_000_000, reverses: "e2" },
      { sourceEventId: "e5", grossMinor: 5_000_001 },
    ]);
    expect(ledger.map((entry) => entry.sourceEventId)).toEqual(["e1", "e2", "e3", "x2", "e5"]);
    expect(ledger.map((entry) => amounts(entry.lines))).toEqual([
      { venture: 9_100_000, "revenue_share:recovery": 800_000, platform_fee: 100_000 },
      { venture: 18_200_000, "revenue_share:recovery": 1_600_000, platform_fee: 200_000 },
      { venture: 3_158_334, "revenue_share:recovery": 100_000, "revenue_share:tail": 41_666, platform_fee: 33_333 },
      { venture: -18_200_000, "revenue_share:recovery": -1_600_000, platform_fee: -200_000 },
      { venture: 4_550_001, "revenue_share:recovery": 400_000, platform_fee: 50_000 },
    ]);
    expect(recoveredMinor).toBe(1_300_000);
    for (const entry of ledger) expect(sumLines(entry.lines)).toBe(entry.grossMinor);
  });

  it("refuses partial, repeated, and orphan refunds", () => {
    expect(() => replay(TERMS, [{ sourceEventId: "x", grossMinor: -10, reverses: "missing" }])).toThrow(/reverse/);
    expect(() =>
      replay(TERMS, [
        { sourceEventId: "e", grossMinor: 100 },
        { sourceEventId: "x", grossMinor: -50, reverses: "e" },
      ]),
    ).toThrow(/full refunds/);
    expect(() =>
      replay(TERMS, [
        { sourceEventId: "e", grossMinor: 100 },
        { sourceEventId: "x", grossMinor: -100, reverses: "e" },
        { sourceEventId: "y", grossMinor: -100, reverses: "e" },
      ]),
    ).toThrow(/already refunded/);
  });
});

describe("rails formatting", () => {
  it("formats minor units without floating point", () => {
    expect(formatMinor(123_456_789)).toBe("KES 1,234,567.89");
    expect(formatMinor(-5)).toBe("-KES 0.05");
    expect(formatMinor(0, "USD")).toBe("USD 0.00");
  });

  it("formats basis points as percentages", () => {
    expect(formatBps(800)).toBe("8%");
    expect(formatBps(850)).toBe("8.5%");
    expect(formatBps(125)).toBe("1.25%");
    expect(formatBps(5)).toBe("0.05%");
  });
});
