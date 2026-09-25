"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DOCUMENT_BYTE_LIMIT,
  applicationDocumentPath,
  isDocumentKind,
  isDocumentMime,
} from "@/lib/documents";
import { isUuid } from "@/lib/admin/pipeline";
import { getAuthContext } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

async function actor() {
  if (!supabaseConfigured()) redirect("/login?next=/dashboard");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/dashboard");
  return auth;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function uploadDocumentAction(formData: FormData) {
  const auth = await actor();
  const applicationId = field(formData, "applicationId");
  const kind = field(formData, "kind");
  const title = field(formData, "title");
  const file = formData.get("file");
  const next = field(formData, "next") === "admin" ? "admin" : "founder";
  const fail = (code: string) => {
    if (next === "admin") redirect(`/admin/applications/${applicationId}?tab=documents&error=${code}`);
    redirect(`/dashboard/documents?error=${code}`);
  };
  if (!isUuid(applicationId) || !isDocumentKind(kind) || title.length > 160) fail("invalid");
  if (!(file instanceof File) || file.size < 1 || file.size > DOCUMENT_BYTE_LIMIT || !isDocumentMime(file.type)) {
    fail("invalid");
    return;
  }
  const path = applicationDocumentPath(applicationId, file.name, crypto.randomUUID());
  if (!path) {
    fail("invalid");
    return;
  }

  const supabase = await createClient();
  const owned = await supabase
    .from("idea_applications")
    .select("id")
    .eq("id", applicationId)
    .maybeSingle();
  if (owned.error || !owned.data) fail("invalid");
  if (!isStaffRole(auth.role)) {
    const mine = await supabase
      .from("idea_applications")
      .select("id")
      .eq("id", applicationId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (mine.error || !mine.data) fail("invalid");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const uploaded = await supabase.storage.from("application-documents").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) fail("failed");

  const registered = await supabase.rpc("register_application_document", {
    p_application: applicationId,
    p_path: path,
    p_kind: kind,
    p_title: title,
    p_mime: file.type,
    p_bytes: file.size,
  });
  if (registered.error) {
    await supabase.storage.from("application-documents").remove([path]);
    fail("failed");
  }
  revalidatePath("/dashboard/documents");
  revalidatePath(`/admin/applications/${applicationId}`);
  if (next === "admin") redirect(`/admin/applications/${applicationId}?tab=documents&notice=document`);
  redirect("/dashboard/documents?notice=document");
}

export async function openThreadAction(formData: FormData) {
  const auth = await actor();
  const applicationId = field(formData, "applicationId");
  const subject = field(formData, "subject");
  const body = field(formData, "body");
  const documentId = field(formData, "documentId");
  const next = field(formData, "next");
  if (!isUuid(applicationId) || subject.length < 1 || subject.length > 120 || body.length < 1 || body.length > 4000) {
    if (next === "admin") redirect(`/admin/applications/${applicationId}?tab=messages&error=invalid`);
    redirect("/dashboard/messages?error=invalid");
  }
  if (documentId && !isUuid(documentId)) {
    if (next === "admin") redirect(`/admin/applications/${applicationId}?tab=messages&error=invalid`);
    redirect("/dashboard/messages?error=invalid");
  }
  if (!isStaffRole(auth.role)) {
    const supabase = await createClient();
    const mine = await supabase
      .from("idea_applications")
      .select("id")
      .eq("id", applicationId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (mine.error || !mine.data) redirect("/dashboard/messages?error=invalid");
  }
  const supabase = await createClient();
  const opened = await supabase.rpc("open_message_thread", {
    p_application: applicationId,
    p_subject: subject,
  });
  const threadId = typeof opened.data === "string" ? opened.data : "";
  if (opened.error || !isUuid(threadId)) {
    if (next === "admin") redirect(`/admin/applications/${applicationId}?tab=messages&error=failed`);
    redirect("/dashboard/messages?error=failed");
  }
  const posted = await supabase.rpc("post_message", {
    p_thread: threadId,
    p_body: body,
    p_document: documentId || null,
  });
  if (posted.error) {
    if (next === "admin") redirect(`/admin/applications/${applicationId}?tab=messages&error=failed`);
    redirect(`/dashboard/messages/${threadId}?error=failed`);
  }
  revalidatePath("/dashboard/messages");
  revalidatePath(`/admin/applications/${applicationId}`);
  if (next === "admin") redirect(`/admin/applications/${applicationId}?tab=messages&notice=message`);
  redirect(`/dashboard/messages/${threadId}`);
}

export async function replyMessageAction(formData: FormData) {
  await actor();
  const threadId = field(formData, "threadId");
  const body = field(formData, "body");
  const documentId = field(formData, "documentId");
  const adminApplication = field(formData, "applicationId");
  const back = isUuid(adminApplication)
    ? `/admin/applications/${adminApplication}?tab=messages`
    : `/dashboard/messages/${threadId}`;
  if (!isUuid(threadId) || body.length < 1 || body.length > 4000) redirect(`${back}${back.includes("?") ? "&" : "?"}error=invalid`);
  if (documentId && !isUuid(documentId)) redirect(`${back}${back.includes("?") ? "&" : "?"}error=invalid`);
  const supabase = await createClient();
  const posted = await supabase.rpc("post_message", {
    p_thread: threadId,
    p_body: body,
    p_document: documentId || null,
  });
  if (posted.error) redirect(`${back}${back.includes("?") ? "&" : "?"}error=failed`);
  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${threadId}`);
  if (isUuid(adminApplication)) revalidatePath(`/admin/applications/${adminApplication}`);
  redirect(`${back}${back.includes("?") ? "&" : "?"}notice=message`);
}
