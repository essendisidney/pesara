import { NextResponse } from "next/server";
import { track } from "@/lib/analytics/events";
import { isReferralCode, REFERRAL_COOKIE } from "@/lib/referrals";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const clean = decodeURIComponent(code).trim().toUpperCase();
  const destination = new URL("/idea-check", request.url);
  if (!isReferralCode(clean)) return NextResponse.redirect(new URL("/", request.url));
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.rpc("note_referral_visit", { p_code: clean });
    await track("referral_used");
  }
  const response = NextResponse.redirect(destination);
  response.cookies.set(REFERRAL_COOKIE, clean, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
  });
  return response;
}
