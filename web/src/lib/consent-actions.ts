"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { marketingChoice } from "@/lib/consent";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export async function setMarketingConsentAction(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?next=/dashboard/profile");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard/profile");
  const granted = marketingChoice(formData.get("marketing"));
  if (granted === null) redirect("/dashboard/profile?error=choice");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_marketing_consent", { p_granted: granted });
  if (error) redirect("/dashboard/profile?error=unstored");
  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/founders");
  redirect("/dashboard/profile?notice=consent");
}
