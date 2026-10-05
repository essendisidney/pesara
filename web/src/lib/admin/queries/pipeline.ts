import { mergeDraft } from "@/lib/application";
import {
  matchesSearch,
  nairobiDayStart,
  nairobiNextDay,
  sortPipelineRows,
  type PipelineQuery,
  type PipelineRow,
} from "@/lib/admin/pipeline";
import { weightedMean } from "@/lib/admin/viability";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";
import {
  amount,
  founderName,
  loadStaff,
  namesFor,
  records,
  text,
  uniqueTexts,
  whole,
  type Db,
  type StaffOption,
} from "./shared";

export type PipelineResult =
  | { status: "offline" }
  | { status: "error" }
  | {
      status: "ready";
      rows: PipelineRow[];
      matched: number;
      limited: boolean;
      sectors: string[];
      countries: string[];
      analysts: StaffOption[];
    };

const FETCH_CAP = 500;
const DISPLAY_CAP = 200;

async function latestScores(
  supabase: Db,
  applicationIds: readonly string[],
): Promise<Map<string, number | null> | null> {
  const means = new Map<string, number | null>();
  if (applicationIds.length === 0) return means;
  const [{ data: assessmentRows, error: assessmentError }, dimensionResult] = await Promise.all([
    supabase.from("viability_assessments").select("id, application_id, version").in("application_id", [...applicationIds]),
    supabase.from("viability_dimensions").select("key, weight"),
  ]);
  if (assessmentError || dimensionResult.error) return null;

  const weights = new Map<string, number>();
  for (const row of records(dimensionResult.data)) {
    const key = text(row.key);
    const weight = amount(row.weight);
    if (key && weight != null && weight > 0) weights.set(key, weight);
  }

  const latest = new Map<string, { id: string; version: number }>();
  for (const row of records(assessmentRows)) {
    const id = text(row.id);
    const applicationId = text(row.application_id);
    const version = whole(row.version);
    if (!id || !applicationId || version == null) continue;
    const current = latest.get(applicationId);
    if (!current || version >= current.version) latest.set(applicationId, { id, version });
  }

  const assessmentIds = [...latest.values()].map((item) => item.id);
  if (assessmentIds.length === 0) return means;
  const { data: scoreRows, error: scoreError } = await supabase
    .from("assessment_scores")
    .select("assessment_id, dimension, score")
    .in("assessment_id", assessmentIds);
  if (scoreError) return null;

  const byAssessment = new Map<string, { score: number; weight: number }[]>();
  for (const row of records(scoreRows)) {
    const assessmentId = text(row.assessment_id);
    const score = whole(row.score);
    const dimension = text(row.dimension);
    if (!assessmentId || score == null || !dimension) continue;
    const list = byAssessment.get(assessmentId) ?? [];
    list.push({ score, weight: weights.get(dimension) ?? 1 });
    byAssessment.set(assessmentId, list);
  }
  for (const [applicationId, assessment] of latest) {
    means.set(applicationId, weightedMean(byAssessment.get(assessment.id) ?? []));
  }
  return means;
}

export async function loadPipeline(query: PipelineQuery): Promise<PipelineResult> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();

  let request = supabase
    .from("idea_applications")
    .select("id, user_id, reference, payload, stage, country, industry, assigned_analyst, submitted_at, last_activity_at")
    .order("last_activity_at", { ascending: false })
    .limit(FETCH_CAP);

  request = query.stage ? request.eq("stage", query.stage) : request.neq("stage", "draft");
  if (query.sector) request = request.eq("industry", query.sector);
  if (query.country) request = request.eq("country", query.country);
  if (query.analyst === "unassigned") request = request.is("assigned_analyst", null);
  else if (query.analyst) request = request.eq("assigned_analyst", query.analyst);
  const from = query.from ? nairobiDayStart(query.from) : null;
  const to = query.to ? nairobiNextDay(query.to) : null;
  if (from) request = request.gte("submitted_at", from);
  if (to) request = request.lt("submitted_at", to);

  const [{ data, error }, optionResult, staff] = await Promise.all([
    request,
    supabase.from("idea_applications").select("industry, country").limit(1000),
    loadStaff(supabase),
  ]);
  if (error || optionResult.error || !staff) return { status: "error" };

  const source = records(data);
  const names = await namesFor(
    supabase,
    source.flatMap((row) => {
      const ids = [text(row.user_id), text(row.assigned_analyst)];
      return ids.filter((id): id is string => Boolean(id));
    }),
  );
  if (!names) return { status: "error" };

  const scores = await latestScores(
    supabase,
    source.flatMap((row) => {
      const id = text(row.id);
      return id ? [id] : [];
    }),
  );
  if (!scores) return { status: "error" };

  const built = source.flatMap((row) => {
    const id = text(row.id);
    if (!id) return [];
    const draft = mergeDraft(row.payload);
    const userId = text(row.user_id);
    const analystId = text(row.assigned_analyst);
    const pipelineRow: PipelineRow = {
      id,
      reference: text(row.reference) ?? "",
      idea: draft.ideaName.trim() || "Untitled idea",
      founder: founderName(userId ? names.get(userId) : undefined, draft.fullName),
      country: text(row.country) ?? draft.country.trim(),
      sector: text(row.industry) ?? "",
      submittedAt: text(row.submitted_at),
      stage: text(row.stage) ?? "",
      analyst: analystId ? (names.get(analystId) ?? "Unnamed") : "Unassigned",
      assessmentMean: scores.get(id) ?? null,
      lastActivityAt: text(row.last_activity_at),
    };
    return [pipelineRow];
  });

  const matched = built.filter((row) => matchesSearch(row, query.q));
  const sorted = sortPipelineRows(matched, query.sort, query.dir);

  return {
    status: "ready",
    rows: sorted.slice(0, DISPLAY_CAP),
    matched: matched.length,
    limited: source.length >= FETCH_CAP,
    sectors: uniqueTexts(records(optionResult.data), "industry"),
    countries: uniqueTexts(records(optionResult.data), "country"),
    analysts: staff,
  };
}
