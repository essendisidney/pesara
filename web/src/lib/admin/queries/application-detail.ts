import { mergeDraft } from "@/lib/application";
import { formatMean, isUuid } from "@/lib/admin/pipeline";
import {
  activitySummary,
  applicationSections,
  decisionLabel,
  evidenceLines,
  formatBytes,
  type Line,
} from "@/lib/admin/present";
import { experimentTypeLabel, outcomeLabel, weightedMean, type DimensionRow } from "@/lib/admin/viability";
import { attachedDocument, documentDisplayName } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";
import {
  amount,
  evidenceFields,
  founderName,
  loadStaff,
  metadata,
  namesFor,
  records,
  text,
  whole,
  type StaffOption,
} from "./shared";

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
  open: boolean;
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
  documents: { id: string; name: string; mime: string | null; size: string; at: string; kind: string | null }[];
  documentRequests: { id: string; kind: string; note: string | null; at: string }[];
  threads: { id: string; subject: string }[];
  messages: { id: string; sender: string; body: string; at: string; read: boolean; attachment: { id: string; name: string } | null }[];
  notes: { id: string; author: string; body: string; at: string }[];
  history: { id: string; from: string; to: string; actor: string; at: string }[];
  activity: { id: string; summary: string; actor: string; at: string }[];
  team: { id: string; name: string; role: string }[];
  staff: StaffOption[];
};

export type DetailResult =
  | { status: "offline" }
  | { status: "error" }
  | { status: "missing" }
  | { status: "ready"; application: ApplicationFile };

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

  const [documents, documentRequests, messages, notes, history, activity, assessments, experiments, decisions, staff, threads, team] =
    await Promise.all([
      supabase
        .from("application_documents")
        .select("id, path, mime_type, byte_size, created_at, kind, title")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("document_requests")
        .select("id, kind, note, created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("id, sender, body, created_at, read_at, document_id")
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
      supabase
        .from("message_threads")
        .select("id, subject")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("application_team_members")
        .select("id, full_name, role")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true }),
    ]);

  if (
    documents.error ||
    documentRequests.error ||
    messages.error ||
    notes.error ||
    history.error ||
    activity.error ||
    assessments.error ||
    experiments.error ||
    decisions.error ||
    !staff ||
    threads.error ||
    team.error
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

  const documentNames = new Map(
    records(documents.data).flatMap((item) => {
      const itemId = text(item.id);
      const path = text(item.path);
      if (!itemId || !path) return [];
      return [[itemId, documentDisplayName(text(item.title), path)] as const];
    }),
  );
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
            open: !outcome,
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
            name: documentDisplayName(text(item.title), path),
            mime: text(item.mime_type),
            size: formatBytes(whole(item.byte_size)),
            at: text(item.created_at) ?? "",
            kind: text(item.kind),
          },
        ];
      }),
      documentRequests: records(documentRequests.data).flatMap((item) => {
        const itemId = text(item.id);
        const kind = text(item.kind);
        if (!itemId || !kind) return [];
        return [{ id: itemId, kind, note: text(item.note), at: text(item.created_at) ?? "" }];
      }),
      threads: records(threads.data).flatMap((item) => {
        const itemId = text(item.id);
        const subject = text(item.subject);
        if (!itemId || !subject) return [];
        return [{ id: itemId, subject }];
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
            read: Boolean(text(item.read_at)),
            attachment: attachedDocument(text(item.document_id), documentNames),
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
      team: records(team.data).flatMap((item) => {
        const itemId = text(item.id);
        const name = text(item.full_name);
        if (!itemId || !name) return [];
        return [{ id: itemId, name, role: text(item.role) ?? "" }];
      }),
      staff,
    },
  };
}
