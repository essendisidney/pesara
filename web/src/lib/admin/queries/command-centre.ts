import { mergeDraft } from "@/lib/application";
import { COMMAND_METRICS, isUuid, oldestFirst, type CommandKey } from "@/lib/admin/pipeline";
import { safeHttp } from "@/lib/admin/present";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";
import { records, text } from "./shared";

export type LiveVenture = {
  id: string;
  name: string;
  website: string | null;
};

export type CommandCentre =
  | { status: "offline" }
  | { status: "error" }
  | { status: "ready"; counts: Record<CommandKey, number>; live: LiveVenture[] };

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

export type WaitingIdea = {
  id: string;
  reference: string;
  idea: string;
  country: string;
  submittedAt: string;
};

export async function loadReadingQueue(): Promise<
  { status: "offline" } | { status: "error" } | { status: "ready"; ideas: WaitingIdea[]; limited: boolean }
> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("idea_applications")
    .select("id, reference, payload, country, submitted_at")
    .eq("stage", "submitted")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: true })
    .limit(50);
  if (error) return { status: "error" };
  const ideas = oldestFirst(
    records(data).flatMap((row) => {
      const id = text(row.id);
      const submittedAt = text(row.submitted_at);
      if (!id || !isUuid(id) || !submittedAt) return [];
      const draft = mergeDraft(row.payload);
      return [
        {
          id,
          reference: text(row.reference) ?? "No reference",
          idea: draft.ideaName.trim() || "Untitled idea",
          country: text(row.country) ?? "Not recorded",
          submittedAt,
        },
      ];
    }),
  );
  return { status: "ready", ideas, limited: records(data).length >= 50 };
}
