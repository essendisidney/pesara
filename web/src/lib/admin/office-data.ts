import { safeHttp } from "@/lib/admin/present";
import { acquisitionSource, completedStageDays, groupedCounts, medianDays, orderedCounts, reachedStage, type StageEvent } from "@/lib/admin/office";
import { FOUNDER_TRACK } from "@/lib/applications/stages";
import { isUuid, STAFF_STAGES, stageLabel } from "@/lib/admin/pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type OfficeStatus = "offline" | "error" | "ready";

export type FounderRow = {
  id: string;
  name: string;
  place: string;
  applications: number;
};

export type FounderFile = {
  id: string;
  name: string;
  place: string;
  phone: string | null;
  occupation: string | null;
  linkedin: string | null;
  applications: { id: string; reference: string; stage: string }[];
  meetings: { id: string; heldOn: string; summary: string; reference: string }[];
  notes: { id: string; body: string; at: string }[];
  requests: { id: string; kind: string; status: string; at: string }[];
  marketing: boolean;
  consents: { id: string; granted: boolean; at: string }[];
};

export type Timing = {
  stage: string;
  label: string;
  intervals: number;
  median: number | null;
};

export type Conversion = {
  stage: string;
  label: string;
  reached: number;
  submitted: number;
};

function records(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item));
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function place(country: string | null, city: string | null): string {
  return [city, country].filter(Boolean).join(", ");
}

export async function loadFounders(): Promise<{ status: OfficeStatus; founders: FounderRow[] }> {
  if (!supabaseConfigured()) return { status: "offline", founders: [] };
  const supabase = await createClient();
  const [profiles, applications] = await Promise.all([
    supabase.from("profiles").select("id, full_name, country, city").limit(200),
    supabase.from("idea_applications").select("user_id").limit(1000),
  ]);
  if (profiles.error || applications.error) return { status: "error", founders: [] };
  const counts = new Map<string, number>();
  for (const row of records(applications.data)) {
    const userId = text(row.user_id);
    if (!userId) continue;
    counts.set(userId, (counts.get(userId) ?? 0) + 1);
  }
  const founders = records(profiles.data)
    .flatMap((row) => {
      const id = text(row.id);
      if (!id) return [];
      return [
        {
          id,
          name: text(row.full_name) ?? "Unnamed",
          place: place(text(row.country), text(row.city)),
          applications: counts.get(id) ?? 0,
        },
      ];
    })
    .sort((left, right) => right.applications - left.applications || left.name.localeCompare(right.name));
  return { status: "ready", founders };
}

