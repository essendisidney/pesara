import Link from "next/link";
import { EmptyState, MetricCard } from "@/components/ui/empty-state";
import { COMMAND_METRICS } from "@/lib/admin/pipeline";
import { loadCommandCentre } from "@/lib/admin/queries";

export default async function AdminPage() {
  const centre = await loadCommandCentre();

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Operating system</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Command centre</h1>
      {centre.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">
            Counts stay hidden until Pesara is connected.
          </EmptyState>
        </div>
      ) : null}
      {centre.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="Counts could not be read">Try the command centre again in a moment.</EmptyState>
        </div>
      ) : null}
      {centre.status === "ready" ? (
        <>
          <p className="mt-3 max-w-2xl text-sm text-mute">
            Accepted is the venture structuring stage. Live ventures are venture records marked live.
            Every other count is an application stage. A zero is a live count from the database.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMMAND_METRICS.map((metric) => {
              const href = metric.stage
                ? `/admin/applications?stage=${metric.stage}`
                : "/admin/ventures";
              return (
                <Link key={metric.key} href={href} className="block hover:border-gold">
                  <MetricCard label={metric.label} value={String(centre.counts[metric.key])} />
                </Link>
              );
            })}
          </div>
          {centre.live.length > 0 ? (
            <ul className="mt-8 max-w-xl divide-y divide-line border border-line">
              {centre.live.map((venture) => (
                <li key={venture.id} className="px-5 py-4">
                  <p className="text-sm text-cream">{venture.name}</p>
                  {venture.website ? (
                    <a href={venture.website} className="mt-1 inline-flex min-h-11 items-center text-sm text-gold">
                      {venture.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-8 text-sm text-mute">
            <Link href="/admin/applications" className="text-gold">
              Open applications
            </Link>
          </p>
        </>
      ) : null}
    </>
  );
}
