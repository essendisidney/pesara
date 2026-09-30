"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { articleSlug, isArticleCategory } from "@/lib/admin/office";
import { isUuid } from "@/lib/admin/pipeline";
import { ROLES } from "@/lib/permissions/roles";
import { getAuthContext } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

async function staff() {
  if (!supabaseConfigured()) redirect("/login?next=/admin");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/admin");
  if (!isStaffRole(auth.role)) redirect("/dashboard");
  return createClient();
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function addFounderNoteAction(formData: FormData) {
  const founderId = field(formData, "founderId");
  const body = field(formData, "body");
  if (!isUuid(founderId) || body.length < 1 || body.length > 4000) redirect(`/admin/founders/${founderId}?error=invalid`);
  const supabase = await staff();
  const { error } = await supabase.rpc("add_founder_note", { p_founder: founderId, p_body: body });
  if (error) redirect(`/admin/founders/${founderId}?error=failed`);
  revalidatePath(`/admin/founders/${founderId}`);
  redirect(`/admin/founders/${founderId}?notice=note`);
}

export async function addFounderMeetingAction(formData: FormData) {
  const founderId = field(formData, "founderId");
  const applicationId = field(formData, "applicationId");
  const heldOn = field(formData, "heldOn");
  const summary = field(formData, "summary");
  const back = `/admin/founders/${founderId}`;
  if (!isUuid(founderId) || !/^\d{4}-\d{2}-\d{2}$/.test(heldOn) || summary.length < 1 || summary.length > 4000) {
    redirect(`${back}?error=invalid`);
  }
  if (applicationId && !isUuid(applicationId)) redirect(`${back}?error=invalid`);
  const supabase = await staff();
  const { error } = await supabase.rpc("add_founder_meeting", {
    p_founder: founderId,
    p_application: applicationId || null,
    p_held: heldOn,
    p_summary: summary,
  });
  if (error) redirect(`${back}?error=failed`);
  revalidatePath(back);
  redirect(`${back}?notice=meeting`);
}

export async function markInquiryHandledAction(formData: FormData) {
  const inquiryId = field(formData, "inquiryId");
  if (!isUuid(inquiryId)) redirect("/admin/inquiries?error=invalid");
  const supabase = await staff();
  const { error } = await supabase.rpc("mark_inquiry_handled", { p_id: inquiryId });
  if (error) redirect("/admin/inquiries?error=failed");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  redirect("/admin/inquiries?notice=handled");
}

export async function setStaffRoleAction(formData: FormData) {
  const founderId = field(formData, "founderId");
  const role = field(formData, "role");
  const back = isUuid(founderId) ? `/admin/founders/${founderId}` : "/admin/founders";
  if (!isUuid(founderId) || !(ROLES as readonly string[]).includes(role)) redirect(`${back}?error=invalid`);
  const supabase = await staff();
  const { error } = await supabase.rpc("set_staff_role", { p_user: founderId, p_role: role });
  if (error) redirect(`${back}?error=failed`);
  revalidatePath(back);
  revalidatePath("/admin/founders");
  redirect(`${back}?notice=role`);
}

export async function saveArticleAction(formData: FormData) {
  const slug = articleSlug(field(formData, "slug") || field(formData, "title"));
  const title = field(formData, "title");
  const excerpt = field(formData, "excerpt");
  const body = field(formData, "body");
  const category = field(formData, "category");
  const published = formData.get("published") === "on";
  if (!slug || title.length < 1 || title.length > 160 || body.length < 1 || body.length > 20000 || excerpt.length > 300) {
    redirect("/admin/content?error=invalid");
  }
  if (category && !isArticleCategory(category)) redirect("/admin/content?error=invalid");
  const supabase = await staff();
  const { error } = await supabase.rpc("save_article", {
    p_slug: slug,
    p_title: title,
    p_excerpt: excerpt,
    p_body: body,
    p_category: category || null,
    p_published: published,
  });
  if (error) redirect("/admin/content?error=failed");
  revalidatePath("/admin/content");
  revalidatePath("/insights");
  revalidatePath(`/insights/${slug}`);
  redirect("/admin/content?notice=article");
}
