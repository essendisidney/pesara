"use server";

import { createClient } from "@/lib/supabase/server";
import { mergeDraft, type ApplicationDraft } from "@/lib/application";
import { supabaseConfigured } from "@/lib/validation/env";
import { declarationsSchema } from "@/lib/validation/application";

export type SaveState = "saved" | "saving" | "error" | "local";

export type ApplicationRecord = {
  id: string;
  reference: string | null;
  stage: string;
  submitted_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  payload: ApplicationDraft;
  country: string | null;
};

function submittedRow(
  data: unknown,
): { id: string; stage: string; reference: string | null } | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  if (typeof record.id !== "string") return null;
  return {
    id: record.id,
    stage: typeof record.stage === "string" ? record.stage : "submitted",
    reference: typeof record.reference === "string" ? record.reference : null,
  };
}

function asRecord(row: {
  id: string;
  reference: string | null;
  stage: string;
  submitted_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  payload: unknown;
  country: string | null;
}): ApplicationRecord {
  return {
    ...row,
    payload: mergeDraft(row.payload),
  };
}

export async function saveApplicationDraft(
  draft: ApplicationDraft,
): Promise<{ draft: ApplicationDraft; state: SaveState; message?: string }> {
  if (!supabaseConfigured()) {
    return { draft, state: "local", message: "Saved on this device until Pesara is connected." };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { draft, state: "local", message: "Saved on this device. Sign in to keep it with Pesara." };
  }

  const userId = userData.user.id;
  const payload = {
    ...draft,
    applicationId: draft.applicationId,
    submitted: false,
  };

  let ideaId: string | null = null;
  if (draft.applicationId) {
    const { data: existing } = await supabase
      .from("idea_applications")
      .select("id, idea_id, stage")
      .eq("id", draft.applicationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!existing || existing.stage !== "draft") {
      return { draft, state: "error", message: "Unable to save — this application is no longer a draft." };
    }
    if (typeof existing.idea_id === "string") {
      ideaId = existing.idea_id;
    }
  }

  if (!ideaId) {
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .insert({
        user_id: userId,
        name: draft.ideaName || "Untitled idea",
        one_liner: draft.oneLiner,
      })
      .select("id")
      .single();
    if (ideaError || !idea) {
      return { draft, state: "error", message: "Unable to save — retrying" };
    }
    ideaId = idea.id;
  } else {
    await supabase
      .from("ideas")
      .update({
        name: draft.ideaName || "Untitled idea",
        one_liner: draft.oneLiner,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ideaId)
      .eq("user_id", userId);
  }

  const row = {
    idea_id: ideaId,
    user_id: userId,
    payload,
    stage: "draft",
    country: draft.country,
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: userId,
  };

  const query = draft.applicationId
    ? supabase.from("idea_applications").update(row).eq("id", draft.applicationId).eq("user_id", userId)
    : supabase.from("idea_applications").insert(row);

  const { data, error } = await query.select("id, reference, stage, updated_at").maybeSingle();
  if (error || !data) {
    return { draft, state: "error", message: "Unable to save — retrying" };
  }

  return {
    draft: {
      ...draft,
      applicationId: data.id,
      stage: data.stage,
      reference: data.reference,
      updatedAt: data.updated_at,
    },
    state: "saved",
  };
}

export async function submitApplication(
  draft: ApplicationDraft,
): Promise<{ draft: ApplicationDraft; message?: string }> {
  const parsed = declarationsSchema.safeParse({
    accurate: draft.accurate,
    noPartnership: draft.noPartnership,
    noObligation: draft.noObligation,
    authority: draft.authority,
    writtenAgreement: draft.writtenAgreement,
  });
  if (!parsed.success) {
    return { draft, message: "Confirm every declaration before submitting." };
  }
  if (!supabaseConfigured()) {
    return { draft, message: "Submission requires a Pesara account and connected database." };
  }

  const saved = await saveApplicationDraft(draft);
  if (saved.state === "error" || !saved.draft.applicationId) {
    return { draft: saved.draft, message: saved.message ?? "Sign in to submit." };
  }
  if (saved.state === "local") {
    return { draft: saved.draft, message: "Create or use your account to submit." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_application", {
    p_id: saved.draft.applicationId,
  });
  if (error || !data) {
    return { draft: saved.draft, message: error?.message ?? "Pesara could not issue a reference." };
  }

  const submitted = submittedRow(data);
  if (!submitted) {
    return { draft: saved.draft, message: "Pesara could not issue a reference." };
  }
  return {
    draft: {
      ...saved.draft,
      submitted: true,
      stage: submitted.stage,
      reference: submitted.reference,
      applicationId: submitted.id,
    },
  };
}

export async function listFounderApplications(): Promise<ApplicationRecord[]> {
  if (!supabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("idea_applications")
    .select("id, reference, stage, submitted_at, last_activity_at, created_at, updated_at, payload, country")
    .eq("user_id", userData.user.id)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map(asRecord);
}

export async function getFounderApplication(id: string): Promise<ApplicationRecord | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase
    .from("idea_applications")
    .select("id, reference, stage, submitted_at, last_activity_at, created_at, updated_at, payload, country")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return asRecord(data);
}
