export const REFERRAL_COOKIE = "pesara_referral";

export function isReferralCode(value: string): boolean {
  return /^PESARA-[A-Z0-9-]{4,40}$/.test(value);
}

export function introductionLine(count: number): string | null {
  if (!Number.isInteger(count) || count < 1) return null;
  if (count === 1) return "You've introduced 1 person to Pesara.";
  return `You've introduced ${count} people to Pesara.`;
}

export function referralPath(code: string): string | null {
  const clean = code.trim().toUpperCase();
  if (!isReferralCode(clean)) return null;
  return `/r/${clean}`;
}
