"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountRequestKind } from "@/lib/account-requests";
import { isUuid } from "@/lib/admin/pipeline";
import { getAuthContext } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestAccountAction(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?next=/dashboard/profile");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard/profile");
  const kind = accountRequestKind(field(formData, "kind"));
  if (!kind) redirect("/dashboard/profile?error=invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_account_action", { p_kind: kind });
  if (error) redirect("/dashboard/profile?error=failed");
  revalidatePath("/dashboard/profile");
  revalidatePath("/admin");
  redirect("/dashboard/profile?notice=requested");
}

export async function recordAccountRequestAction(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?next=/admin");
  const auth = await getAuthContext();
  if (!auth || !isStaffRole(auth.role)) redirect("/login?next=/admin");
  const requestId = field(formData, "requestId");
  const founderId = field(formData, "founderId");
  const back = isUuid(founderId) ? `/admin/founders/${founderId}` : "/admin";
  if (!isUuid(requestId)) redirect(`${back}?error=invalid`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_account_request", { p_request: requestId });
  if (error) redirect(`${back}?error=failed`);
  revalidatePath("/admin");
  if (isUuid(founderId)) revalidatePath(`/admin/founders/${founderId}`);
  redirect(`${back}?notice=request`);
}
