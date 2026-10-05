/**
 * Pesara Rails v0 split engine. This is the reference implementation: the
 * database function `private.rails_split` in
 * `supabase/migrations/20261005120000_pesara_rails_v0.sql` applies the same
 * algorithm when an event is recorded, and the two must stay identical.
 *
 * Rules (docs/PESARA_RAILS_V0.md, section 3):
 * - Integer minor units only. Amounts are safe integers; products are taken in
 *   BigInt so a large gross times a rate never loses precision.
 * - Revenue share at `revenueShareBps` until the cap is reached, then `tailBps`.
 * - An event that crosses the cap is split across both tiers.
 * - Platform fee at `platformFeeBps` on the whole event.
 * - Pesara's lines round down. The venture line is the remainder, so rounding
 *   always favours the founder and the lines always sum to the gross.
 * - A refund produces exactly reversing lines of the event it reverses, and
 *   reduces the amount recovered by that event's recovery line.
 *
 * Recovery definition: "until Pesara recovers 2–3x the build cost" is read as
 * the cumulative revenue share Pesara has been paid in the recovery tier, net
 * of refunds. Platform fees do not count toward recovery (they pay for running
 * the platform, not for the build), and tail-tier revenue share does not count
 * either, because it only exists once the cap is already reached.
 *
 *   cap        = floor(buildCostMinor * recoveryMultipleX100 / 100)
 *   recovered  = sum of revenue_share lines in the recovery tier, refunds included
 *   remaining  = max(cap - recovered, 0)
 *
 * For a positive gross G with rate R (bps), full-rate share S = floor(G * R / 10000).
 * - S <= remaining: one recovery line of S.
 * - S >  remaining: the event crosses the cap. The part of G needed to fill the
 *   cap is G1 = ceil(remaining * 10000 / R). The recovery line is exactly
 *   `remaining` (which is <= floor(G1 * R / 10000), so it still rounds down),
 *   and the tail line is floor((G - G1) * tailBps / 10000).
 * - remaining == 0 (or R == 0 with a zero cap): the whole event is tail.
 */

export const BPS = 10_000;
/** Largest gross accepted for one event, in minor units (KES 100 billion in cents). */
export const MAX_EVENT_MINOR = 10_000_000_000_000;
/** Bounds that keep the cap a safe integer (at most 10^14). Same checks as the database. */
export const MAX_BUILD_COST_MINOR = 10_000_000_000_000;
export const MAX_RECOVERY_MULTIPLE_X100 = 1_000;

export type RailsAgreementTerms = {
  revenueShareBps: number;
  tailBps: number;
  platformFeeBps: number;
  buildCostMinor: number;
  recoveryMultipleX100: number;
};

export type SplitLineKind = "venture" | "revenue_share" | "platform_fee";
export type SplitTier = "recovery" | "tail" | null;

export type RailsSplitLine = {
  line: SplitLineKind;
  tier: SplitTier;
  amountMinor: number;
};

