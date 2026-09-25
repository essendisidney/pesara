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

export async function markNoticeReadAction(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?next=/dashboard/notices");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard/notices");
  const id = field(formData, "noticeId");
  if (!isUuid(id)) redirect("/dashboard/notices?error=invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notification_read", { p_id: id });
  if (error) redirect("/dashboard/notices?error=failed");
  revalidatePath("/dashboard/notices");
  redirect("/dashboard/notices");
}
