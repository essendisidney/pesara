/**
 * The Pesara co-build partnership: you bring the idea, Pesara brings the technology
 * and the payment rails, and Pesara is paid from what the venture earns.
 *
 * Ranges are published starting points, not a rate card. Every venture is written
 * into its own agreement. Nothing here is a promise of funding or returns.
 */

export type Range = { min: number; max: number };

export const TERMS = {
  equity: { min: 15, max: 35 } satisfies Range,
  revenueShare: { min: 5, max: 10 } satisfies Range,
  recoveryMultiple: { min: 2, max: 3 } satisfies Range,
  revenueShareTail: { min: 1, max: 3 } satisfies Range,
  platformFee: { min: 0.5, max: 1.5 } satisfies Range,
  vestingYears: 4,
} as const;

export function formatRange(range: Range, unit = "%"): string {
  return `${range.min}–${range.max}${unit}`;
}

export const SHARES = [
  {
    key: "equity",
    name: "Equity",
    range: formatRange(TERMS.equity),
    body: "An ownership stake in the company we build together. It vests as Pesara delivers, so Pesara earns it by building, not by signing.",
  },
  {
    key: "revenue",
    name: "Revenue share",
    range: `${formatRange(TERMS.revenueShare)}, then ${formatRange(TERMS.revenueShareTail)}`,
    body: `A share of gross revenue until Pesara has recovered ${TERMS.recoveryMultiple.min}–${TERMS.recoveryMultiple.max} times the cost of the build. After that it steps down for the life of the agreement.`,
  },
  {
    key: "platform",
    name: "Platform fee",
    range: formatRange(TERMS.platformFee),
    body: "A small fee on money collected through Pesara Rails, for as long as the product runs on them. It pays for payments, hosting, security and upgrades.",
  },
] as const;

export const SETTLEMENT_STEPS = [
  {
    title: "The customer pays",
    body: "By M-Pesa, card or bank, into the venture's collection account on Pesara Rails.",
  },
  {
    title: "The payment settles",
    body: "Pesara Rails records every payment and reconciles it the same day.",
  },
  {
    title: "The split is applied",
    body: "The agreed shares are deducted at settlement. The rest goes to the venture's own bank account.",
  },
] as const;

export const MONEY_MOVES = [
  "Savings groups, chamas and SACCOs",
  "School, service and membership fees",
  "Merchant, agent and supplier payments",
  "Bookings, deposits and instalments",
  "Insurance premiums and claims",
  "Credit, leasing and repayments",
] as const;

export const PROTECTIONS = [
  {
    title: "A company for every venture",
    body: "Each venture is its own registered company. The founder holds the majority. Pesara's stake is written in from the first day.",
  },
  {
    title: "Vesting on both sides",
    body: `Founder and Pesara shares vest over ${TERMS.vestingYears} years. Anyone who leaves early keeps only what they have earned.`,
  },
  {
    title: "Platform stays with Pesara",
    body: "The venture owns its brand, customers, data and the product built for it. The shared platform underneath is licensed from Pesara, so every venture benefits from its upgrades.",
  },
  {
    title: "Open books for the founder",
    body: "The founder sees every payment, every fee and every split in real time. Nothing is deducted that the agreement does not name.",
  },
  {
    title: "A clean way out",
    body: "A venture that wants to leave the platform can buy out the revenue share at a multiple fixed in the agreement. No one is held hostage.",
  },
] as const;

export type Example = {
  monthlyRevenue: number;
  buildCost: number;
  equity: number;
  revenueShare: number;
  recoveryMultiple: number;
  tail: number;
  platformFee: number;
};

/** An illustrative venture. Not a quote, a forecast, or a real client. */
export const EXAMPLE: Example = {
  monthlyRevenue: 2_000_000,
  buildCost: 3_000_000,
  equity: 25,
  revenueShare: 8,
  recoveryMultiple: 2.5,
  tail: 2,
  platformFee: 1,
};

export function illustrate(example: Example = EXAMPLE) {
  const platform = (example.monthlyRevenue * example.platformFee) / 100;
  const share = (example.monthlyRevenue * example.revenueShare) / 100;
  const tail = (example.monthlyRevenue * example.tail) / 100;
  const cap = example.buildCost * example.recoveryMultiple;
  const monthsToCap = share > 0 ? Math.ceil(cap / share) : 0;
  const ventureKeepsEarly = example.monthlyRevenue - share - platform;
  const ventureKeepsLater = example.monthlyRevenue - tail - platform;
  return {
    platform,
    share,
    tail,
    cap,
    monthsToCap,
    ventureKeepsEarly,
    ventureKeepsLater,
    keepsEarlyPercent: (ventureKeepsEarly / example.monthlyRevenue) * 100,
    keepsLaterPercent: (ventureKeepsLater / example.monthlyRevenue) * 100,
  };
}

export function kes(value: number): string {
  return `KES ${Math.round(value).toLocaleString("en-KE")}`;
}

export type SplitLine = { key: "venture" | "revenue" | "platform"; label: string; amount: number; percent: number };

/** How one customer payment divides at settlement under the example terms. */
export function splitPayment(amount: number, example: Example = EXAMPLE): SplitLine[] {
  const revenue = (amount * example.revenueShare) / 100;
  const platform = (amount * example.platformFee) / 100;
  const venture = amount - revenue - platform;
  return [
    { key: "venture", label: "To the venture", amount: venture, percent: 100 - example.revenueShare - example.platformFee },
    { key: "revenue", label: "Pesara revenue share", amount: revenue, percent: example.revenueShare },
    { key: "platform", label: "Platform fee", amount: platform, percent: example.platformFee },
  ];
}
