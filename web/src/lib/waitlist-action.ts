"use server";

import { redirect } from "next/navigation";
import { waitlistDraft, waitlistEmail } from "@/lib/waitlist";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function joinWaitlistAction(formData: FormData) {
  const draft = waitlistDraft({
    name: field(formData, "name"),
    email: field(formData, "email"),
    country: field(formData, "country"),
    interests: field(formData, "interests"),
    persona: field(formData, "persona"),
    consent: formData.get("consent") === "on",
  });
  if (draft === "consent") redirect("/?waitlist=consent");
  if (!draft) redirect("/?waitlist=invalid");
  if (!supabaseConfigured()) redirect("/?waitlist=offline");
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_waitlist", {
    p_name: draft.name,
    p_email: draft.email,
    p_country: draft.country,
    p_interests: draft.interests,
    p_persona: draft.persona,
  });
  if (error) redirect("/?waitlist=failed");
  redirect("/?waitlist=joined");
}

export async function leaveWaitlistAction(formData: FormData) {
  const email = waitlistEmail(field(formData, "email"));
  if (!email) redirect("/?waitlist=invalid");
  if (!supabaseConfigured()) redirect("/?waitlist=offline");
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_waitlist", { p_email: email });
  if (error) redirect("/?waitlist=failed");
  redirect("/?waitlist=left");
}
