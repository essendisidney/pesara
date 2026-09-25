import Link from "next/link";
import { EmptyState, MetricCard } from "@/components/ui/empty-state";
import { formatNairobi } from "@/lib/admin/present";
import { COMMAND_METRICS } from "@/lib/admin/pipeline";
import { loadCommandCentre, loadReadingQueue } from "@/lib/admin/queries";
import { loadOpenAccountRequests } from "@/lib/admin/office-data";
import { accountRequestLabel } from "@/lib/account-requests";
import { recordAccountRequestAction } from "@/lib/account-actions";

export default async function AdminPage() {
  const [centre, queue, requests] = await Promise.all([loadCommandCentre(), loadReadingQueue(), loadOpenAccountRequests()]);

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
      {centre.status !== "offline" ? <ReadingQueue queue={queue} /> : null}
      {centre.status !== "offline" ? <AccountRequests requests={requests} /> : null}
    </>
  );
}

function ReadingQueue({ queue }: { queue: Awaited<ReturnType<typeof loadReadingQueue>> }) {
  return (
    <section className="mt-12 max-w-3xl">
      <h2 className="text-lg font-semibold">Waiting to be read</h2>
      <p className="mt-2 text-sm text-mute">
        Submitted ideas, oldest first. A person reads each one before it moves into screening. There is no quota and no public rank.
      </p>
      {queue.status === "error" ? <p className="mt-4 text-sm text-mute">The reading list could not be loaded.</p> : null}
      {queue.status === "ready" && queue.ideas.length === 0 ? (
        <p className="mt-4 text-sm text-mute">No idea is waiting to be read.</p>
      ) : null}
      {queue.status === "ready" && queue.ideas.length > 0 ? (
        <>
          {queue.limited ? <p className="mt-4 text-sm text-mute">This list is the oldest 50 ideas still waiting.</p> : null}
          <ol className="mt-4 divide-y divide-line border border-line">
            {queue.ideas.map((idea, index) => (
              <li key={idea.id}>
                <Link href={`/admin/applications/${idea.id}`} className="flex items-baseline justify-between gap-4 px-5 py-4">
                  <span>
                    <span className="text-xs text-mute">{index + 1}</span>
                    <span className="ml-3 text-sm text-cream">{idea.idea}</span>
                    <span className="mt-1 block font-mono text-[11px] tracking-[0.16em] text-gold">{idea.reference}</span>
                  </span>
                  <span className="text-right text-sm text-mute">
                    {idea.country}
                    <span className="mt-1 block">{formatNairobi(idea.submittedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}

function AccountRequests({ requests }: { requests: Awaited<ReturnType<typeof loadOpenAccountRequests>> }) {
  return (
    <section className="mt-12 max-w-3xl">
      <h2 className="text-lg font-semibold">Account requests</h2>
      <p className="mt-2 text-sm text-mute">Export and deletion requests. Marking one recorded does not delete the account or send a file.</p>
      {requests.status === "error" ? <p className="mt-4 text-sm text-mute">Account requests could not be loaded.</p> : null}
      {requests.status === "ready" && requests.requests.length === 0 ? (
        <p className="mt-4 text-sm text-mute">No open account requests.</p>
      ) : null}
      {requests.status === "ready" && requests.requests.length > 0 ? (
        <ul className="mt-4 divide-y divide-line border border-line">
          {requests.requests.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <span>
                <Link href={`/admin/founders/${request.founderId}`} className="text-sm text-cream">
                  {request.name}
                </Link>
                <span className="mt-1 block text-xs text-mute">
                  {accountRequestLabel(request.kind)} · {formatNairobi(request.at)}
                </span>
              </span>
              <form action={recordAccountRequestAction}>
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="founderId" value={request.founderId} />
                <button type="submit" className="min-h-11 text-sm text-gold">
                  Mark recorded
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
