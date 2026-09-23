import { safeHttp } from "@/lib/admin/present";
import { isUuid } from "@/lib/admin/pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type VentureListItem = {
  id: string;
  name: string;
  status: string;
  stage: string | null;
  country: string | null;
  sector: string | null;
  relationship: string;
  website: string | null;
  published: boolean;
};

export type VentureWorkspace = {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  country: string | null;
  stage: string | null;
  status: string;
  relationship: string;
  website: string | null;
  createdAt: string | null;
  published: boolean;
  commercialKind: string | null;
  pesaraContribution: string | null;
  founderContribution: string | null;
  commercialTerms: string | null;
  revenueShare: string | null;
  equityInterest: string | null;
  agreementDate: string | null;
  agreementDocument: string | null;
  technologyNotes: string | null;
  founders: { id: string; name: string }[];
  milestones: { id: string; title: string; dueOn: string | null; completedAt: string | null }[];
  kpis: { id: string; label: string; value: string; capturedOn: string | null }[];
  documents: { id: string; title: string; at: string }[];
  notes: { id: string; author: string; body: string; at: string }[];
};

type LoadResult<T> = { status: "offline" } | { status: "error" } | { status: "missing" } | { status: "ready"; value: T };

function records(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item));
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function amount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function fileTitle(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export async function loadVentureDirectory(): Promise<
  { status: "offline" } | { status: "error" } | { status: "ready"; count: number; ventures: VentureListItem[] }
> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const { count, error } = await supabase.from("ventures").select("id", { count: "exact", head: true });
  if (error || count == null) return { status: "error" };
  const { data, error: listError } = await supabase
    .from("ventures")
    .select("id, name, status, stage, country, industry, pesara_relationship, website, public_visible")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (listError) return { status: "error" };
  return {
    status: "ready",
    count,
    ventures: records(data).flatMap((row) => {
      const id = text(row.id);
      const name = text(row.name);
      const status = text(row.status);
      if (!id || !name || !status) return [];
      return [
        {
          id,
          name,
          status,
          stage: text(row.stage),
          country: text(row.country),
          sector: text(row.industry),
          relationship: text(row.pesara_relationship) ?? "none",
          website: safeHttp(text(row.website)),
          published: row.public_visible === true,
        },
      ];
    }),
  };
}

export async function loadVentureWorkspace(id: string): Promise<LoadResult<VentureWorkspace>> {
  if (!isUuid(id)) return { status: "missing" };
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ventures")
    .select(
      "id, name, description, industry, country, stage, website, status, pesara_relationship, public_visible, created_at, commercial_kind, pesara_contribution, founder_contribution, commercial_terms, revenue_share, equity_interest, agreement_date, agreement_document, technology_notes",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) return { status: "error" };
  if (!data) return { status: "missing" };
  const row = data as Record<string, unknown>;
  const ventureId = text(row.id);
  const name = text(row.name);
  const status = text(row.status);
  if (!ventureId || !name || !status) return { status: "error" };

  const [founders, milestones, metrics, documents, notes] = await Promise.all([
    supabase.from("venture_founders").select("id, full_name").eq("venture_id", ventureId),
    supabase.from("venture_milestones").select("id, title, due_on, completed_at").eq("venture_id", ventureId).order("created_at", { ascending: false }),
    supabase.from("venture_metrics").select("id, label").eq("venture_id", ventureId),
    supabase.from("venture_documents").select("id, path, title, created_at").eq("venture_id", ventureId).order("created_at", { ascending: false }),
    supabase.from("admin_notes").select("id, body, created_by, created_at").eq("entity", "venture").eq("entity_id", ventureId).order("created_at", { ascending: false }),
  ]);
  if (founders.error || milestones.error || metrics.error || documents.error || notes.error) return { status: "error" };

  const metricRows = records(metrics.data);
  const metricIds = metricRows.flatMap((item) => {
    const metricId = text(item.id);
    return metricId ? [metricId] : [];
  });
  const snapshots = metricIds.length
    ? await supabase.from("venture_metric_snapshots").select("metric_id, value_numeric, captured_on, created_at").in("metric_id", metricIds)
    : { data: [], error: null };
  if (snapshots.error) return { status: "error" };

  const people = records(notes.data).flatMap((item) => {
    const author = text(item.created_by);
    return author ? [author] : [];
  });
  const names = new Map<string, string>();
  if (people.length) {
    const profiles = await supabase.from("profiles").select("id, full_name").in("id", [...new Set(people)]);
    if (profiles.error) return { status: "error" };
    for (const profile of records(profiles.data)) {
      const profileId = text(profile.id);
      if (profileId) names.set(profileId, text(profile.full_name) ?? "Unnamed");
    }
  }

  const latest = new Map<string, { value: number; capturedOn: string | null; at: string }>();
  for (const item of records(snapshots.data)) {
    const metricId = text(item.metric_id);
    const value = amount(item.value_numeric);
    if (!metricId || value == null) continue;
    const at = text(item.created_at) ?? "";
    const current = latest.get(metricId);
    if (!current || at > current.at) latest.set(metricId, { value, capturedOn: text(item.captured_on), at });
  }

  return {
    status: "ready",
    value: {
      id: ventureId,
      name,
      description: text(row.description),
      sector: text(row.industry),
      country: text(row.country),
      stage: text(row.stage),
      status,
      relationship: text(row.pesara_relationship) ?? "none",
      website: safeHttp(text(row.website)),
      createdAt: text(row.created_at),
      published: row.public_visible === true,
      commercialKind: text(row.commercial_kind),
      pesaraContribution: text(row.pesara_contribution),
      founderContribution: text(row.founder_contribution),
      commercialTerms: text(row.commercial_terms),
      revenueShare: text(row.revenue_share),
      equityInterest: text(row.equity_interest),
      agreementDate: text(row.agreement_date),
      agreementDocument: text(row.agreement_document),
      technologyNotes: text(row.technology_notes),
      founders: records(founders.data).flatMap((item) => {
        const founderId = text(item.id);
        if (!founderId) return [];
        return [{ id: founderId, name: text(item.full_name) ?? "Founder" }];
      }),
      milestones: records(milestones.data).flatMap((item) => {
        const milestoneId = text(item.id);
        const title = text(item.title);
        if (!milestoneId || !title) return [];
        return [{ id: milestoneId, title, dueOn: text(item.due_on), completedAt: text(item.completed_at) }];
      }),
      kpis: metricRows.flatMap((item) => {
        const metricId = text(item.id);
        const label = text(item.label);
        const snapshot = metricId ? latest.get(metricId) : undefined;
        if (!metricId || !label || !snapshot) return [];
        return [{ id: metricId, label, value: String(snapshot.value), capturedOn: snapshot.capturedOn }];
      }),
      documents: records(documents.data).flatMap((item) => {
        const documentId = text(item.id);
        const path = text(item.path);
        if (!documentId || !path) return [];
        return [{ id: documentId, title: text(item.title) ?? fileTitle(path), at: text(item.created_at) ?? "" }];
      }),
      notes: records(notes.data).flatMap((item) => {
        const noteId = text(item.id);
        const body = text(item.body);
        if (!noteId || !body) return [];
        const authorId = text(item.created_by);
        return [{ id: noteId, author: authorId ? (names.get(authorId) ?? "Unknown") : "Pesara", body, at: text(item.created_at) ?? "" }];
      }),
    },
  };
}
