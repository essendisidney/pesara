import { EmptyState } from "@/components/ui/empty-state";
import { formatNairobi } from "@/lib/admin/present";
import { emailConfigured } from "@/lib/email/send";
import { loadOpsEvents } from "@/lib/ops-data";
import { serviceRoleConfigured } from "@/lib/supabase/service";
import { turnstileEnabled } from "@/lib/abuse";

function Setting({ label, on, detail }: { label: string; on: boolean; detail: string }) {
  return (
    <li className="flex items-baseline justify-between gap-4 px-5 py-4 text-sm">
      <span>
        <span className="text-cream">{label}</span>
        <span className="mt-1 block text-xs text-mute">{detail}</span>
      </span>
      <span className={on ? "text-gold" : "text-mute"}>{on ? "On" : "Off"}</span>
    </li>
  );
}

export default async function Page() {
  const result = await loadOpsEvents();
  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">System</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Health and issues</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        Failures the site would otherwise only print to its server logs: email that did not send, founder
        notifications that failed, and signed Rails events that were refused.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <ul className="mt-4 divide-y divide-line border border-line">
          <Setting
            label="Server access (service role)"
            on={serviceRoleConfigured()}
            detail="Needed for founder emails, waitlist welcome email, Rails intake and this log."
          />
          <Setting label="Email (Resend)" on={emailConfigured()} detail="RESEND_API_KEY and EMAIL_FROM." />
          <Setting label="Bot check (Turnstile)" on={turnstileEnabled()} detail="Optional. Honeypot and rate limits run regardless." />
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent issues</h2>
        {result.status === "offline" ? (
          <div className="mt-4">
            <EmptyState title="Database is not connected">Issues are recorded once Pesara is connected.</EmptyState>
          </div>
        ) : null}
        {result.status === "error" ? (
          <div className="mt-4">
            <EmptyState title="Issues could not be read">Try this page again in a moment.</EmptyState>
          </div>
        ) : null}
        {result.status === "ready" && result.events.length === 0 ? (
          <p className="mt-4 text-sm text-mute">Nothing recorded. Issues appear here as they happen.</p>
        ) : null}
        {result.status === "ready" && result.events.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border border-line">
            {result.events.map((event) => (
              <li key={event.id} className="px-5 py-4 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-cream">{event.message}</span>
                  <span className={event.level === "error" ? "text-gold" : "text-mute"}>
                    {event.level === "error" ? "Error" : "Warning"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-mute">
                  {event.source} · {formatNairobi(event.createdAt)}
                  {Object.keys(event.context).length > 0
                    ? ` · ${Object.entries(event.context)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(", ")}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}
