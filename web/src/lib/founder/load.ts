import { latestFounderDecision, type FounderDecision } from "@/lib/founder/outcome";
import { isUuid } from "@/lib/admin/pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export async function loadFounderDecision(applicationId: string): Promise<FounderDecision | null> {
  if (!isUuid(applicationId) || !supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("founder_decision_view", { p_application_id: applicationId });
  if (error) return null;
  return latestFounderDecision(data);
}
