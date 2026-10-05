import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  monthLabel,
  monthsToIssue,
  nairobiMonth,
  presentEvents,
  presentSummary,
  recoveryProgress,
  statementExceptions,
  type RailsStatement,
} from "../src/lib/rails/books";
import { buildCostToMinor, majorToMinor, multipleToX100, parseKinds, parseMonth, percentToBps, railsErrorCode } from "../src/lib/rails/forms";

const statement: RailsStatement = {
  id: "s1",
  periodMonth: "2026-08-01",
  currency: "KES",
  eventCount: 2,
  grossMinor: 13_333_333,
  ventureMinor: 12_258_334,
  revenueShareMinor: 941_666,
  platformFeeMinor: 133_333,
  pesaraTotalMinor: 1_074_999,
  recoveredToDateMinor: 900_000,
  capMinor: 2_500_000,
  capRemainingMinor: 1_600_000,
  status: "issued",
  issuedBy: "a",
  issuedAt: "2026-09-02T08:00:00Z",
  settlementReference: null,
  settledAmountMinor: null,
  settledAt: null,
};

const august = {
  periodMonth: "2026-08-01",
  eventCount: 2,
  grossMinor: 13_333_333,
  ventureMinor: 12_258_334,
  revenueShareMinor: 941_666,
  platformFeeMinor: 133_333,
  pesaraTotalMinor: 1_074_999,
};

describe("rails books", () => {
  it("reads the venture summary from the database", () => {
    const summary = presentSummary({
      name: "Jameiyah",
      event_count: 5,
      recovered_minor: 1_300_000,
      months: [{ period_month: "2026-08-01", event_count: 2, gross_minor: 13_333_333, venture_minor: 12_258_334, revenue_share_minor: 941_666, platform_fee_minor: 133_333, pesara_total_minor: 1_074_999 }],
    });
    expect(summary).toEqual({ name: "Jameiyah", eventCount: 5, recoveredMinor: 1_300_000, months: [august] });
    expect(presentSummary(null)).toBeNull();
    expect(presentSummary({ name: "" })).toBeNull();
  });

  it("measures recovery toward the cap", () => {
    const terms = { buildCostMinor: 1_000_000, recoveryMultipleX100: 250 };
    expect(recoveryProgress(terms, 1_300_000)).toEqual({ recoveredMinor: 1_300_000, capMinor: 2_500_000, remainingMinor: 1_200_000, percent: 52, reached: false });
    expect(recoveryProgress(terms, 2_500_000).reached).toBe(true);
    expect(recoveryProgress(null, 10).percent).toBe(0);
  });

  it("attaches split lines to their events in a fixed order", () => {
    const events = presentEvents(
      [{ id: "e3", source_event_id: "e3", kind: "platform_tip", gross_minor: "3333333", currency: "KES", occurred_at: "2026-08-15T10:00:00Z", period_month: "2026-08-01" }],
      [
        { event_id: "e3", line: "platform_fee", tier: null, amount_minor: 33_333 },
        { event_id: "e3", line: "revenue_share", tier: "tail", amount_minor: 41_666 },
        { event_id: "e3", line: "venture", tier: null, amount_minor: 3_158_334 },
        { event_id: "e3", line: "revenue_share", tier: "recovery", amount_minor: 100_000 },
        { event_id: "e3", line: "bogus", tier: null, amount_minor: 1 },
      ],
    );
    expect(events).toHaveLength(1);
    expect(events[0].grossMinor).toBe(3_333_333);
    expect(events[0].lines.map((line) => `${line.line}:${line.tier ?? ""}`)).toEqual(["venture:", "revenue_share:recovery", "revenue_share:tail", "platform_fee:"]);
  });

  it("flags a statement whose month changed or whose settlement does not match", () => {
    expect(statementExceptions([statement], [august])).toEqual([]);
    const late = statementExceptions([statement], [{ ...august, eventCount: 3, pesaraTotalMinor: 1_100_000 }]);
    expect(late).toHaveLength(1);
    expect(late[0].message).toContain("KES 11,000.00");
    expect(statementExceptions([{ ...statement, status: "settled", settledAmountMinor: 1 }], [august])).toHaveLength(1);
    expect(statementExceptions([statement], [])).toHaveLength(1);
  });

  it("lists closed months still waiting for a statement", () => {
    const months = [august, { ...august, periodMonth: "2026-09-01" }, { ...august, periodMonth: "2026-10-01" }, { ...august, periodMonth: "2026-07-01" }];
    expect(monthsToIssue(months, [statement], "2026-10-01")).toEqual(["2026-07-01", "2026-09-01"]);
  });

  it("uses Nairobi time for the month", () => {
    expect(nairobiMonth(new Date("2026-08-31T20:59:59Z"))).toBe("2026-08-01");
    expect(nairobiMonth(new Date("2026-08-31T21:00:00Z"))).toBe("2026-09-01");
    expect(monthLabel("2026-09-01")).toBe("September 2026");
  });
});

