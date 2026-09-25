"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { founderContact } from "@/lib/profile";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function updateFounderProfileAction(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?next=/dashboard/profile");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard/profile");
  const contact = founderContact({
    fullName: field(formData, "fullName"),
    phone: field(formData, "phone"),
    country: field(formData, "country"),
    city: field(formData, "city"),
    occupation: field(formData, "occupation"),
    linkedin: field(formData, "linkedin"),
  });
  if (!contact) redirect("/dashboard/profile?error=profile");
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_founder_profile", {
    p_name: contact.fullName,
    p_phone: contact.phone,
    p_country: contact.country,
    p_city: contact.city,
    p_occupation: contact.occupation,
    p_linkedin: contact.linkedin,
  });
  if (error) redirect("/dashboard/profile?error=profile-failed");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  revalidatePath("/admin/founders");
  revalidatePath(`/admin/founders/${auth.userId}`);
  redirect("/dashboard/profile?notice=profile");
}
