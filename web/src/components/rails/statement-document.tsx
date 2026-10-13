import { PrintReportButton } from "@/components/admin/print-report";
import { formatNairobi } from "@/lib/admin/present";
import { lineLabel, monthLabel, statementReference, type RailsEvent, type RailsStatement } from "@/lib/rails/books";
import { STATEMENT_EVENT_LIMIT } from "@/lib/rails/data";
import { formatMinor } from "@/lib/rails/split";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 text-sm">
      <dt className={strong ? "text-cream" : "text-mute"}>{label}</dt>
      <dd className={`font-mono ${strong ? "text-cream" : "text-mute"}`}>{value}</dd>
    </div>
  );
}

/**
 * A printable monthly statement. "Print" in the browser saves it as a PDF.
 * Every figure comes from the issued statement row; the event list is the
 * month's events as recorded now, so a late change shows up as a difference.
 */
export function RailsStatementDocument({
  ventureId,
  ventureName,
  statement,
  events,
}: {
  ventureId: string;
  ventureName: string;
  statement: RailsStatement;
  events: RailsEvent[];
}) {
  const money = (minor: number) => formatMinor(minor, statement.currency);
  const reference = statementReference(ventureId, statement.periodMonth);
  const listedGross = events.reduce((sum, event) => sum + event.grossMinor, 0);
  const truncated = statement.eventCount > events.length && events.length >= STATEMENT_EVENT_LIMIT;
  const changed = !truncated && (events.length !== statement.eventCount || listedGross !== statement.grossMinor);

  return (
    <article className="print-sheet mt-6 max-w-3xl border border-line px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-gold uppercase">Pesara Rails statement</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{ventureName}</h1>
          <p className="mt-1 text-sm text-mute">{monthLabel(statement.periodMonth)} · {statement.currency}</p>
        </div>
        <PrintReportButton />
      </div>

      <dl className="mt-8">
        <Row label="Gross revenue metered" value={money(statement.grossMinor)} />
        <Row label="Revenue share" value={money(statement.revenueShareMinor)} />
        <Row label="Platform fee" value={money(statement.platformFeeMinor)} />
        <Row label="Due to Pesara" value={money(statement.pesaraTotalMinor)} strong />
        <Row label="Kept by the venture" value={money(statement.ventureMinor)} />
        <Row label="Recovered to date" value={money(statement.recoveredToDateMinor)} />
        <Row label="Cap remaining" value={money(statement.capRemainingMinor)} />
      </dl>

      <section className="mt-8 text-sm">
        <h2 className="font-semibold text-cream">Payment</h2>
        {statement.status === "settled" ? (
          <p className="mt-2 text-mute">
            Settled {formatNairobi(statement.settledAt)}
            {statement.settledAmountMinor !== null ? ` for ${money(statement.settledAmountMinor)}` : ""}, reference{" "}
            <span className="font-mono">{statement.settlementReference ?? "—"}</span>.
          </p>
        ) : (
          <p className="mt-2 text-mute">
            Pay {money(statement.pesaraTotalMinor)} to Pesara Limited by M-Pesa or bank transfer, quoting{" "}
            <span className="font-mono text-cream">{reference}</span>.
          </p>
        )}
        <p className="mt-2 text-xs text-mute">
          Issued {formatNairobi(statement.issuedAt)}. Shares apply only to the venture&apos;s own revenue, never to money held for its
          customers. Pesara&apos;s lines round down; the venture keeps the remainder.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-cream">
          Events ({statement.eventCount})
        </h2>
        {truncated ? (
          <p className="mt-2 text-xs text-mute">The first {events.length} events are listed; the totals above cover all {statement.eventCount}.</p>
        ) : null}
        {changed ? (
          <p className="mt-2 text-xs text-gold">
            The month&apos;s events have changed since this statement was issued. The totals above are as issued; contact Pesara to reconcile.
          </p>
        ) : null}
        {events.length === 0 ? <p className="mt-2 text-sm text-mute">No events recorded for this month.</p> : null}
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {events.map((event) => (
            <li key={event.id} className="py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-cream">
                  {formatNairobi(event.occurredAt)} · {event.reverses ? "Refund" : event.kind}
                  <span className="ml-2 font-mono text-xs text-mute">{event.reference ?? event.sourceEventId}</span>
                </span>
                <span className="font-mono text-cream">{money(event.grossMinor)}</span>
              </div>
              <ul className="mt-1">
                {event.lines
                  .filter((line) => line.line !== "venture")
                  .map((line) => (
                    <li key={`${line.line}-${line.tier ?? "none"}`} className="flex justify-between gap-4 text-xs text-mute">
                      <span>{lineLabel(line)}</span>
                      <span className="font-mono">{money(line.amountMinor)}</span>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
