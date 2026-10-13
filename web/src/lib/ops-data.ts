import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type OpsEvent = {
  id: number;
  source: string;
  level: "warn" | "error";
  message: string;
  context: Record<string, unknown>;
  createdAt: string;
};

export type OpsEvents = { status: "offline" | "error" } | { status: "ready"; events: OpsEvent[] };

/** The latest recorded issues. Staff only (enforced by RLS on ops_events). */
export async function loadOpsEvents(limit = 100): Promise<OpsEvents> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ops_events")
    .select("id, source, level, message, context, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !Array.isArray(data)) return { status: "error" };
  return {
    status: "ready",
    events: data.map((row) => ({
      id: Number(row.id),
      source: String(row.source),
      level: row.level === "warn" ? "warn" : "error",
      message: String(row.message),
      context: row.context && typeof row.context === "object" ? (row.context as Record<string, unknown>) : {},
      createdAt: String(row.created_at),
    })),
  };
}
