"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid } from "@/lib/admin/pipeline";
import { getAuthContext } from "@/lib/auth/session";
import { isAdminRole, isStaffRole } from "@/lib/permissions/roles";
import {
  buildCostToMinor,
  majorToMinor,
  multipleToX100,
  parseKinds,
  parseMonth,
  percentToBps,
  railsErrorCode,
} from "@/lib/rails/forms";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function back(ventureId: string): string {
  return isUuid(ventureId) ? `/admin/ventures/${ventureId}/rails` : "/admin/ventures";
}

async function staff(next: string, admin = false) {
  if (!supabaseConfigured()) redirect(`/login?next=${next}`);
  const auth = await getAuthContext();
  if (!auth) redirect(`/login?next=${next}`);
  if (!isStaffRole(auth.role)) redirect("/dashboard");
  if (admin && !isAdminRole(auth.role)) redirect(`${next}?error=failed`);
  return createClient();
}

function done(path: string, notice: string): never {
  revalidatePath(path);
  redirect(`${path}?notice=${notice}`);
}

export async function createRailsAgreementAction(formData: FormData) {
  const ventureId = field(formData, "ventureId");
  const path = back(ventureId);
  const equity = percentToBps(field(formData, "equity"));
  const revenueShare = percentToBps(field(formData, "revenueShare"));
  const tail = percentToBps(field(formData, "tail"));
  const platformFee = percentToBps(field(formData, "platformFee"));
  const buildCost = buildCostToMinor(field(formData, "buildCost"));
  const multiple = multipleToX100(field(formData, "recoveryMultiple"));
  const currency = field(formData, "currency").toUpperCase() || "KES";
  const kinds = parseKinds(field(formData, "revenueKinds"));
  const effectiveFrom = field(formData, "effectiveFrom");
  const document = field(formData, "agreementDocument");
  if (
    !isUuid(ventureId) ||
    equity === null ||
    revenueShare === null ||
    tail === null ||
    platformFee === null ||
    buildCost === null ||
    multiple === null ||
    kinds === null ||
    tail > revenueShare ||
    revenueShare + platformFee > 10_000 ||
    !/^[A-Z]{3}$/.test(currency) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom) ||
    document.length > 500
  ) {
    redirect(`${path}?error=invalid`);
  }
  const supabase = await staff(path);
  const { error } = await supabase.rpc("rails_create_agreement", {
    p_venture: ventureId,
    p_equity_bps: equity,
    p_revenue_share_bps: revenueShare,
    p_tail_bps: tail,
    p_platform_fee_bps: platformFee,
    p_build_cost_minor: buildCost,
    p_recovery_multiple_x100: multiple,
    p_currency: currency,
    p_revenue_kinds: kinds,
    p_effective_from: effectiveFrom,
    p_agreement_document: document || null,
  });
  if (error) redirect(`${path}?error=${railsErrorCode(error.message)}`);
  done(path, "drafted");
}

export async function activateRailsAgreementAction(formData: FormData) {
  const ventureId = field(formData, "ventureId");
  const agreementId = field(formData, "agreementId");
  const path = back(ventureId);
  if (!isUuid(ventureId) || !isUuid(agreementId)) redirect(`${path}?error=invalid`);
  const supabase = await staff(path);
  const { error } = await supabase.rpc("rails_activate_agreement", { p_agreement: agreementId });
  if (error) redirect(`${path}?error=${railsErrorCode(error.message)}`);
  done(path, "activated");
}

export async function issueRailsStatementAction(formData: FormData) {
  const ventureId = field(formData, "ventureId");
  const month = parseMonth(field(formData, "month"));
  const path = back(ventureId);
  if (!isUuid(ventureId) || !month) redirect(`${path}?error=invalid`);
  const supabase = await staff(path);
  const { error } = await supabase.rpc("rails_issue_statement", { p_venture: ventureId, p_month: month });
  if (error) redirect(`${path}?error=${railsErrorCode(error.message)}`);
  done(path, "issued");
}

export async function settleRailsStatementAction(formData: FormData) {
  const ventureId = field(formData, "ventureId");
  const statementId = field(formData, "statementId");
  const reference = field(formData, "reference");
  const amount = majorToMinor(field(formData, "amount"));
  const path = back(ventureId);
  if (!isUuid(ventureId) || !isUuid(statementId) || reference.length < 1 || reference.length > 200 || amount === null) {
    redirect(`${path}?error=invalid`);
  }
  const supabase = await staff(path);
  const { error } = await supabase.rpc("rails_settle_statement", {
    p_statement: statementId,
    p_reference: reference,
    p_amount_minor: amount,
  });
  if (error) redirect(`${path}?error=${railsErrorCode(error.message)}`);
  done(path, "settled");
}

export async function rotateRailsSecretAction(formData: FormData) {
  const ventureId = field(formData, "ventureId");
  const path = back(ventureId);
  if (!isUuid(ventureId)) redirect(`${path}?error=invalid`);
  const supabase = await staff(path, true);
  const { error } = await supabase.rpc("rails_rotate_secret", { p_venture: ventureId });
  if (error) redirect(`${path}?error=${railsErrorCode(error.message)}`);
  done(path, "secret");
}
