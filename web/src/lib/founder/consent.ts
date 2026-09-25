import { isUuid } from "@/lib/admin/pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export async function loadOwnMarketing(userId: string): Promise<boolean | null> {
  if (!isUuid(userId) || !supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("marketing_opt_in")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.marketing_opt_in === true;
}