describe("rails staff forms", () => {
  it("turns percentages and amounts into integers without floating point", () => {
    expect(percentToBps("8")).toBe(800);
    expect(percentToBps("8.5")).toBe(850);
    expect(percentToBps("0.29")).toBe(29);
    expect(percentToBps("8.555")).toBeNull();
    expect(percentToBps("101")).toBeNull();
    expect(percentToBps("-1")).toBeNull();
    expect(majorToMinor("1,234.56")).toBe(123_456);
    expect(majorToMinor("0.1")).toBe(10);
    expect(majorToMinor("1e5")).toBeNull();
    expect(buildCostToMinor("3000000")).toBe(300_000_000);
    expect(buildCostToMinor("200000000000")).toBeNull();
    expect(multipleToX100("2.5")).toBe(250);
    expect(multipleToX100("11")).toBeNull();
  });

  it("reads revenue kinds and months", () => {
    expect(parseKinds("plan_purchase, platform_tip plan_purchase")).toEqual(["plan_purchase", "platform_tip"]);
    expect(parseKinds("")).toBeNull();
    expect(parseKinds("Contributions")).toBeNull();
    expect(parseMonth("2026-08")).toBe("2026-08-01");
    expect(parseMonth("2026-08-01")).toBe("2026-08-01");
    expect(parseMonth("2026-13")).toBeNull();
  });

  it("explains database refusals", () => {
    expect(railsErrorCode("a second person must settle the statement")).toBe("four_eyes");
    expect(railsErrorCode("settled amount does not match the statement")).toBe("mismatch");
    expect(railsErrorCode("statement already issued")).toBe("exists");
    expect(railsErrorCode("month has not closed")).toBe("open_month");
    expect(railsErrorCode("something else")).toBe("failed");
  });
});

describe("rails migration guards", () => {
  const sql = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations/20261005120000_pesara_rails_v0.sql"), "utf8");

  it("enables row-level security and gives clients read-only access", () => {
    for (const table of ["rails_agreements", "rails_revenue_events", "rails_split_lines", "rails_statements", "rails_venture_secrets"]) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
    }
    expect(sql).not.toMatch(/grant (insert|update|delete|all)[^;]*on public\.rails_/i);
    expect(sql).not.toMatch(/create policy rails_[a-z_]+ on public\.rails_[a-z_]+\s+for (all|insert|update|delete)/i);
    expect(sql).toContain("create policy rails_secrets_admin on public.rails_venture_secrets\n  for select using (private.is_admin());");
  });

  it("lets only the service role record events", () => {
    expect(sql).toContain("revoke all on function public.rails_record_event(uuid, text, text, bigint, text, timestamptz, text, text) from public, anon, authenticated;");
    expect(sql).toContain("grant execute on function public.rails_record_event(uuid, text, text, bigint, text, timestamptz, text, text) to service_role;");
  });

  it("keeps one active agreement per venture and four eyes on activation and settlement", () => {
    expect(sql).toMatch(/create unique index if not exists rails_agreements_one_active[\s\S]*?where status = 'active';/);
    expect(sql).toContain("a second person must activate the agreement");
    expect(sql).toContain("a second person must settle the statement");
    expect(sql).toContain("unique (venture_id, source_event_id)");
  });
});
