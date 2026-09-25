import { presentPipeline, type PublicMetric } from "@/lib/public-pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type { PublicMetric };

export async function getPublicMetrics(): Promise<{
  ready: boolean;
  items: PublicMetric[];
}> {
  if (!supabaseConfigured()) return { ready: false, items: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_pipeline");
  if (error || !Array.isArray(data)) return { ready: false, items: [] };
  const items = presentPipeline(data);
  return { ready: items.length > 0, items };
}