function assertInteger(name: string, value: number, min: number, max: number): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}`);
  }
}

export function assertTerms(terms: RailsAgreementTerms): void {
  assertInteger("revenueShareBps", terms.revenueShareBps, 0, BPS);
  assertInteger("tailBps", terms.tailBps, 0, BPS);
  assertInteger("platformFeeBps", terms.platformFeeBps, 0, BPS);
  assertInteger("buildCostMinor", terms.buildCostMinor, 0, MAX_BUILD_COST_MINOR);
  assertInteger("recoveryMultipleX100", terms.recoveryMultipleX100, 0, MAX_RECOVERY_MULTIPLE_X100);
  if (terms.tailBps > terms.revenueShareBps) throw new RangeError("tailBps cannot exceed revenueShareBps");
  if (terms.revenueShareBps + terms.platformFeeBps > BPS) throw new RangeError("Pesara's rates cannot exceed the gross");
}

/** floor(build cost x multiple / 100), in minor units. */
export function recoveryCap(terms: Pick<RailsAgreementTerms, "buildCostMinor" | "recoveryMultipleX100">): number {
  return Number((BigInt(terms.buildCostMinor) * BigInt(terms.recoveryMultipleX100)) / BigInt(100));
}

function floorBps(amount: number, bps: number): number {
  return Number((BigInt(amount) * BigInt(bps)) / BigInt(BPS));
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - BigInt(1)) / denominator;
}

/**
 * Split one positive revenue event. `recoveredMinor` is the recovery-tier
 * revenue share already recorded for the venture before this event.
 * Zero-amount Pesara lines are left out; the venture line is always present.
 */
export function splitRevenue(terms: RailsAgreementTerms, recoveredMinor: number, grossMinor: number): RailsSplitLine[] {
  assertTerms(terms);
  assertInteger("grossMinor", grossMinor, 1, MAX_EVENT_MINOR);
  assertInteger("recoveredMinor", recoveredMinor, 0, Number.MAX_SAFE_INTEGER);

  const cap = recoveryCap(terms);
  const remaining = Math.max(cap - recoveredMinor, 0);
  const fullShare = floorBps(grossMinor, terms.revenueShareBps);

  let recovery = 0;
  let tail = 0;
  if (remaining > 0 && fullShare <= remaining) {
    recovery = fullShare;
  } else if (remaining > 0) {
    // fullShare > remaining implies revenueShareBps > 0.
    const grossToCap = Number(ceilDiv(BigInt(remaining) * BigInt(BPS), BigInt(terms.revenueShareBps)));
    recovery = remaining;
    tail = floorBps(grossMinor - grossToCap, terms.tailBps);
  } else {
    tail = floorBps(grossMinor, terms.tailBps);
  }
  const platform = floorBps(grossMinor, terms.platformFeeBps);
  const venture = grossMinor - recovery - tail - platform;

  const lines: RailsSplitLine[] = [{ line: "venture", tier: null, amountMinor: venture }];
  if (recovery > 0) lines.push({ line: "revenue_share", tier: "recovery", amountMinor: recovery });
  if (tail > 0) lines.push({ line: "revenue_share", tier: "tail", amountMinor: tail });
  if (platform > 0) lines.push({ line: "platform_fee", tier: null, amountMinor: platform });
  return lines;
}

/** A refund reverses the original event's lines exactly. v0 accepts full refunds only. */
export function reverseLines(original: RailsSplitLine[]): RailsSplitLine[] {
  return original.map((line) => ({ ...line, amountMinor: -line.amountMinor }));
}

/** Change in recovered amount caused by a set of lines (negative for a refund). */
export function recoveryDelta(lines: RailsSplitLine[]): number {
  return lines.reduce((sum, line) => (line.line === "revenue_share" && line.tier === "recovery" ? sum + line.amountMinor : sum), 0);
}

export function sumLines(lines: RailsSplitLine[]): number {
  return lines.reduce((sum, line) => sum + line.amountMinor, 0);
}

export type RailsEventInput =
  | { sourceEventId: string; grossMinor: number }
  | { sourceEventId: string; grossMinor: number; reverses: string };

export type LedgerEntry = { sourceEventId: string; grossMinor: number; reverses: string | null; lines: RailsSplitLine[] };

/**
 * Replays a sequence of events in order, the way the database records them,
 * and returns the ledger and the final recovered amount. Used by tests and to
 * check the database against the reference.
 */
export function replay(terms: RailsAgreementTerms, events: RailsEventInput[]): { ledger: LedgerEntry[]; recoveredMinor: number } {
  const ledger: LedgerEntry[] = [];
  const seen = new Map<string, LedgerEntry>();
  const reversed = new Set<string>();
  let recovered = 0;
  for (const event of events) {
    const existing = seen.get(event.sourceEventId);
    if (existing) continue;
    let entry: LedgerEntry;
    if ("reverses" in event) {
      const original = seen.get(event.reverses);
      if (!original || original.reverses) throw new Error("refund must reverse a recorded revenue event");
      if (reversed.has(event.reverses)) throw new Error("event already refunded");
      if (event.grossMinor !== -original.grossMinor) throw new Error("v0 accepts full refunds only");
      entry = { sourceEventId: event.sourceEventId, grossMinor: event.grossMinor, reverses: event.reverses, lines: reverseLines(original.lines) };
      reversed.add(event.reverses);
    } else {
      entry = { sourceEventId: event.sourceEventId, grossMinor: event.grossMinor, reverses: null, lines: splitRevenue(terms, recovered, event.grossMinor) };
    }
    recovered += recoveryDelta(entry.lines);
    seen.set(event.sourceEventId, entry);
    ledger.push(entry);
  }
  return { ledger, recoveredMinor: recovered };
}

/** Formats minor units as a currency string without floating-point drift. */
export function formatMinor(amountMinor: number, currency = "KES"): string {
  const negative = amountMinor < 0;
  const absolute = BigInt(Math.abs(amountMinor));
  const major = (absolute / BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const minor = (absolute % BigInt(100)).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${currency} ${major}.${minor}`;
}

/** Basis points as a percentage label, e.g. 850 -> "8.5%". */
export function formatBps(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const fraction = Math.abs(bps % 100);
  if (fraction === 0) return `${whole}%`;
  return `${whole}.${fraction.toString().padStart(2, "0").replace(/0$/, "")}%`;
}
