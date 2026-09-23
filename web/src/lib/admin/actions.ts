"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isStaffStage, isUuid } from "@/lib/admin/pipeline";
import {
  catalogDimensions,
  isCommitteeDecision,
  isExperimentOutcome,
  isExperimentType,
} from "@/lib/admin/viability";
import { isAdminRole, isCommitteeRole, isStaffRole } from "@/lib/permissions/roles";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";
import { isCommercialKind, isPublicRelationship, isVentureStatus } from "@/lib/admin/venture";

async function staffClient() {
  if (!supabaseConfigured()) redirect("/login?next=/admin");
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/admin");
  if (!isStaffRole(auth.role)) redirect("/dashboard");
  return createClient();
}

function applicationId(formData: FormData): string | null {
  const value = formData.get("applicationId");
  if (typeof value !== "string" || !isUuid(value)) return null;
  return value;
}

function failureCode(message: string | undefined): "invalid" | "failed" {
  if (!message) return "failed";
  if (
    message.includes("not staff") ||
    message.includes("invalid") ||
    message.includes("not found") ||
    message.includes("not authenticated")
  ) {
    return "invalid";
  }
  return "failed";
}

function finish(id: string, notice: string, tab = "overview") {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/viability");
  revalidatePath(`/admin/applications/${id}`);
  redirect(`/admin/applications/${id}?tab=${tab}&notice=${notice}`);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalDate(value: string): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function assignAnalystAction(formData: FormData) {
  const id = applicationId(formData);
  if (!id) redirect("/admin/applications?error=invalid");
  const raw = formData.get("analystId");
  const analyst = typeof raw === "string" ? raw : "";
  if (analyst && !isUuid(analyst)) redirect(`/admin/applications/${id}?tab=overview&error=invalid`);

  const supabase = await staffClient();
  const { error } = await supabase.rpc("assign_application_analyst", {
    p_id: id,
    p_analyst: analyst || null,
  });
  if (error) redirect(`/admin/applications/${id}?tab=overview&error=${failureCode(error.message)}`);
  finish(id, "assigned");
}

export async function setStageAction(formData: FormData) {
  const id = applicationId(formData);
  if (!id) redirect("/admin/applications?error=invalid");
  const raw = formData.get("stage");
  const stage = typeof raw === "string" ? raw : "";
  if (!isStaffStage(stage)) redirect(`/admin/applications/${id}?tab=overview&error=invalid`);

  const supabase = await staffClient();
  const { error } = await supabase.rpc("set_application_stage", {
    p_id: id,
    p_stage: stage,
  });
  if (error) redirect(`/admin/applications/${id}?tab=overview&error=${failureCode(error.message)}`);
  finish(id, "stage");
}

export async function addNoteAction(formData: FormData) {
  const id = applicationId(formData);
  if (!id) redirect("/admin/applications?error=invalid");
  const raw = formData.get("body");
  const body = typeof raw === "string" ? raw.trim() : "";
  if (!body || body.length > 4000) redirect(`/admin/applications/${id}?tab=overview&error=invalid`);

  const supabase = await staffClient();
  const { error } = await supabase.rpc("add_application_note", {
    p_id: id,
    p_body: body,
  });
  if (error) redirect(`/admin/applications/${id}?tab=overview&error=${failureCode(error.message)}`);
  finish(id, "note");
}

export async function saveAssessmentAction(formData: FormData) {
  const id = applicationId(formData);
  if (!id) redirect("/admin/applications?error=invalid");
  const scores: { dimension: string; score: number; note: string }[] = [];
  let invalidScore = false;
  for (const dimension of catalogDimensions()) {
    const score = field(formData, `score:${dimension.key}`);
    const note = field(formData, `note:${dimension.key}`);
    if (!score && !note) continue;
    const parsed = Number(score);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5 || !note || note.length > 2000) {
      invalidScore = true;
      continue;
    }
    scores.push({ dimension: dimension.key, score: parsed, note });
  }
  if (invalidScore || scores.length === 0) {
    redirect(`/admin/applications/${id}?tab=assessment&error=invalid`);
  }

  const supabase = await staffClient();
  const { error } = await supabase.rpc("save_viability_assessment", {
    p_id: id,
    p_notes: field(formData, "notes"),
    p_scores: scores,
  });
  if (error) redirect(`/admin/applications/${id}?tab=assessment&error=${failureCode(error.message)}`);
  finish(id, "assessment", "assessment");
}

