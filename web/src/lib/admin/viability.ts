export const ASSESSMENT_DISCLAIMER =
  "Scores support human commercial judgement and do not predict venture success.";

export const SCORE_LABELS = [
  { score: 1, label: "Weak" },
  { score: 2, label: "Limited" },
  { score: 3, label: "Promising" },
  { score: 4, label: "Strong" },
  { score: 5, label: "Exceptional" },
] as const;

export const COMMITTEE_DECISIONS = ["BUILD", "PILOT", "PIVOT", "PARK", "DECLINE"] as const;

export type CommitteeDecision = (typeof COMMITTEE_DECISIONS)[number];

export const EXPERIMENT_TYPES = [
  "CUSTOMER_INTERVIEW",
  "LANDING_PAGE",
  "WAITLIST",
  "PRICING_TEST",
  "LOI",
  "PRE_ORDER",
  "PROTOTYPE",
  "PILOT",
  "AD_TEST",
  "MANUAL_SERVICE_TEST",
  "OTHER",
] as const;

export type ExperimentType = (typeof EXPERIMENT_TYPES)[number];

export const EXPERIMENT_OUTCOMES = [
  "VALIDATED",
  "PARTIALLY_VALIDATED",
  "INVALIDATED",
  "INCONCLUSIVE",
] as const;

export type ExperimentOutcome = (typeof EXPERIMENT_OUTCOMES)[number];

export const VIABILITY_CATALOG = [
  ["Problem", [
    ["problem_severity", "Severity"],
    ["problem_frequency", "Frequency"],
    ["problem_urgency", "Urgency"],
    ["problem_friction", "Current friction"],
  ]],
  ["Customer", [
    ["customer_clarity", "Clarity"],
    ["customer_access", "Accessibility"],
    ["customer_need", "Need"],
    ["customer_wtp", "Willingness to pay"],
  ]],
  ["Market", [
    ["market_depth", "Market depth"],
    ["market_growth", "Growth potential"],
    ["market_expansion", "Expansion potential"],
  ]],
  ["Competition", [
    ["comp_alternatives", "Existing alternatives"],
    ["comp_intensity", "Competitive intensity"],
    ["comp_diff", "Differentiation"],
  ]],
  ["Business model", [
    ["model_revenue", "Revenue clarity"],
    ["model_pricing", "Pricing logic"],
    ["model_margins", "Margin potential"],
    ["model_recurring", "Recurring revenue potential"],
  ]],
  ["Distribution", [
    ["dist_path", "Customer acquisition path"],
    ["dist_existing", "Existing distribution"],
    ["dist_partners", "Partnership potential"],
  ]],
  ["Evidence", [
    ["evidence_interviews", "Customer interviews"],
    ["evidence_users", "Users"],
    ["evidence_revenue", "Revenue"],
    ["evidence_lois", "LOIs"],
    ["evidence_waitlist", "Waitlist"],
    ["evidence_pilots", "Pilots"],
    ["evidence_preorders", "Pre-orders"],
  ]],
  ["Founder", [
    ["founder_domain", "Domain expertise"],
    ["founder_execution", "Execution ability"],
    ["founder_network", "Network"],
    ["founder_commit", "Commitment"],
  ]],
  ["Technology", [
    ["tech_feasibility", "Feasibility"],
    ["tech_complexity", "Complexity"],
    ["tech_cost", "Development cost"],
    ["tech_infra", "Infrastructure burden"],
  ]],
  ["Regulation", [
    ["reg_licensing", "Licensing"],
    ["reg_data", "Data protection"],
    ["reg_sector", "Sector regulation"],
    ["reg_finance", "Financial regulation"],
  ]],
  ["Defensibility", [
    ["def_data", "Data"],
    ["def_network", "Network effects"],
    ["def_brand", "Brand"],
    ["def_dist", "Distribution"],
    ["def_tech", "Technology"],
    ["def_switch", "Switching costs"],
    ["def_reg", "Regulatory advantage"],
  ]],
  ["Pesara fit", [
    ["fit_improve", "Material improvement"],
    ["fit_capability", "Relevant capabilities"],
    ["fit_resources", "Required resources"],
    ["fit_economics", "Potential economics"],
    ["fit_strategy", "Strategic relevance"],
  ]],
] as const;

export type DimensionRow = {
  key: string;
  label: string;
  category: string;
  weight: number;
};

export function catalogDimensions(): DimensionRow[] {
  return VIABILITY_CATALOG.flatMap(([category, items]) =>
    items.map(([key, label]) => ({ key, label, category, weight: 1 })),
  );
}

export function scoreLabel(score: number): string {
  return SCORE_LABELS.find((item) => item.score === score)?.label ?? "Recorded score";
}

export function experimentTypeLabel(type: string): string {
  return type.toLowerCase().replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function outcomeLabel(outcome: string): string {
  switch (outcome) {
    case "VALIDATED":
      return "Validated";
    case "PARTIALLY_VALIDATED":
      return "Partially validated";
    case "INVALIDATED":
      return "Invalidated";
    case "INCONCLUSIVE":
      return "Inconclusive";
    default:
      return "Recorded outcome";
  }
}

export function isCommitteeDecision(value: string): value is CommitteeDecision {
  return (COMMITTEE_DECISIONS as readonly string[]).includes(value);
}

export function isExperimentType(value: string): value is ExperimentType {
  return (EXPERIMENT_TYPES as readonly string[]).includes(value);
}

export function isExperimentOutcome(value: string): value is ExperimentOutcome {
  return (EXPERIMENT_OUTCOMES as readonly string[]).includes(value);
}

export function weightedMean(items: readonly { score: number; weight: number }[]): number | null {
  const clean = items.filter(
    (item) => Number.isFinite(item.score) && Number.isFinite(item.weight) && item.weight > 0,
  );
  if (clean.length === 0) return null;
  const weight = clean.reduce((sum, item) => sum + item.weight, 0);
  const total = clean.reduce((sum, item) => sum + item.score * item.weight, 0);
  return total / weight;
}

export function groupDimensions(rows: readonly DimensionRow[]): { category: string; items: DimensionRow[] }[] {
  const order = VIABILITY_CATALOG.map(([category]) => category);
  const groups = new Map<string, DimensionRow[]>();
  const sorted = [...rows].sort((a, b) => {
    const categoryDelta = order.indexOf(a.category as (typeof order)[number]) - order.indexOf(b.category as (typeof order)[number]);
    if (categoryDelta !== 0) return categoryDelta;
    return a.label.localeCompare(b.label, "en");
  });
  for (const row of sorted) {
    const list = groups.get(row.category) ?? [];
    list.push(row);
    groups.set(row.category, list);
  }
  return [...groups.entries()].map(([category, items]) => ({ category, items }));
}

export type CategoryScore = {
  category: string;
  mean: number | null;
  scored: number;
};

export function assessmentSummary(
  scores: readonly { category: string; score: number; weight: number }[],
): { categories: CategoryScore[]; overall: number | null; scored: number; total: number } {
  const categories = VIABILITY_CATALOG.map(([category]) => {
    const items = scores.filter((score) => score.category === category);
    return { category, mean: weightedMean(items), scored: items.length };
  });
  return {
    categories,
    overall: weightedMean(scores),
    scored: scores.length,
    total: catalogDimensions().length,
  };
}
