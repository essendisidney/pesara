"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid } from "@/lib/admin/pipeline";
import { getAuthContext } from "@/lib/auth/session";
import { teamMember } from "@/lib/team";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function addTeamMemberAction(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?next=/dashboard");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard");
  const applicationId = field(formData, "applicationId").trim();
  const back = isUuid(applicationId) ? `/dashboard/ideas/${applicationId}` : "/dashboard";
  const member = teamMember(field(formData, "name"), field(formData, "role"));
  if (!isUuid(applicationId) || !member) redirect(`${back}?error=team`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_team_member", {
    p_application: applicationId,
    p_name: member.name,
    p_role: member.role,
  });
  if (error) redirect(`${back}?error=team-failed`);
  revalidatePath(back);
  revalidatePath(`/admin/applications/${applicationId}`);
  redirect(`${back}?notice=team`);
}

export async function removeTeamMemberAction(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?next=/dashboard");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard");
  const applicationId = field(formData, "applicationId").trim();
  const memberId = field(formData, "memberId").trim();
  const back = isUuid(applicationId) ? `/dashboard/ideas/${applicationId}` : "/dashboard";
  if (!isUuid(applicationId) || !isUuid(memberId)) redirect(`${back}?error=team`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_team_member", { p_member: memberId });
  if (error) redirect(`${back}?error=team-failed`);
  revalidatePath(back);
  revalidatePath(`/admin/applications/${applicationId}`);
  redirect(`${back}?notice=team-removed`);
}
