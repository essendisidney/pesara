import { formatMinor, recoveryCap, type RailsSplitLine, type SplitLineKind, type SplitTier } from "@/lib/rails/split";

/** Presentation and reconciliation helpers for a venture's Rails books. Pure. */

export type RailsAgreement = {
  id: string;
  status: "draft" | "active" | "ended";
  equityBps: number;
  revenueShareBps: number;
  tailBps: number;
  platformFeeBps: number;
  buildCostMinor: number;
  recoveryMultipleX100: number;
  currency: string;
  revenueKinds: string[];
  effectiveFrom: string;
  agreementDocument: string | null;
  createdBy: string | null;
  createdAt: string;
  activatedAt: string | null;
};

export type RailsEvent = {
  id: string;
  sourceEventId: string;
  kind: string;
  grossMinor: number;
  currency: string;
  occurredAt: string;
  periodMonth: string;
  reference: string | null;
  reverses: string | null;
  lines: RailsSplitLine[];
};

export type RailsStatement = {
  id: string;
  periodMonth: string;
  currency: string;
  eventCount: number;
  grossMinor: number;
  ventureMinor: number;
  revenueShareMinor: number;
  platformFeeMinor: number;
  pesaraTotalMinor: number;
  recoveredToDateMinor: number;
  capMinor: number;
  capRemainingMinor: number;
  status: "draft" | "issued" | "settled";
  issuedBy: string | null;
  issuedAt: string | null;
  settlementReference: string | null;
  settledAmountMinor: number | null;
  settledAt: string | null;
};

export type MonthTotals = {
  eventCount: number;
  grossMinor: number;
  ventureMinor: number;
  revenueShareMinor: number;
  platformFeeMinor: number;
  pesaraTotalMinor: number;
};

function rows(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item));
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Integer from a bigint column (PostgREST sends numbers; strings are accepted too). */
function integer(value: unknown): number | null {
  const parsed = typeof value === "string" && /^-?\d+$/.test(value.trim()) ? Number(value) : value;
  return typeof parsed === "number" && Number.isSafeInteger(parsed) ? parsed : null;
}

const LINE_KINDS: SplitLineKind[] = ["venture", "revenue_share", "platform_fee"];

export function presentAgreements(data: unknown): RailsAgreement[] {
  return rows(data).flatMap((row) => {
    const id = text(row.id);
    const status = text(row.status);
    const numbers = [
      row.equity_bps,
      row.revenue_share_bps,
      row.tail_bps,
      row.platform_fee_bps,
      row.build_cost_minor,
      row.recovery_multiple_x100,
    ].map(integer);
    if (!id || (status !== "draft" && status !== "active" && status !== "ended") || numbers.some((value) => value === null)) return [];
    const [equityBps, revenueShareBps, tailBps, platformFeeBps, buildCostMinor, recoveryMultipleX100] = numbers as number[];
    return [{
      id,
      status,
      equityBps,
      revenueShareBps,
      tailBps,
      platformFeeBps,
      buildCostMinor,
      recoveryMultipleX100,
      currency: text(row.currency) ?? "KES",
      revenueKinds: Array.isArray(row.revenue_kinds) ? row.revenue_kinds.filter((kind): kind is string => typeof kind === "string") : [],
      effectiveFrom: text(row.effective_from) ?? "",
      agreementDocument: text(row.agreement_document),
      createdBy: text(row.created_by),
      createdAt: text(row.created_at) ?? "",
      activatedAt: text(row.activated_at),
    }];
  });
}

