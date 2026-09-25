"use server";

import { redirect } from "next/navigation";
import { inquiryDraft } from "@/lib/inquiries";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function submitInquiryAction(formData: FormData) {
  const draft = inquiryDraft({
    name: field(formData, "name"),
    email: field(formData, "email"),
    type: field(formData, "type"),
    message: field(formData, "message"),
  });
  if (!draft) redirect("/contact?error=invalid");
  if (!supabaseConfigured()) redirect("/contact?error=offline");
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_inquiry", {
    p_name: draft.name,
    p_email: draft.email,
    p_type: draft.type,
    p_message: draft.message,
  });
  if (error) redirect("/contact?error=failed");
  redirect("/contact?notice=sent");
}
