import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export const ANALYTICS_EVENTS = [
  "homepage_view",
  "submit_idea_clicked",
  "application_started",
  "application_step_completed",
  "application_submitted",
  "account_created",
  "portfolio_viewed",
  "service_enquiry",
  "waitlist_joined",
  "referral_used",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsProps = Record<string, string | number | boolean>;

/**
 * Records a first-party product event through the `record_event` RPC. Server only.
 * No personal data: never put names, emails or idea text in props. Never throws.
 */
export async function track(event: AnalyticsEvent, props?: AnalyticsProps, path?: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.info("[pesara:event]", event, props ?? {});
  }
  if (!supabaseConfigured()) return;
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_event", {
      p_name: event,
      p_path: path ?? null,
      p_props: props ?? {},
    });
    if (error) console.error("[pesara:event] not recorded", event, error.message);
  } catch (error) {
    console.error("[pesara:event] not recorded", event, error);
  }
}
