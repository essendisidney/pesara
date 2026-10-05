import type { AnalyticsEvent } from "@/lib/analytics/events";

export const EVENT_LABELS: Record<AnalyticsEvent, string> = {
  homepage_view: "Homepage views",
  submit_idea_clicked: "Submit idea clicks",
  application_started: "Applications started",
  application_step_completed: "Application steps completed",
  application_submitted: "Applications submitted",
  account_created: "Accounts created",
  portfolio_viewed: "Portfolio views",
  service_enquiry: "Contact messages",
  waitlist_joined: "Waitlist joins",
  referral_used: "Referral link visits",
};

/** Share of started applications that were submitted, as a whole percent, or null with no starts. */
export function completionRate(started: number, submitted: number): number | null {
  if (started <= 0) return null;
  return Math.min(100, Math.round((submitted / started) * 100));
}
