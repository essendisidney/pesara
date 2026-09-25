import { metricFlags, type PipelineKey } from "@/lib/public-pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export async function loadMetricFlags(): Promise<
  { status: "offline" } | { status: "error" } | { status: "ready"; flags: Record<PipelineKey, boolean> }
> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("system_settings").select("value").eq("key", "public_metrics").maybeSingle();
  if (error) return { status: "error" };
  return { status: "ready", flags: metricFlags(data?.value) };
}
