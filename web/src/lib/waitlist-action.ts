"use server";

import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { humanSubmission, rateLimited } from "@/lib/abuse";
import { track } from "@/lib/analytics/events";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { isUuid } from "@/lib/admin/pipeline";
import { waitlistDraft } from "@/lib/waitlist";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, serviceRoleConfigured } from "@/lib/supabase/service";
import { supabaseConfigured } from "@/lib/validation/env";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function sendWelcome(entry: unknown, to: string) {
  if (typeof entry !== "string" || !isUuid(entry)) return;
  if (!emailConfigured() || !serviceRoleConfigured()) return;
  try {
    const { data } = await createServiceClient()
      .from("waitlist")
      .select("unsubscribe_token")
      .eq("id", entry)
      .maybeSingle();
    const token = data?.unsubscribe_token;
    if (typeof token !== "string") return;
    const leave = `${site.url.replace(/\/$/, "")}/waitlist/leave?token=${token}`;
    await sendEmail({
      to,
      subject: "You are on the Pesara list",
      text: `Thank you for joining. Pesara will write when there is something worth reading: new ventures, open roles and founder calls.\n\nTo leave the list at any time:\n${leave}\n\nPesara Limited\n${site.tagline}`,
    });
  } catch (error) {
    console.error("[pesara:waitlist] welcome email failed", error);
  }
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
  if (!(await humanSubmission(formData))) redirect("/?waitlist=check");
  if (!supabaseConfigured()) redirect("/?waitlist=offline");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_waitlist", {
    p_name: draft.name,
    p_email: draft.email,
    p_country: draft.country,
    p_interests: draft.interests,
    p_persona: draft.persona,
  });
  if (error) redirect(rateLimited(error.message) ? "/?waitlist=busy" : "/?waitlist=failed");
  await Promise.all([sendWelcome(data, draft.email), track("waitlist_joined", { persona: draft.persona })]);
  redirect("/?waitlist=joined");
}

export async function leaveWaitlistAction(formData: FormData) {
  const token = field(formData, "token");
  if (!isUuid(token)) redirect("/waitlist/leave?status=invalid");
  if (!supabaseConfigured()) redirect("/waitlist/leave?status=offline");
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_waitlist_by_token", { p_token: token });
  if (error) redirect("/waitlist/leave?status=failed");
  redirect("/waitlist/leave?status=left");
}
