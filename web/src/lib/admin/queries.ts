import { mergeDraft } from "@/lib/application";
import {
  COMMAND_METRICS,
  isUuid,
  matchesSearch,
  nairobiDayStart,
  nairobiNextDay,
  formatMean,
  sortPipelineRows,
  type CommandKey,
  type PipelineQuery,
  type PipelineRow,
} from "@/lib/admin/pipeline";
import {
  activitySummary,
  applicationSections,
  decisionLabel,
  evidenceLines,
  fileName,
  formatBytes,
  safeHttp,
  type Line,
} from "@/lib/admin/present";
import { experimentTypeLabel, outcomeLabel, weightedMean, type DimensionRow } from "@/lib/admin/viability";
import { STAFF_ROLES } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

type Db = Awaited<ReturnType<typeof createClient>>;

export type LiveVenture = {
  id: string;
  name: string;
  website: string | null;
};

export type CommandCentre =
  | { status: "offline" }
  | { status: "error" }
  | { status: "ready"; counts: Record<CommandKey, number>; live: LiveVenture[] };

export type StaffOption = {
  id: string;
  name: string;
  role: string;
};

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

export type ScoreLine = {
  category: string;
  label: string;
  score: number;
  weight: number;
  note: string | null;
};

export type AssessmentView = {
  id: string;
  version: number;
  at: string;
  notes: string | null;
  mean: string;
  scores: ScoreLine[];
};

export type ExperimentView = {
  id: string;
  title: string;
  method: string | null;
  at: string;
  lines: Line[];
  results: { id: string; summary: string | null; at: string; evidence: Line[] }[];
};

export type CommitteeView = {
  id: string;
  code: string;
  decision: string;
  at: string;
  shared: Line[];
  internal: Line[];
};

export type ApplicationFile = {
  id: string;
  reference: string | null;
  idea: string;
  oneLiner: string;
  founder: string;
  stage: string;
  analystId: string | null;
  analyst: string;
  country: string;
  sector: string;
  submittedAt: string | null;
  lastActivityAt: string | null;
  sections: { title: string; lines: Line[] }[];
  evidence: Line[];
  dimensions: DimensionRow[];
  assessments: AssessmentView[];
  experiments: ExperimentView[];
  decisions: CommitteeView[];
  ventureId: string | null;
  documents: { id: string; name: string; mime: string | null; size: string; at: string }[];
  messages: { id: string; sender: string; body: string; at: string }[];
  notes: { id: string; author: string; body: string; at: string }[];
  history: { id: string; from: string; to: string; actor: string; at: string }[];
  activity: { id: string; summary: string; actor: string; at: string }[];
  staff: StaffOption[];
};

export type DetailResult =
  | { status: "offline" }
  | { status: "error" }
  | { status: "missing" }
  | { status: "ready"; application: ApplicationFile };

const FETCH_CAP = 500;
const DISPLAY_CAP = 200;

function records(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Record<string, unknown> => {
    return item !== null && typeof item === "object" && !Array.isArray(item);
  });
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function whole(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function amount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function metadata(value: unknown): Record<string, string | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry == null) out[key] = null;
    else if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

function evidenceFields(value: unknown): Line[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const lines: Line[] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && entry.trim()) lines.push({ label: key, value: entry.trim() });
    else if (typeof entry === "number" && Number.isFinite(entry)) lines.push({ label: key, value: String(entry) });
    if (lines.length >= 12) break;
  }
  return lines;
}

function uniqueTexts(rows: Record<string, unknown>[], key: string): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const value = text(row[key]);
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function founderName(profile: string | undefined, draftName: string): string {
  if (profile && profile !== "Unnamed") return profile;
  if (draftName.trim()) return draftName.trim();
  return profile ?? "Founder";
}

async function namesFor(supabase: Db, ids: readonly string[]): Promise<Map<string, string> | null> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", unique);
  if (error) return null;
  for (const row of records(data)) {
    const id = text(row.id);
    if (!id) continue;
    map.set(id, text(row.full_name) ?? "Unnamed");
  }
  return map;
}

