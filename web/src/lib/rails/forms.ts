import { MAX_BUILD_COST_MINOR, MAX_RECOVERY_MULTIPLE_X100 } from "@/lib/rails/split";

/**
 * Parses the staff Rails forms into integer units without floating point.
 * Each returns null for anything that is not a plain, in-range number.
 */

function scaled(raw: string, decimals: number): number | null {
  const value = raw.trim().replace(/,/g, "");
  const match = new RegExp(`^(\\d{1,15})(?:\\.(\\d{1,${decimals}}))?$`).exec(value);
  if (!match) return null;
  const whole = Number(match[1]) * 10 ** decimals;
  const fraction = Number((match[2] ?? "").padEnd(decimals, "0") || "0");
  const result = whole + fraction;
  return Number.isSafeInteger(result) ? result : null;
}

/** "8.5" (percent) -> 850 basis points. */
export function percentToBps(raw: string): number | null {
  const bps = scaled(raw, 2);
  return bps !== null && bps <= 10_000 ? bps : null;
}

/** "1,234.56" (major units) -> 123456 minor units. */
export function majorToMinor(raw: string): number | null {
  return scaled(raw, 2);
}

/** "2.5" (times) -> 250. */
export function multipleToX100(raw: string): number | null {
  const value = scaled(raw, 2);
  return value !== null && value <= MAX_RECOVERY_MULTIPLE_X100 ? value : null;
}

export function buildCostToMinor(raw: string): number | null {
  const value = majorToMinor(raw);
  return value !== null && value <= MAX_BUILD_COST_MINOR ? value : null;
}

/** "plan_purchase, platform_tip" -> ["plan_purchase", "platform_tip"]. */
export function parseKinds(raw: string): string[] | null {
  const kinds = [...new Set(raw.split(/[\s,]+/).map((kind) => kind.trim()).filter(Boolean))];
  if (kinds.length === 0 || kinds.length > 20 || kinds.some((kind) => !/^[a-z0-9_.-]{1,64}$/.test(kind))) return null;
  return kinds;
}

/** "2026-08" or "2026-08-01" -> "2026-08-01". */
export function parseMonth(raw: string): string | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])(?:-01)?$/.exec(raw.trim());
  return match ? `${match[1]}-${match[2]}-01` : null;
}

export const RAILS_NOTICES: Record<string, string> = {
  drafted: "Agreement drafted. A second person must activate it.",
  activated: "Agreement active. New events split on these terms.",
  issued: "Statement issued.",
  settled: "Statement marked settled.",
  secret: "Intake secret set. Send it to the venture over a secure channel; the old one no longer works.",
};

export const RAILS_ERRORS: Record<string, string> = {
  invalid: "That change was not accepted. Check the figures.",
  failed: "The change could not be saved.",
  four_eyes: "A second person must do this step. The person who drafted or issued it cannot.",
  mismatch: "The amount received does not equal Pesara's total on the statement. Leave it open and raise it as an exception.",
  exists: "A statement for that month already exists.",
  open_month: "That month has not closed yet.",
  no_agreement: "This venture has no active Rails agreement.",
};

/** Maps a database refusal to one of RAILS_ERRORS. */
export function railsErrorCode(message: string | undefined): string {
  if (!message) return "failed";
  if (message.includes("second person")) return "four_eyes";
  if (message.includes("does not match the statement")) return "mismatch";
  if (message.includes("already issued")) return "exists";
  if (message.includes("has not closed")) return "open_month";
  if (message.includes("no active agreement")) return "no_agreement";
  if (message.includes("check constraint") || message.includes("invalid")) return "invalid";
  return "failed";
}
