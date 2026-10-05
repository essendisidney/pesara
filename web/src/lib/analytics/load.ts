import { ANALYTICS_EVENTS, type AnalyticsEvent } from "@/lib/analytics/events";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type EventCounts =
  | { status: "offline" | "error" }
  | { status: "ready"; days: number; counts: Record<AnalyticsEvent, number> };

/** Counts each product event over the last `days` days. Staff only (enforced by RLS). */
export async function loadEventCounts(days = 30): Promise<EventCounts> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const results = await Promise.all(
    ANALYTICS_EVENTS.map((name) =>
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("name", name)
        .gte("created_at", since),
    ),
  );
  if (results.some((result) => result.error)) return { status: "error" };
  const counts = Object.fromEntries(
    ANALYTICS_EVENTS.map((name, index) => [name, results[index].count ?? 0]),
  ) as Record<AnalyticsEvent, number>;
  return { status: "ready", days, counts };
}