async function loadStaff(supabase: Db): Promise<StaffOption[] | null> {
  const { data, error } = await supabase.from("user_roles").select("user_id, role").in("role", [...STAFF_ROLES]);
  if (error) return null;
  const roleRows = records(data);
  const names = await namesFor(
    supabase,
    roleRows.flatMap((row) => {
      const id = text(row.user_id);
      return id ? [id] : [];
    }),
  );
  if (!names) return null;
  const staff = roleRows.flatMap((row) => {
    const id = text(row.user_id);
    const role = text(row.role);
    if (!id || !role) return [];
    return [{ id, role, name: names.get(id) ?? "Unnamed" }];
  });
  staff.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  return staff;
}

function hasStage(
  metric: (typeof COMMAND_METRICS)[number],
): metric is (typeof COMMAND_METRICS)[number] & { stage: string } {
  return metric.stage !== null;
}

export async function loadLiveVentures(): Promise<
  | { status: "offline" }
  | { status: "error" }
  | { status: "ready"; count: number; ventures: LiveVenture[] }
> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("ventures")
    .select("id", { count: "exact", head: true })
    .eq("status", "LIVE")
    .eq("is_demo", false);
  if (error || count == null) return { status: "error" };

  const { data, error: listError } = await supabase
    .from("ventures")
    .select("id, name, website")
    .eq("status", "LIVE")
    .eq("is_demo", false)
    .order("name")
    .limit(12);
  if (listError) return { status: "error" };

  return {
    status: "ready",
    count,
    ventures: records(data).flatMap((row) => {
      const id = text(row.id);
      const name = text(row.name);
      if (!id || !name) return [];
      return [{ id, name, website: safeHttp(text(row.website)) }];
    }),
  };
}

export async function loadDimensionCatalog(): Promise<
  | { status: "offline" }
  | { status: "error" }
  | { status: "ready"; dimensions: DimensionRow[] }
> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("viability_dimensions").select("key, label, category, weight");
  if (error) return { status: "error" };
  return {
    status: "ready",
    dimensions: records(data).flatMap((row) => {
      const key = text(row.key);
      if (!key) return [];
      return [
        {
          key,
          label: text(row.label) ?? key,
          category: text(row.category) ?? "Assessment",
          weight: amount(row.weight) ?? 1,
        },
      ];
    }),
  };
}

export async function loadCommandCentre(): Promise<CommandCentre> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();

  const stageResults = await Promise.all(
    COMMAND_METRICS.filter(hasStage).map(async (metric) => {
      const { count, error } = await supabase
        .from("idea_applications")
        .select("id", { count: "exact", head: true })
        .eq("stage", metric.stage);
      return { key: metric.key, count: error || count == null ? null : count };
    }),
  );
  if (stageResults.some((item) => item.count == null)) return { status: "error" };

  const live = await loadLiveVentures();
  if (live.status !== "ready") return { status: live.status };

  const counts: Record<CommandKey, number> = {
    submitted: 0,
    screening: 0,
    interview: 0,
    validation: 0,
    committee: 0,
    structuring: 0,
    building: 0,
    live_ventures: live.count,
  };
  for (const item of stageResults) {
    if (item.count != null) counts[item.key] = item.count;
  }

  return { status: "ready", counts, live: live.ventures };
}

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

