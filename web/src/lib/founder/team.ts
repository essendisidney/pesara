import { isUuid } from "@/lib/admin/pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type TeamMember = { id: string; name: string; role: string };

export async function loadOwnTeam(applicationId: string): Promise<TeamMember[] | null> {
  if (!isUuid(applicationId) || !supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application_team_members")
    .select("id, full_name, role")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error || !Array.isArray(data)) return null;
  return data.flatMap((row) => {
    const id = typeof row.id === "string" ? row.id : "";
    const name = typeof row.full_name === "string" ? row.full_name.trim() : "";
    if (!id || !name) return [];
    return [{ id, name, role: typeof row.role === "string" ? row.role.trim() : "" }];
  });
}
