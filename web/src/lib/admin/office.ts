export const ARTICLE_CATEGORIES = [
  "ideas",
  "technology",
  "startups",
  "markets",
  "africa",
  "product",
  "capital",
  "research",
  "founder-stories",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export function articleSlug(value: string): string | null {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 80) return null;
  return slug;
}

export function isArticleCategory(value: string): value is ArticleCategory {
  return (ARTICLE_CATEGORIES as readonly string[]).includes(value);
}

export type StageEvent = {
  applicationId: string;
  toStage: string;
  at: string;
};

export function completedStageDays(events: readonly StageEvent[], stage: string): number[] {
  const grouped = new Map<string, { toStage: string; at: number }[]>();
  for (const event of events) {
    const at = Date.parse(event.at);
    if (!event.applicationId || !Number.isFinite(at)) continue;
    const list = grouped.get(event.applicationId) ?? [];
    list.push({ toStage: event.toStage, at });
    grouped.set(event.applicationId, list);
  }
  const days: number[] = [];
  for (const list of grouped.values()) {
    list.sort((left, right) => left.at - right.at);
    const entered = list.findIndex((item) => item.toStage === stage);
    if (entered < 0) continue;
    const left = list.slice(entered + 1).find((item) => item.toStage !== stage);
    if (!left) continue;
    const whole = Math.round((left.at - list[entered].at) / DAY_MS);
    if (whole >= 0) days.push(whole);
  }
  return days;
}

export function medianDays(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function orderedCounts(values: readonly string[], order: readonly string[]): { key: string; count: number }[] {
  const counts = new Map(order.map((key) => [key, 0]));
  for (const value of values) {
    if (!counts.has(value)) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return order.map((key) => ({ key, count: counts.get(key) ?? 0 }));
}

export function groupedCounts(values: readonly string[]): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value.trim() || "Not recorded";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

export function acquisitionSource(referred: boolean): "Direct" | "Introduction" {
  return referred ? "Introduction" : "Direct";
}

export function reachedStage(
  events: readonly { applicationId: string; toStage: string }[],
  current: readonly { id: string; stage: string }[],
  stage: string,
): number {
  const ids = new Set<string>();
  for (const event of events) {
    if (event.toStage === stage && event.applicationId) ids.add(event.applicationId);
  }
  for (const row of current) {
    if (row.stage === stage && row.id) ids.add(row.id);
  }
  return ids.size;
}