export async function saveExperimentAction(formData: FormData) {
  const id = applicationId(formData);
  if (!id) redirect("/admin/applications?error=invalid");
  const type = field(formData, "experimentType");
  const outcome = field(formData, "outcome");
  const starts = optionalDate(field(formData, "startsOn"));
  const ends = optionalDate(field(formData, "endsOn"));
  if (!isExperimentType(type) || (outcome && !isExperimentOutcome(outcome))) {
    redirect(`/admin/applications/${id}?tab=validation&error=invalid`);
  }
  if (field(formData, "startsOn") && !starts) redirect(`/admin/applications/${id}?tab=validation&error=invalid`);
  if (field(formData, "endsOn") && !ends) redirect(`/admin/applications/${id}?tab=validation&error=invalid`);

  const supabase = await staffClient();
  const { error } = await supabase.rpc("save_validation_experiment", {
    p_id: id,
    p_type: type,
    p_title: field(formData, "title"),
    p_hypothesis: field(formData, "hypothesis"),
    p_method: field(formData, "method"),
    p_target: field(formData, "target"),
    p_starts: starts,
    p_ends: ends,
    p_success: field(formData, "success"),
    p_cost: field(formData, "cost"),
    p_results: field(formData, "results"),
    p_evidence: field(formData, "evidence"),
    p_conclusion: field(formData, "conclusion"),
    p_outcome: outcome || null,
  });
  if (error) redirect(`/admin/applications/${id}?tab=validation&error=${failureCode(error.message)}`);
  finish(id, "experiment", "validation");
}

export async function recordCommitteeAction(formData: FormData) {
  const id = applicationId(formData);
  if (!id) redirect("/admin/applications?error=invalid");
  const auth = await getAuthContext();
  if (!auth || !isCommitteeRole(auth.role)) redirect(`/admin/applications/${id}?tab=committee&error=invalid`);
  const decision = field(formData, "decision");
  const members = formData.getAll("member").filter((value): value is string => typeof value === "string" && isUuid(value));
  const review = optionalDate(field(formData, "reviewDate"));
  if (!isCommitteeDecision(decision) || members.length === 0) {
    redirect(`/admin/applications/${id}?tab=committee&error=invalid`);
  }
  if (field(formData, "reviewDate") && !review) redirect(`/admin/applications/${id}?tab=committee&error=invalid`);

  const supabase = await staffClient();
  const { error } = await supabase.rpc("record_committee_decision", {
    p_id: id,
    p_decision: decision,
    p_rationale: field(formData, "rationale"),
    p_conditions: field(formData, "conditions"),
    p_next_steps: field(formData, "nextSteps"),
    p_commercial: field(formData, "commercial"),
    p_technology: field(formData, "technology"),
    p_review: review,
    p_founder_feedback: field(formData, "founderFeedback"),
    p_members: members,
  });
  if (error) redirect(`/admin/applications/${id}?tab=committee&error=${failureCode(error.message)}`);
  finish(id, "committee", "committee");
}

export async function saveWeightsAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth || !isAdminRole(auth.role)) redirect("/admin/viability?error=invalid");
  const weights: { dimension: string; weight: number }[] = [];
  let invalidWeight = false;
  for (const dimension of catalogDimensions()) {
    const raw = field(formData, `weight:${dimension.key}`);
    const weight = Number(raw);
    if (!raw || !Number.isFinite(weight) || weight < 0.1 || weight > 10) {
      invalidWeight = true;
      continue;
    }
    weights.push({ dimension: dimension.key, weight });
  }
  if (invalidWeight) redirect("/admin/viability?error=invalid");

  const supabase = await staffClient();
  const { error } = await supabase.rpc("set_dimension_weights", { p_weights: weights });
  if (error) redirect(`/admin/viability?error=${failureCode(error.message)}`);
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/viability");
  redirect("/admin/viability?notice=weights");
}

function ventureId(formData: FormData): string | null {
  const value = formData.get("ventureId");
  if (typeof value !== "string" || !isUuid(value)) return null;
  return value;
}

function bounded(value: string, max: number): boolean {
  return value.length <= max;
}

