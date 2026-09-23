import { FOUNDER_TRACK } from "@/lib/applications/stages";

export const COMMAND_METRICS = [
  { key: "submitted", label: "New Applications", stage: "submitted" },
  { key: "screening", label: "Screening", stage: "screening" },
  { key: "interview", label: "Founder Interviews", stage: "interview" },
  { key: "validation", label: "Validation", stage: "validation" },
  { key: "committee", label: "Committee Review", stage: "committee" },
  { key: "structuring", label: "Accepted", stage: "structuring" },
  { key: "building", label: "Building", stage: "building" },
  { key: "live_ventures", label: "Live Ventures", stage: null },
] as const;

export type CommandKey = (typeof COMMAND_METRICS)[number]["key"];

export const STAFF_STAGES = [
  "submitted",
  "screening",
  "interview",
  "validation",
  "committee",
  "structuring",
  "building",
  "live",
  "parked",
  "declined",
  "withdrawn",
] as const;

export type StaffStage = (typeof STAFF_STAGES)[number];

export const FILTER_STAGES = ["draft", ...STAFF_STAGES] as const;

const STAGE_LABELS: Record<string, string> = {
  draft: "Draft",
  parked: "Parked",
  declined: "Declined",
  withdrawn: "Withdrawn",
  ...Object.fromEntries(FOUNDER_TRACK.map((step) => [step.key, step.label])),
};

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? "Unknown stage";
}

export function isStaffStage(stage: string): stage is StaffStage {
  return (STAFF_STAGES as readonly string[]).includes(stage);
}

export function assessmentLabel(scores: readonly number[]): string {
  const clean = scores.filter((score) => Number.isFinite(score));
  if (clean.length === 0) return "Not assessed";
  const mean = clean.reduce((sum, score) => sum + score, 0) / clean.length;
  return `${mean.toFixed(1)} / 5`;
}

export function assessmentMean(scores: readonly number[]): number | null {
  const clean = scores.filter((score) => Number.isFinite(score));
  if (clean.length === 0) return null;
  return clean.reduce((sum, score) => sum + score, 0) / clean.length;
}

export function formatMean(mean: number | null): string {
  if (mean == null || !Number.isFinite(mean)) return "Not assessed";
  return `${mean.toFixed(1)} / 5`;
}

export const SORT_KEYS = [
  "reference",
  "idea",
  "founder",
  "country",
  "sector",
  "submitted",
  "stage",
  "analyst",
  "assessment",
  "activity",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export type PipelineQuery = {
  stage: string;
  sector: string;
  country: string;
  analyst: string;
  from: string;
  to: string;
  q: string;
  sort: SortKey;
  dir: "asc" | "desc";
};

export type PipelineRow = {
  id: string;
  reference: string;
  idea: string;
  founder: string;
  country: string;
  sector: string;
  submittedAt: string | null;
  stage: string;
  analyst: string;
  assessmentMean: number | null;
  lastActivityAt: string | null;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
}

function bounded(value: string, max: number): string {
  return value.slice(0, max);
}

export function nairobiDayStart(day: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const utc = new Date(`${day}T00:00:00+03:00`);
  if (Number.isNaN(utc.getTime())) return null;
  const back = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(utc);
  if (back !== day) return null;
  return utc.toISOString();
}

export function nairobiNextDay(day: string): string | null {
  const start = nairobiDayStart(day);
  if (!start) return null;
  return new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000).toISOString();
}

export function parsePipelineQuery(
  input: Record<string, string | string[] | undefined>,
): PipelineQuery {
  const stage = first(input.stage);
  const analyst = first(input.analyst);
  const sort = first(input.sort);
  const dir = first(input.dir);
  const from = first(input.from);
  const to = first(input.to);
  return {
    stage: (FILTER_STAGES as readonly string[]).includes(stage) ? stage : "",
    sector: bounded(first(input.sector), 80),
    country: bounded(first(input.country), 80),
    analyst: analyst === "unassigned" || isUuid(analyst) ? analyst : "",
    from: nairobiDayStart(from) ? from : "",
    to: nairobiDayStart(to) ? to : "",
    q: bounded(first(input.q), 80),
    sort: (SORT_KEYS as readonly string[]).includes(sort) ? (sort as SortKey) : "submitted",
    dir: dir === "asc" || dir === "desc" ? dir : "desc",
  };
}

