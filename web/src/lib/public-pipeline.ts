export const PIPELINE_METRICS = [
  { key: "ideas_submitted", label: "Ideas submitted" },
  { key: "under_review", label: "Under review" },
  { key: "in_validation", label: "In validation" },
  { key: "being_built", label: "Being built" },
  { key: "launched", label: "Launched" },
] as const;

export type PipelineKey = (typeof PIPELINE_METRICS)[number]["key"];

export type PublicMetric = { key: PipelineKey; label: string; value: string };

const KEYS = new Set<string>(PIPELINE_METRICS.map((item) => item.key));

export function isPipelineKey(value: string): value is PipelineKey {
  return KEYS.has(value);
}

export function presentPipeline(rows: readonly { metric?: unknown; total?: unknown }[]): PublicMetric[] {
  return rows.flatMap((row) => {
    if (typeof row.metric !== "string" || !isPipelineKey(row.metric)) return [];
    const total = typeof row.total === "number" ? row.total : typeof row.total === "string" ? Number(row.total) : NaN;
    if (!Number.isInteger(total) || total < 1) return [];
    const label = PIPELINE_METRICS.find((item) => item.key === row.metric)?.label;
    if (!label) return [];
    return [{ key: row.metric, label, value: String(total) }];
  });
}

export function metricFlags(value: unknown): Record<PipelineKey, boolean> {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    ideas_submitted: source.ideas_submitted === true,
    under_review: source.under_review === true,
    in_validation: source.in_validation === true,
    being_built: source.being_built === true,
    launched: source.launched === true,
  };
}
