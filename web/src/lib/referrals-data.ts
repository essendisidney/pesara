import { isReferralCode, referralPath } from "@/lib/referrals";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export async function loadOwnReferral(userId: string): Promise<{ code: string; path: string; invites: number } | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("referrals").select("code, invites").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  const code = typeof data.code === "string" ? data.code.trim().toUpperCase() : "";
  const invites = typeof data.invites === "number" ? data.invites : Number(data.invites);
  const path = referralPath(code);
  if (!isReferralCode(code) || !path || !Number.isInteger(invites) || invites < 0) return null;
  return { code, path, invites };
}