export async function createVentureAction(formData: FormData) {
  const id = applicationId(formData);
  if (!id) redirect("/admin/applications?error=invalid");
  const auth = await getAuthContext();
  if (!auth || !isAdminRole(auth.role)) redirect(`/admin/applications/${id}?tab=committee&error=invalid`);
  const supabase = await staffClient();
  const { data, error } = await supabase.rpc("create_venture_from_application", { p_id: id });
  if (error || typeof data !== "string" || !isUuid(data)) {
    redirect(`/admin/applications/${id}?tab=committee&error=${failureCode(error?.message)}`);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin/ventures");
  redirect(`/admin/ventures/${data}`);
}

export async function updateVentureAction(formData: FormData) {
  const id = ventureId(formData);
  if (!id) redirect("/admin/ventures?error=invalid");
  const auth = await getAuthContext();
  if (!auth || !isAdminRole(auth.role)) redirect(`/admin/ventures/${id}?error=invalid`);
  const name = field(formData, "name");
  const status = field(formData, "status");
  const relationship = field(formData, "relationship");
  const kind = field(formData, "commercialKind");
  const website = field(formData, "website");
  const agreementRaw = field(formData, "agreementDate");
  const agreement = optionalDate(agreementRaw);
  const description = field(formData, "description");
  const technology = field(formData, "technology");
  const terms = field(formData, "commercialTerms");
  const pesaraContribution = field(formData, "pesaraContribution");
  const founderContribution = field(formData, "founderContribution");
  const revenueShare = field(formData, "revenueShare");
  const equityInterest = field(formData, "equityInterest");
  const agreementDocument = field(formData, "agreementDocument");
  const stage = field(formData, "stage");
  const industry = field(formData, "industry");
  const country = field(formData, "country");
  if (
    !name ||
    !bounded(name, 200) ||
    !isVentureStatus(status) ||
    !isPublicRelationship(relationship) ||
    (kind && !isCommercialKind(kind)) ||
    (website && !/^https?:\/\//.test(website)) ||
    (agreementRaw && !agreement) ||
    ![description, technology, terms, pesaraContribution, founderContribution, revenueShare, equityInterest, agreementDocument, stage, industry, country].every((value) => bounded(value, 4000))
  ) {
    redirect(`/admin/ventures/${id}?error=invalid`);
  }

  const supabase = await staffClient();
  const { error } = await supabase.rpc("update_venture_workspace", {
    p_id: id,
    p_name: name,
    p_description: description,
    p_industry: industry,
    p_country: country,
    p_stage: stage,
    p_status: status,
    p_relationship: relationship,
    p_website: website,
    p_technology: technology,
    p_commercial_kind: kind,
    p_pesara_contribution: pesaraContribution,
    p_founder_contribution: founderContribution,
    p_commercial_terms: terms,
    p_revenue_share: revenueShare,
    p_equity_interest: equityInterest,
    p_agreement_date: agreement,
    p_agreement_document: agreementDocument,
  });
  if (error) redirect(`/admin/ventures/${id}?error=${failureCode(error.message)}`);
  revalidatePath("/admin/ventures");
  revalidatePath(`/admin/ventures/${id}`);
  redirect(`/admin/ventures/${id}?notice=saved`);
}

export async function addVentureMilestoneAction(formData: FormData) {
  const id = ventureId(formData);
  if (!id) redirect("/admin/ventures?error=invalid");
  const title = field(formData, "title");
  const dueRaw = field(formData, "dueOn");
  const due = optionalDate(dueRaw);
  if (!title || !bounded(title, 200) || (dueRaw && !due)) redirect(`/admin/ventures/${id}?error=invalid`);
  const supabase = await staffClient();
  const { error } = await supabase.rpc("add_venture_milestone", { p_id: id, p_title: title, p_due: due });
  if (error) redirect(`/admin/ventures/${id}?error=${failureCode(error.message)}`);
  revalidatePath(`/admin/ventures/${id}`);
  redirect(`/admin/ventures/${id}?notice=milestone`);
}

export async function addVentureKpiAction(formData: FormData) {
  const id = ventureId(formData);
  if (!id) redirect("/admin/ventures?error=invalid");
  const label = field(formData, "label");
  const raw = field(formData, "value");
  const value = Number(raw);
  if (!label || !bounded(label, 80) || !raw || !Number.isFinite(value)) redirect(`/admin/ventures/${id}?error=invalid`);
  const supabase = await staffClient();
  const { error } = await supabase.rpc("add_venture_kpi", { p_id: id, p_label: label, p_value: value });
  if (error) redirect(`/admin/ventures/${id}?error=${failureCode(error.message)}`);
  revalidatePath(`/admin/ventures/${id}`);
  redirect(`/admin/ventures/${id}?notice=kpi`);
}

export async function addVentureNoteAction(formData: FormData) {
  const id = ventureId(formData);
  if (!id) redirect("/admin/ventures?error=invalid");
  const body = field(formData, "body");
  if (!body || !bounded(body, 4000)) redirect(`/admin/ventures/${id}?error=invalid`);
  const supabase = await staffClient();
  const { error } = await supabase.rpc("add_venture_note", { p_id: id, p_body: body });
  if (error) redirect(`/admin/ventures/${id}?error=${failureCode(error.message)}`);
  revalidatePath(`/admin/ventures/${id}`);
  redirect(`/admin/ventures/${id}?notice=note`);
}
