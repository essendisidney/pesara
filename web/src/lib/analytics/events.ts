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

export function track(event: AnalyticsEvent, payload?: Record<string, string | number | boolean>) {
  if (process.env.NODE_ENV === "development") {
    console.info("[pesara:event]", event, payload ?? {});
  }
}