export function presentEvents(eventData: unknown, lineData: unknown): RailsEvent[] {
  const linesByEvent = new Map<string, RailsSplitLine[]>();
  for (const row of rows(lineData)) {
    const eventId = text(row.event_id);
    const line = text(row.line) as SplitLineKind | null;
    const tier = text(row.tier);
    const amountMinor = integer(row.amount_minor);
    if (!eventId || !line || !LINE_KINDS.includes(line) || amountMinor === null) continue;
    const list = linesByEvent.get(eventId) ?? [];
    list.push({ line, tier: tier === "recovery" || tier === "tail" ? (tier as SplitTier) : null, amountMinor });
    linesByEvent.set(eventId, list);
  }
  const order = (line: RailsSplitLine) => LINE_KINDS.indexOf(line.line) * 2 + (line.tier === "tail" ? 1 : 0);
  return rows(eventData).flatMap((row) => {
    const id = text(row.id);
    const grossMinor = integer(row.gross_minor);
    const sourceEventId = text(row.source_event_id);
    if (!id || grossMinor === null || !sourceEventId) return [];
    return [{
      id,
      sourceEventId,
      kind: text(row.kind) ?? "",
      grossMinor,
      currency: text(row.currency) ?? "KES",
      occurredAt: text(row.occurred_at) ?? "",
      periodMonth: text(row.period_month) ?? "",
      reference: text(row.reference),
      reverses: text(row.reverses),
      lines: (linesByEvent.get(id) ?? []).sort((left, right) => order(left) - order(right)),
    }];
  });
}

export function presentStatements(data: unknown): RailsStatement[] {
  return rows(data).flatMap((row) => {
    const id = text(row.id);
    const status = text(row.status);
    const periodMonth = text(row.period_month);
    if (!id || !periodMonth || (status !== "draft" && status !== "issued" && status !== "settled")) return [];
    return [{
      id,
      periodMonth,
      currency: text(row.currency) ?? "KES",
      eventCount: integer(row.event_count) ?? 0,
      grossMinor: integer(row.gross_minor) ?? 0,
      ventureMinor: integer(row.venture_minor) ?? 0,
      revenueShareMinor: integer(row.revenue_share_minor) ?? 0,
      platformFeeMinor: integer(row.platform_fee_minor) ?? 0,
      pesaraTotalMinor: integer(row.pesara_total_minor) ?? 0,
      recoveredToDateMinor: integer(row.recovered_to_date_minor) ?? 0,
      capMinor: integer(row.cap_minor) ?? 0,
      capRemainingMinor: integer(row.cap_remaining_minor) ?? 0,
      status,
      issuedBy: text(row.issued_by),
      issuedAt: text(row.issued_at),
      settlementReference: text(row.settlement_reference),
      settledAmountMinor: integer(row.settled_amount_minor),
      settledAt: text(row.settled_at),
    }];
  });
}

export type MonthRow = MonthTotals & { periodMonth: string };

export type RailsSummary = { name: string; eventCount: number; recoveredMinor: number; months: MonthRow[] };

/** Reads public.rails_venture_summary: venture name, recovery to date, current totals per month. */
export function presentSummary(data: unknown): RailsSummary | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const row = data as Record<string, unknown>;
  const name = text(row.name);
  if (!name) return null;
  const months = rows(row.months).flatMap((month) => {
    const periodMonth = text(month.period_month);
    if (!periodMonth) return [];
    return [{
      periodMonth,
      eventCount: integer(month.event_count) ?? 0,
      grossMinor: integer(month.gross_minor) ?? 0,
      ventureMinor: integer(month.venture_minor) ?? 0,
      revenueShareMinor: integer(month.revenue_share_minor) ?? 0,
      platformFeeMinor: integer(month.platform_fee_minor) ?? 0,
      pesaraTotalMinor: integer(month.pesara_total_minor) ?? 0,
    }];
  });
  return { name, eventCount: integer(row.event_count) ?? 0, recoveredMinor: integer(row.recovered_minor) ?? 0, months };
}

/**
 * Recovery toward the cap. `recoveredMinor` is Pesara's recovery-tier revenue
 * share over every event, net of refunds (see split.ts for why).
 */