export async function loadApplicationDetail(id: string): Promise<DetailResult> {
  if (!isUuid(id)) return { status: "missing" };
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("idea_applications")
    .select("id, user_id, reference, payload, stage, country, industry, assigned_analyst, submitted_at, last_activity_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return { status: "error" };
  if (!data) return { status: "missing" };
  const row = data as Record<string, unknown>;
  const applicationId = text(row.id);
  if (!applicationId) return { status: "missing" };

  const [documents, messages, notes, history, activity, assessments, experiments, decisions, staff] =
    await Promise.all([
      supabase
        .from("application_documents")
        .select("id, path, mime_type, byte_size, created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("id, sender, body, created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_notes")
        .select("id, body, created_by, created_at")
        .eq("entity", "idea_application")
        .eq("entity_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("application_status_history")
        .select("id, from_stage, to_stage, actor, created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_logs")
        .select("id, actor, action, metadata, created_at")
        .eq("entity", "idea_application")
        .eq("entity_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("viability_assessments")
        .select("id, version, notes, created_at")
        .eq("application_id", applicationId)
        .order("version", { ascending: false }),
      supabase
        .from("validation_experiments")
        .select("id, title, method, created_at, experiment_type, hypothesis, target, starts_on, ends_on, success_criteria, cost_note, conclusion, outcome")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("committee_decisions")
        .select("id, decision, reason, committee_notes, conditions, next_steps, review_date, founder_feedback, commercial_notes, technology_notes, created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      loadStaff(supabase),
    ]);

  if (
    documents.error ||
    messages.error ||
    notes.error ||
    history.error ||
    activity.error ||
    assessments.error ||
    experiments.error ||
    decisions.error ||
    !staff
  ) {
    return { status: "error" };
  }

  const assessmentRows = records(assessments.data);
  const experimentRows = records(experiments.data);
  const activityRows = records(activity.data);
  const assessmentIds = assessmentRows.flatMap((item) => {
    const itemId = text(item.id);
    return itemId ? [itemId] : [];
  });
  const experimentIds = experimentRows.flatMap((item) => {
    const itemId = text(item.id);
    return itemId ? [itemId] : [];
  });

  const decisionIds = records(decisions.data).flatMap((item) => {
    const itemId = text(item.id);
    return itemId ? [itemId] : [];
  });
  const [scoreResult, resultRows, dimensionResult, memberResult, ventureResult] = await Promise.all([
    assessmentIds.length
      ? supabase.from("assessment_scores").select("assessment_id, dimension, score, analyst_note").in("assessment_id", assessmentIds)
      : Promise.resolve({ data: [], error: null }),
    experimentIds.length
      ? supabase.from("validation_results").select("id, experiment_id, summary, evidence, created_at").in("experiment_id", experimentIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("viability_dimensions").select("key, label, category, weight").order("category"),
    decisionIds.length
      ? supabase.from("committee_decision_members").select("decision_id, user_id").in("decision_id", decisionIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("ventures").select("id").eq("application_id", applicationId).maybeSingle(),
  ]);
  if (scoreResult.error || resultRows.error || dimensionResult.error || memberResult.error || ventureResult.error) {
    return { status: "error" };
  }

  const people = new Set<string>();
  const userId = text(row.user_id);
  const analystId = text(row.assigned_analyst);
  if (userId) people.add(userId);
  if (analystId) people.add(analystId);
  for (const item of records(messages.data)) {
    const sender = text(item.sender);
    if (sender) people.add(sender);
  }
  for (const item of records(notes.data)) {
    const author = text(item.created_by);
    if (author) people.add(author);
  }
  for (const item of records(history.data)) {
    const actor = text(item.actor);
    if (actor) people.add(actor);
  }
  for (const item of activityRows) {
    const actor = text(item.actor);
    if (actor) people.add(actor);
    const meta = metadata(item.metadata);
    if (meta.from_analyst) people.add(meta.from_analyst);
    if (meta.to_analyst) people.add(meta.to_analyst);
  }
  const membersByDecision = new Map<string, string[]>();
  for (const item of records(memberResult.data)) {
    const decisionId = text(item.decision_id);
    const memberId = text(item.user_id);
    if (!decisionId || !memberId) continue;
    people.add(memberId);
    const list = membersByDecision.get(decisionId) ?? [];
    list.push(memberId);
    membersByDecision.set(decisionId, list);
  }
  const names = await namesFor(supabase, [...people]);
  if (!names) return { status: "error" };

  const draft = mergeDraft(row.payload);
  const dimensions = new Map<string, { label: string; category: string; weight: number }>();
  const dimensionRows: DimensionRow[] = [];
  for (const item of records(dimensionResult.data)) {
    const key = text(item.key);
    if (!key) continue;
    const row = {
      key,
      label: text(item.label) ?? key,
      category: text(item.category) ?? "Assessment",
      weight: amount(item.weight) ?? 1,
    };
    dimensions.set(key, row);
    dimensionRows.push(row);
  }
  const scoresByAssessment = new Map<string, ScoreLine[]>();
  for (const item of records(scoreResult.data)) {
    const assessmentId = text(item.assessment_id);
    const score = whole(item.score);
    const dimension = text(item.dimension);
    if (!assessmentId || score == null || !dimension) continue;
    const known = dimensions.get(dimension);
    const list = scoresByAssessment.get(assessmentId) ?? [];
    list.push({
      category: known?.category ?? "Assessment",
      label: known?.label ?? dimension,
      score,
      weight: known?.weight ?? 1,
      note: text(item.analyst_note),
    });
    scoresByAssessment.set(assessmentId, list);
  }

  const resultsByExperiment = new Map<string, ExperimentView["results"]>();
  for (const item of records(resultRows.data)) {
    const experimentId = text(item.experiment_id);
    const resultId = text(item.id);
    if (!experimentId || !resultId) continue;
    const list = resultsByExperiment.get(experimentId) ?? [];
    list.push({
      id: resultId,
      summary: text(item.summary),
      at: text(item.created_at) ?? "",
      evidence: evidenceFields(item.evidence),
    });
    resultsByExperiment.set(experimentId, list);
  }

  const actorName = (actorId: string | null) => (actorId ? (names.get(actorId) ?? "Unknown") : "Pesara");
  const ventureRecord = ventureResult.data;
  const ventureId =
    ventureRecord && typeof ventureRecord === "object" && !Array.isArray(ventureRecord)
      ? text((ventureRecord as Record<string, unknown>).id)
      : null;

  return {
    status: "ready",
    application: {
      id: applicationId,
      reference: text(row.reference),
      idea: draft.ideaName.trim() || "Untitled idea",
      oneLiner: draft.oneLiner.trim(),
      founder: founderName(userId ? names.get(userId) : undefined, draft.fullName),
      stage: text(row.stage) ?? "",
      analystId,
      analyst: analystId ? (names.get(analystId) ?? "Unnamed") : "Unassigned",
      country: text(row.country) ?? draft.country.trim(),
      sector: text(row.industry) ?? "",
      submittedAt: text(row.submitted_at),
      lastActivityAt: text(row.last_activity_at),
      sections: applicationSections(draft),
      evidence: evidenceLines(draft),
      dimensions: dimensionRows,
      assessments: assessmentRows.flatMap((item) => {
        const itemId = text(item.id);
        const version = whole(item.version);
        if (!itemId || version == null) return [];
        const scores = scoresByAssessment.get(itemId) ?? [];
        return [
          {
            id: itemId,
            version,
            at: text(item.created_at) ?? "",
            notes: text(item.notes),
            mean: formatMean(weightedMean(scores)),
            scores,
          },
        ];
      }),
      experiments: experimentRows.flatMap((item) => {
        const itemId = text(item.id);
        const title = text(item.title);
        if (!itemId || !title) return [];
        const lines: Line[] = [];
        const experimentType = text(item.experiment_type);
        const hypothesis = text(item.hypothesis);
        const target = text(item.target);
        const success = text(item.success_criteria);
        const cost = text(item.cost_note);
        const conclusion = text(item.conclusion);
        const outcome = text(item.outcome);
        if (experimentType) lines.push({ label: "Type", value: experimentTypeLabel(experimentType) });
        if (hypothesis) lines.push({ label: "Hypothesis", value: hypothesis });
        if (target) lines.push({ label: "Target", value: target });
        if (text(item.starts_on)) lines.push({ label: "Start", value: text(item.starts_on) ?? "" });
        if (text(item.ends_on)) lines.push({ label: "End", value: text(item.ends_on) ?? "" });
        if (success) lines.push({ label: "Success criteria", value: success });
        if (cost) lines.push({ label: "Cost", value: cost });
        if (conclusion) lines.push({ label: "Conclusion", value: conclusion });
        if (outcome) lines.push({ label: "Outcome", value: outcomeLabel(outcome) });
        return [
          {
            id: itemId,
            title,
            method: text(item.method),
            at: text(item.created_at) ?? "",
            lines,
            results: resultsByExperiment.get(itemId) ?? [],
          },
        ];
      }),
      decisions: records(decisions.data).flatMap((item) => {
        const itemId = text(item.id);
        const decision = text(item.decision);
        if (!itemId || !decision) return [];
        const shared: Line[] = [];
        const internal: Line[] = [];
        const feedback = text(item.founder_feedback);
        const steps = text(item.next_steps);
        const review = text(item.review_date);
        const reason = text(item.reason);
        const notesText = text(item.committee_notes);
        const conditions = text(item.conditions);
        if (feedback) shared.push({ label: "Founder feedback", value: feedback });
        if (steps) shared.push({ label: "Next steps", value: steps });
        if (review) shared.push({ label: "Review date", value: review });
        const commercial = text(item.commercial_notes);
        const technology = text(item.technology_notes);
        const memberNames = (membersByDecision.get(itemId) ?? []).map((memberId) => names.get(memberId) ?? "Unknown");
        if (reason) internal.push({ label: "Rationale", value: reason });
        if (notesText) internal.push({ label: "Committee notes", value: notesText });
        if (conditions) internal.push({ label: "Conditions", value: conditions });
        if (commercial) internal.push({ label: "Commercial considerations", value: commercial });
        if (technology) internal.push({ label: "Technology considerations", value: technology });
        if (memberNames.length) internal.push({ label: "Committee members", value: memberNames.join(", ") });
        return [{ id: itemId, code: decision, decision: decisionLabel(decision), at: text(item.created_at) ?? "", shared, internal }];
      }),
      ventureId,
      documents: records(documents.data).flatMap((item) => {
        const itemId = text(item.id);
        const path = text(item.path);
        if (!itemId || !path) return [];
        return [
          {
            id: itemId,
            name: fileName(path),
            mime: text(item.mime_type),
            size: formatBytes(whole(item.byte_size)),
            at: text(item.created_at) ?? "",
          },
        ];
      }),
      messages: records(messages.data).flatMap((item) => {
        const itemId = text(item.id);
        const body = text(item.body);
        if (!itemId || !body) return [];
        return [
          {
            id: itemId,
            sender: actorName(text(item.sender)),
            body,
            at: text(item.created_at) ?? "",
          },
        ];
      }),
      notes: records(notes.data).flatMap((item) => {
        const itemId = text(item.id);
        const body = text(item.body);
        if (!itemId || !body) return [];
        return [
          {
            id: itemId,
            author: actorName(text(item.created_by)),
            body,
            at: text(item.created_at) ?? "",
          },
        ];
      }),
      history: records(history.data).flatMap((item) => {
        const itemId = text(item.id);
        const to = text(item.to_stage);
        if (!itemId || !to) return [];
        return [
          {
            id: itemId,
            from: text(item.from_stage) ?? "",
            to,
            actor: actorName(text(item.actor)),
            at: text(item.created_at) ?? "",
          },
        ];
      }),
      activity: activityRows.flatMap((item) => {
        const itemId = text(item.id);
        const action = text(item.action);
        if (!itemId || !action) return [];
        return [
          {
            id: itemId,
            summary: activitySummary(action, metadata(item.metadata), names),
            actor: actorName(text(item.actor)),
            at: text(item.created_at) ?? "",
          },
        ];
      }),
      staff,
    },
  };
}