export function pipelineHref(query: PipelineQuery, patch: Partial<PipelineQuery> = {}): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.stage) params.set("stage", next.stage);
  if (next.sector) params.set("sector", next.sector);
  if (next.country) params.set("country", next.country);
  if (next.analyst) params.set("analyst", next.analyst);
  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.q) params.set("q", next.q);
  if (next.sort !== "submitted") params.set("sort", next.sort);
  if (next.dir !== "desc") params.set("dir", next.dir);
  const qs = params.toString();
  return qs ? `/admin/applications?${qs}` : "/admin/applications";
}

export function filtersActive(query: PipelineQuery): boolean {
  return Boolean(
    query.stage || query.sector || query.country || query.analyst || query.from || query.to || query.q,
  );
}

export function matchesSearch(
  row: Pick<PipelineRow, "reference" | "idea" | "founder" | "country" | "sector">,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [row.reference, row.idea, row.founder, row.country, row.sector].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

function stageOrder(stage: string): number {
  const index = FILTER_STAGES.indexOf(stage as (typeof FILTER_STAGES)[number]);
  return index === -1 ? FILTER_STAGES.length : index;
}

function sortValue(row: PipelineRow, sort: SortKey): { missing: boolean; text: string; num: number | null } {
  switch (sort) {
    case "reference":
      return { missing: !row.reference, text: row.reference, num: null };
    case "idea":
      return { missing: false, text: row.idea, num: null };
    case "founder":
      return { missing: false, text: row.founder, num: null };
    case "country":
      return { missing: !row.country, text: row.country, num: null };
    case "sector":
      return { missing: !row.sector, text: row.sector, num: null };
    case "submitted":
      return { missing: !row.submittedAt, text: row.submittedAt ?? "", num: null };
    case "stage":
      return { missing: false, text: "", num: stageOrder(row.stage) };
    case "analyst":
      return { missing: false, text: row.analyst, num: null };
    case "assessment":
      return {
        missing: row.assessmentMean == null,
        text: "",
        num: row.assessmentMean,
      };
    case "activity":
      return { missing: !row.lastActivityAt, text: row.lastActivityAt ?? "", num: null };
  }
}

export function sortPipelineRows(rows: readonly PipelineRow[], sort: SortKey, dir: "asc" | "desc"): PipelineRow[] {
  const copy = [...rows];
  copy.sort((left, right) => {
    const a = sortValue(left, sort);
    const b = sortValue(right, sort);
    if (a.missing && b.missing) return 0;
    if (a.missing) return 1;
    if (b.missing) return -1;
    const cmp =
      a.num != null && b.num != null
        ? a.num - b.num
        : a.text.localeCompare(b.text, "en", { sensitivity: "base", numeric: true });
    return dir === "asc" ? cmp : -cmp;
  });
  return copy;
}

export function nextSortDir(query: PipelineQuery, column: SortKey): "asc" | "desc" {
  if (query.sort !== column) {
    return column === "submitted" || column === "activity" || column === "assessment" ? "desc" : "asc";
  }
  return query.dir === "asc" ? "desc" : "asc";
}

export const DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "application", label: "Application" },
  { key: "evidence", label: "Evidence" },
  { key: "assessment", label: "Assessment" },
  { key: "validation", label: "Validation" },
  { key: "committee", label: "Committee" },
  { key: "documents", label: "Documents" },
  { key: "messages", label: "Messages" },
  { key: "activity", label: "Activity" },
] as const;

export type DetailTab = (typeof DETAIL_TABS)[number]["key"];

export function parseDetailTab(value: string | string[] | undefined): DetailTab {
  const raw = first(value);
  const found = DETAIL_TABS.find((tab) => tab.key === raw);
  return found ? found.key : "overview";
}

export const PAGE_NOTICES: Record<string, string> = {
  assigned: "Analyst updated.",
  stage: "Stage updated.",
  note: "Internal note saved.",
  assessment: "Assessment saved.",
  experiment: "Validation experiment saved.",
  committee: "Committee decision recorded.",
  weights: "Dimension weights saved.",
};

export const PAGE_ERRORS: Record<string, string> = {
  invalid: "That change was not accepted.",
  failed: "The change could not be saved.",
};

export function knownMessage(map: Record<string, string>, value: string | string[] | undefined): string | null {
  const raw = first(value);
  return map[raw] ?? null;
}