export function recoveryProgress(agreement: Pick<RailsAgreement, "buildCostMinor" | "recoveryMultipleX100"> | null, recoveredMinor: number) {
  const capMinor = agreement ? recoveryCap(agreement) : 0;
  const remainingMinor = Math.max(capMinor - recoveredMinor, 0);
  const percent = capMinor > 0 ? Math.min(100, Math.floor((recoveredMinor * 100) / capMinor)) : 0;
  return { recoveredMinor, capMinor, remainingMinor, percent, reached: capMinor > 0 && remainingMinor === 0 };
}

/** Totals of a set of events for one month, from their split lines. */
export function monthTotals(events: RailsEvent[], periodMonth: string): MonthTotals {
  const totals: MonthTotals = { eventCount: 0, grossMinor: 0, ventureMinor: 0, revenueShareMinor: 0, platformFeeMinor: 0, pesaraTotalMinor: 0 };
  for (const event of events) {
    if (event.periodMonth !== periodMonth) continue;
    totals.eventCount += 1;
    totals.grossMinor += event.grossMinor;
    for (const line of event.lines) {
      if (line.line === "venture") totals.ventureMinor += line.amountMinor;
      else {
        if (line.line === "revenue_share") totals.revenueShareMinor += line.amountMinor;
        else totals.platformFeeMinor += line.amountMinor;
        totals.pesaraTotalMinor += line.amountMinor;
      }
    }
  }
  return totals;
}

export type RailsException = { statementId: string; periodMonth: string; message: string };

const EMPTY_MONTH: MonthTotals = { eventCount: 0, grossMinor: 0, ventureMinor: 0, revenueShareMinor: 0, platformFeeMinor: 0, pesaraTotalMinor: 0 };

/**
 * Reconciliation: a statement must still equal Pesara's lines for its month
 * (a late event or a refund dated in that month changes them), and a settled
 * statement must have received exactly its total.
 */
export function statementExceptions(statements: RailsStatement[], months: MonthRow[]): RailsException[] {
  const byMonth = new Map(months.map((month) => [month.periodMonth, month]));
  const exceptions: RailsException[] = [];
  for (const statement of statements) {
    const now = byMonth.get(statement.periodMonth) ?? EMPTY_MONTH;
    if (now.pesaraTotalMinor !== statement.pesaraTotalMinor || now.grossMinor !== statement.grossMinor || now.eventCount !== statement.eventCount) {
      exceptions.push({
        statementId: statement.id,
        periodMonth: statement.periodMonth,
        message: `Events for this month changed after the statement was issued. Pesara's lines now total ${formatMinor(now.pesaraTotalMinor, statement.currency)}; the statement says ${formatMinor(statement.pesaraTotalMinor, statement.currency)}.`,
      });
    }
    if (statement.status === "settled" && statement.settledAmountMinor !== statement.pesaraTotalMinor) {
      exceptions.push({
        statementId: statement.id,
        periodMonth: statement.periodMonth,
        message: "The settled amount does not equal the statement total.",
      });
    }
  }
  return exceptions;
}

/** Nairobi is UTC+3 all year. Returns the first day of the month, e.g. "2026-10-01". */
export function nairobiMonth(at: Date): string {
  return `${new Date(at.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 7)}-01`;
}

/** Closed months that have events and no statement yet, oldest first. */
export function monthsToIssue(months: MonthRow[], statements: RailsStatement[], currentMonth: string): string[] {
  const issued = new Set(statements.map((statement) => statement.periodMonth));
  return months
    .map((month) => month.periodMonth)
    .filter((month) => month < currentMonth && !issued.has(month))
    .sort();
}

export function monthLabel(periodMonth: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(periodMonth);
  if (!match) return periodMonth;
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${names[Number(match[2]) - 1] ?? match[2]} ${match[1]}`;
}

export function lineLabel(line: RailsSplitLine): string {
  if (line.line === "venture") return "To the venture";
  if (line.line === "platform_fee") return "Platform fee";
  return line.tier === "tail" ? "Revenue share (after recovery)" : "Revenue share (recovery)";
}
