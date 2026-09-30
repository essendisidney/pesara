"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid } from "@/lib/admin/pipeline";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function withdrawApplicationAction(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?next=/dashboard");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard");
  const id = field(formData, "applicationId");
  const back = isUuid(id) ? `/dashboard/ideas/${id}` : "/dashboard";
  if (!isUuid(id) || formData.get("confirm") !== "on") redirect(`${back}?error=withdraw`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_application", { p_id: id });
  if (error) redirect(`${back}?error=withdraw-failed`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ideas");
  revalidatePath(back);
  revalidatePath("/admin/applications");
  redirect(`${back}?notice=withdrawn`);
}