export async function loadFounder(id: string): Promise<{ status: OfficeStatus; founder: FounderFile | null }> {
  if (!isUuid(id)) return { status: "ready", founder: null };
  if (!supabaseConfigured()) return { status: "offline", founder: null };
  const supabase = await createClient();
  const [profile, applications, meetings, notes, requests, consents] = await Promise.all([
    supabase.from("profiles").select("id, full_name, country, city, phone, occupation, linkedin_url, marketing_opt_in").eq("id", id).maybeSingle(),
    supabase.from("idea_applications").select("id, reference, stage").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("founder_meetings").select("id, held_on, summary, application_id").eq("founder_id", id).order("held_on", { ascending: false }),
    supabase.from("admin_notes").select("id, body, created_at").eq("entity", "founder").eq("entity_id", id).order("created_at", { ascending: false }),
    supabase.from("data_requests").select("id, kind, status, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("consent_events").select("id, granted, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (profile.error || applications.error || meetings.error || notes.error || requests.error || consents.error) return { status: "error", founder: null };
  const row = profile.data as Record<string, unknown> | null;
  const founderId = text(row?.id);
  if (!founderId) return { status: "ready", founder: null };
  const references = new Map<string, string>();
  const applicationRows = records(applications.data).flatMap((item) => {
    const applicationId = text(item.id);
    if (!applicationId) return [];
    const reference = text(item.reference) ?? "Draft";
    references.set(applicationId, reference);
    return [{ id: applicationId, reference, stage: stageLabel(text(item.stage) ?? "") }];
  });
  return {
    status: "ready",
    founder: {
      id: founderId,
      name: text(row?.full_name) ?? "Unnamed",
      place: place(text(row?.country), text(row?.city)),
      phone: text(row?.phone),
      occupation: text(row?.occupation),
      linkedin: safeHttp(text(row?.linkedin_url)),
      applications: applicationRows,
      meetings: records(meetings.data).flatMap((item) => {
        const meetingId = text(item.id);
        const heldOn = text(item.held_on);
        const summary = text(item.summary);
        if (!meetingId || !heldOn || !summary) return [];
        const applicationId = text(item.application_id);
        return [{ id: meetingId, heldOn, summary, reference: applicationId ? references.get(applicationId) ?? "Application" : "General" }];
      }),
      notes: records(notes.data).flatMap((item) => {
        const noteId = text(item.id);
        const body = text(item.body);
        if (!noteId || !body) return [];
        return [{ id: noteId, body, at: text(item.created_at) ?? "" }];
      }),
      requests: records(requests.data).flatMap((item) => {
        const requestId = text(item.id);
        const kind = text(item.kind);
        const status = text(item.status);
        if (!requestId || !kind || !status) return [];
        return [{ id: requestId, kind, status, at: text(item.created_at) ?? "" }];
      }),
      marketing: row?.marketing_opt_in === true,
      consents: records(consents.data).flatMap((item) => {
        const consentId = text(item.id);
        if (!consentId || typeof item.granted !== "boolean") return [];
        return [{ id: consentId, granted: item.granted, at: text(item.created_at) ?? "" }];
      }),
    },
  };
}

export async function loadOfficeAnalytics(): Promise<{ status: OfficeStatus; timing: Timing[]; conversion: Conversion[]; submitted: number }> {
  if (!supabaseConfigured()) return { status: "offline", timing: [], conversion: [], submitted: 0 };
  const supabase = await createClient();
  const [history, applications] = await Promise.all([
    supabase.from("application_status_history").select("application_id, to_stage, created_at").order("created_at", { ascending: true }).limit(5000),
    supabase.from("idea_applications").select("id, stage").neq("stage", "draft").limit(1000),
  ]);
  if (history.error || applications.error) return { status: "error", timing: [], conversion: [], submitted: 0 };
  const events: StageEvent[] = records(history.data).flatMap((row) => {
    const applicationId = text(row.application_id);
    const toStage = text(row.to_stage);
    const at = text(row.created_at);
    if (!applicationId || !toStage || !at) return [];
    return [{ applicationId, toStage, at }];
  });
  const current = records(applications.data).flatMap((row) => {
    const id = text(row.id);
    const stage = text(row.stage);
    if (!id || !stage) return [];
    return [{ id, stage }];
  });
  const submitted = current.length;
  const timing = ["screening", "validation"].map((stage) => {
    const intervals = completedStageDays(events, stage);
    return { stage, label: stageLabel(stage), intervals: intervals.length, median: medianDays(intervals) };
  });
  const conversion = FOUNDER_TRACK.map((step) => ({
    stage: step.key,
    label: step.label,
    reached: reachedStage(events, current, step.key),
    submitted,
  }));
  return { status: "ready", timing, conversion, submitted };
}

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published: boolean;
};

export type Funnel = {
  submitted: number;
  limited: boolean;
  stages: { key: string; count: number }[];
  countries: { key: string; count: number }[];
  industries: { key: string; count: number }[];
  sources: { key: string; count: number }[];
};

export async function loadFunnel(): Promise<{ status: OfficeStatus; funnel: Funnel | null }> {
  if (!supabaseConfigured()) return { status: "offline", funnel: null };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("idea_applications")
    .select("stage, country, industry, user_id")
    .neq("stage", "draft")
    .limit(1000);
  if (error) return { status: "error", funnel: null };
  const rows = records(data);
  const userIds = [...new Set(rows.flatMap((row) => {
    const id = text(row.user_id);
    return id ? [id] : [];
  }))];
  const referred = new Set<string>();
  if (userIds.length > 0) {
    const profiles = await supabase.from("profiles").select("id, referred_by").in("id", userIds);
    if (profiles.error) return { status: "error", funnel: null };
    for (const row of records(profiles.data)) {
      const id = text(row.id);
      if (id && text(row.referred_by)) referred.add(id);
    }
  }
  const stages = rows.flatMap((row) => {
    const stage = text(row.stage);
    return stage ? [stage] : [];
  });
  return {
    status: "ready",
    funnel: {
      submitted: rows.length,
      limited: rows.length >= 1000,
      stages: orderedCounts(stages, STAFF_STAGES),
      countries: groupedCounts(rows.map((row) => text(row.country) ?? "")),
      industries: groupedCounts(rows.map((row) => text(row.industry) ?? "")),
      sources: groupedCounts(rows.map((row) => acquisitionSource(referred.has(text(row.user_id) ?? "")))),
    },
  };
}

export async function loadStaffArticles(): Promise<{ status: OfficeStatus; articles: ArticleRow[] }> {
  if (!supabaseConfigured()) return { status: "offline", articles: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").select("id, slug, title, excerpt, published").order("updated_at", { ascending: false }).limit(100);
  if (error) return { status: "error", articles: [] };
  return {
    status: "ready",
    articles: records(data).flatMap((row) => {
      const id = text(row.id);
      const slug = text(row.slug);
      const title = text(row.title);
      if (!id || !slug || !title) return [];
      return [{ id, slug, title, excerpt: text(row.excerpt), published: row.published === true }];
    }),
  };
}

export async function loadPublishedArticles(): Promise<ArticleRow[] | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, published")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return null;
  return records(data).flatMap((row) => {
    const id = text(row.id);
    const slug = text(row.slug);
    const title = text(row.title);
    if (!id || !slug || !title) return [];
    return [{ id, slug, title, excerpt: text(row.excerpt), published: true }];
  });
}

export async function loadPublishedArticle(slug: string): Promise<{ title: string; excerpt: string | null; body: string } | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").select("title, excerpt, body, published").eq("slug", slug).eq("published", true).maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const title = text(row.title);
  const body = text(row.body);
  if (!title || !body || row.published !== true) return null;
  return { title, excerpt: text(row.excerpt), body };
}

export type InquiryRow = {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  at: string;
};

export async function loadOwnAccountRequests(userId: string): Promise<{ id: string; kind: string; status: string; at: string }[] | null> {
  if (!isUuid(userId) || !supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("data_requests")
    .select("id, kind, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return null;
  return records(data).flatMap((row) => {
    const id = text(row.id);
    const kind = text(row.kind);
    const status = text(row.status);
    if (!id || !kind || !status) return [];
    return [{ id, kind, status, at: text(row.created_at) ?? "" }];
  });
}

export async function loadInquiries(): Promise<{ status: OfficeStatus; inquiries: InquiryRow[] }> {
  if (!supabaseConfigured()) return { status: "offline", inquiries: [] };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, name, email, inquiry_type, message, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { status: "error", inquiries: [] };
  return {
    status: "ready",
    inquiries: records(data).flatMap((row) => {
      const id = text(row.id);
      const email = text(row.email);
      const type = text(row.inquiry_type);
      const message = text(row.message);
      const at = text(row.created_at);
      if (!id || !email || !type || !message || !at) return [];
      return [{ id, name: text(row.name) ?? "No name", email, type, message, at }];
    }),
  };
}

export type OpenAccountRequest = {
  id: string;
  founderId: string;
  name: string;
  kind: string;
  at: string;
};

export async function loadOpenAccountRequests(): Promise<{ status: OfficeStatus; requests: OpenAccountRequest[] }> {
  if (!supabaseConfigured()) return { status: "offline", requests: [] };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("data_requests")
    .select("id, user_id, kind, created_at")
    .eq("status", "requested")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) return { status: "error", requests: [] };
  const rows = records(data);
  const founderIds = [...new Set(rows.flatMap((row) => {
    const id = text(row.user_id);
    return id ? [id] : [];
  }))];
  const names = new Map<string, string>();
  if (founderIds.length > 0) {
    const profiles = await supabase.from("profiles").select("id, full_name").in("id", founderIds);
    if (profiles.error) return { status: "error", requests: [] };
    for (const row of records(profiles.data)) {
      const id = text(row.id);
      if (id) names.set(id, text(row.full_name) ?? "Unnamed");
    }
  }
  return {
    status: "ready",
    requests: rows.flatMap((row) => {
      const id = text(row.id);
      const founderId = text(row.user_id);
      const kind = text(row.kind);
      const at = text(row.created_at);
      if (!id || !founderId || !kind || !at) return [];
      return [{ id, founderId, name: names.get(founderId) ?? "Unnamed", kind, at }];
    }),
  };
}

export type WaitlistRow = {
  id: string;
  name: string;
  email: string;
  country: string;
  persona: string;
  interests: string;
  left: boolean;
  at: string;
};

export async function loadWaitlist(): Promise<{ status: OfficeStatus; people: WaitlistRow[] }> {
  if (!supabaseConfigured()) return { status: "offline", people: [] };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waitlist")
    .select("id, name, email, country, persona, interests, unsubscribed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { status: "error", people: [] };
  return {
    status: "ready",
    people: records(data).flatMap((row) => {
      const id = text(row.id);
      const email = text(row.email);
      const at = text(row.created_at);
      if (!id || !email || !at) return [];
      return [{
        id,
        name: text(row.name) ?? "No name",
        email,
        country: text(row.country) ?? "Not recorded",
        persona: text(row.persona) ?? "Other",
        interests: text(row.interests) ?? "",
        left: Boolean(text(row.unsubscribed_at)),
        at,
      }];
    }),
  };
}
