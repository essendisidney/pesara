import { isUuid } from "@/lib/admin/pipeline";
import { presentFounderVenture, type FounderVenture } from "@/lib/founder/venture";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export async function loadFounderVenture(applicationId: string): Promise<FounderVenture | null | "error"> {
  if (!isUuid(applicationId) || !supabaseConfigured()) return "error";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("founder_venture_view", { p_application: applicationId });
  if (error) return "error";
  if (data == null) return null;
  return presentFounderVenture(data);
}
