import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { loadLiveVentures } from "@/lib/admin/queries";
import { loadVentureDirectory } from "@/lib/admin/venture-data";
import { relationshipLabel, ventureStatusLabel } from "@/lib/admin/venture";

export default async function Page() {
  const [directory, live] = await Promise.all([loadVentureDirectory(), loadLiveVentures()]);

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Ventures</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Ventures</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        Internal venture records. A venture is created from a Build decision and stays off the public portfolio.
      </p>
      {live.status === "ready" ? (
        <p className="mt-4 text-sm text-cream">{live.count} live {live.count === 1 ? "venture" : "ventures"}.</p>
      ) : null}
      {directory.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">Ventures stay hidden until Pesara is connected.</EmptyState>
        </div>
      ) : null}
      {directory.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="Ventures could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {directory.status === "ready" && directory.ventures.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No ventures yet">An admin creates a venture after the latest committee decision is Build.</EmptyState>
        </div>
      ) : null}
      {directory.status === "ready" && directory.count > directory.ventures.length ? (
        <p className="mt-8 text-sm text-mute">
          {directory.count} ventures. Showing {directory.ventures.length}.
        </p>
      ) : null}
      {directory.status === "ready" && directory.ventures.length > 0 ? (
        <ul className={`${directory.count > directory.ventures.length ? "mt-4" : "mt-8"} max-w-2xl divide-y divide-line border border-line`}>
          {directory.ventures.map((venture) => (
            <li key={venture.id}>
              <Link href={`/admin/ventures/${venture.id}`} className="block px-5 py-4">
                <p className="text-sm text-cream">{venture.name}</p>
                <p className="mt-1 text-xs text-mute">
                  {ventureStatusLabel(venture.status)} · {relationshipLabel(venture.relationship)}
                  {venture.published ? "" : " · Not on the public portfolio"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
