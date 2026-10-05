import { isUuid } from "@/lib/admin/pipeline";
import {
  presentAgreements,
  presentEvents,
  presentStatements,
  presentSummary,
  type MonthRow,
  type RailsAgreement,
  type RailsEvent,
  type RailsStatement,
} from "@/lib/rails/books";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type RailsBooks = {
  ventureId: string;
  ventureName: string;
  eventCount: number;
  recoveredMinor: number;
  months: MonthRow[];
  agreements: RailsAgreement[];
  active: RailsAgreement | null;
  /** The most recent events, newest first. Totals come from `months`, not from this list. */
  events: RailsEvent[];
  statements: RailsStatement[];
  /** Only filled for admins; RLS returns nothing to anyone else. */
  intakeSecret: { secret: string; rotatedAt: string | null } | null;
};

/** Events listed on a page, newest first. */
export const EVENT_LIMIT = 200;

export type RailsLoad = { status: "offline" } | { status: "error" } | { status: "missing" } | { status: "ready"; value: RailsBooks };

/**
 * Reads a venture's Rails books through the signed-in user's own session, so
 * row-level security decides what is visible: staff see every venture, a
 * founder only a venture they founded.
 */
export async function loadRailsBooks(ventureId: string, viewer: "staff" | "founder"): Promise<RailsLoad> {
  if (!supabaseConfigured()) return { status: "offline" };
  if (!isUuid(ventureId)) return { status: "missing" };
  const supabase = await createClient();

  const { data: summaryData, error: summaryError } = await supabase.rpc("rails_venture_summary", { p_venture: ventureId });
  if (summaryError) return { status: "error" };
  const summary = presentSummary(summaryData);
  if (!summary) return { status: "missing" };

  const [agreements, events, statements] = await Promise.all([
    supabase
      .from("rails_agreements")
      .select("id, status, equity_bps, revenue_share_bps, tail_bps, platform_fee_bps, build_cost_minor, recovery_multiple_x100, currency, revenue_kinds, effective_from, agreement_document, created_by, created_at, activated_at")
      .eq("venture_id", ventureId)
      .order("created_at", { ascending: false }),
    supabase
      .from("rails_revenue_events")
      .select("id, source_event_id, kind, gross_minor, currency, occurred_at, period_month, reference, reverses, received_at, rails_split_lines(event_id, line, tier, amount_minor)")
      .eq("venture_id", ventureId)
      .order("received_at", { ascending: false })
      .limit(EVENT_LIMIT),
    supabase
      .from("rails_statements")
      .select("id, period_month, currency, event_count, gross_minor, venture_minor, revenue_share_minor, platform_fee_minor, pesara_total_minor, recovered_to_date_minor, cap_minor, cap_remaining_minor, status, issued_by, issued_at, settlement_reference, settled_amount_minor, settled_at")
      .eq("venture_id", ventureId)
      .order("period_month", { ascending: false }),
  ]);
  if (agreements.error || events.error || statements.error) return { status: "error" };

  // Split lines arrive embedded under each event.
  const lineData = (events.data ?? []).flatMap((event) => (Array.isArray(event.rails_split_lines) ? event.rails_split_lines : []));

  let intakeSecret: RailsBooks["intakeSecret"] = null;
  if (viewer === "staff") {
    const { data } = await supabase.from("rails_venture_secrets").select("secret, rotated_at").eq("venture_id", ventureId).maybeSingle();
    if (data && typeof data.secret === "string") {
      intakeSecret = { secret: data.secret, rotatedAt: typeof data.rotated_at === "string" ? data.rotated_at : null };
    }
  }

  const presentedAgreements = presentAgreements(agreements.data);
  return {
    status: "ready",
    value: {
      ventureId,
      ventureName: summary.name,
      eventCount: summary.eventCount,
      recoveredMinor: summary.recoveredMinor,
      months: summary.months,
      agreements: presentedAgreements,
      active: presentedAgreements.find((agreement) => agreement.status === "active") ?? null,
      events: presentEvents(events.data, lineData),
      statements: presentStatements(statements.data),
      intakeSecret,
    },
  };
}
