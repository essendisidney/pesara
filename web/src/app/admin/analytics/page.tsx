import { loadOfficeAnalytics } from "@/lib/admin/office-data";
import { EmptyState } from "@/components/ui/empty-state";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { loadEventCounts } from "@/lib/analytics/load";
import { completionRate, EVENT_LABELS } from "@/lib/analytics/summary";

export default async function Page() {
  const [result, events] = await Promise.all([loadOfficeAnalytics(), loadEventCounts()]);
  const rate =
    events.status === "ready"
      ? completionRate(events.counts.application_started, events.counts.application_submitted)
      : null;
  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Analytics</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Stage timing</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        Times come from completed stage changes. An open stage is not counted as finished. Application text is not shown here.
      </p>
      {result.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">Timing stays hidden until Pesara is connected.</EmptyState>
        </div>
      ) : null}
      {result.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="Timing could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" ? (
        <>
          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            {result.timing.map((item) => (
              <article key={item.stage} className="border border-line p-6">
                <h2 className="text-lg font-medium">{item.label}</h2>
                {item.median === null ? (
                  <p className="mt-3 text-sm text-mute">No completed interval yet.</p>
                ) : (
                  <p className="mt-3 text-sm text-cream">
                    Median {item.median} {item.median === 1 ? "day" : "days"} across {item.intervals}{" "}
                    {item.intervals === 1 ? "completed interval" : "completed intervals"}.
                  </p>
                )}
              </article>
            ))}
          </section>
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Reached from submitted ideas</h2>
            {result.submitted === 0 ? <p className="mt-3 text-sm text-mute">No submitted ideas yet.</p> : null}
            <ul className="mt-4 divide-y divide-line border border-line">
              {result.conversion.map((item) => (
                <li key={item.stage} className="flex items-baseline justify-between gap-4 px-5 py-4 text-sm">
                  <span className="text-cream">{item.label}</span>
                  <span className="text-mute">
                    {item.reached} of {item.submitted}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
      {events.status === "ready" ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Product events, last {events.days} days</h2>
          <p className="mt-2 text-sm text-mute">
            {rate === null
              ? "No applications started in this period."
              : `${rate}% of started applications were submitted.`}
          </p>
          <ul className="mt-4 divide-y divide-line border border-line">
            {ANALYTICS_EVENTS.filter((name) => events.counts[name] > 0).map((name) => (
              <li key={name} className="flex items-baseline justify-between gap-4 px-5 py-4 text-sm">
                <span className="text-cream">{EVENT_LABELS[name]}</span>
                <span className="text-mute">{events.counts[name]}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
