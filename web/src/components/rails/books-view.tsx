import type { ReactNode } from "react";
import { formatNairobi } from "@/lib/admin/present";
import { lineLabel, monthLabel, recoveryProgress, statementExceptions, type RailsStatement } from "@/lib/rails/books";
import type { RailsBooks } from "@/lib/rails/data";
import { formatBps, formatMinor, recoveryCap } from "@/lib/rails/split";

export function RailsPanel({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="mt-8 border border-line px-5 py-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {note ? <p className="mt-2 max-w-2xl text-sm text-mute">{note}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.14em] text-mute uppercase">{label}</dt>
      <dd className="mt-2 font-mono text-sm text-cream">{value}</dd>
    </div>
  );
}

const STATUS_LABEL: Record<RailsStatement["status"], string> = {
  draft: "Draft",
  issued: "Issued, awaiting payment",
  settled: "Settled",
};

export function RailsHeader({ books, eyebrow }: { books: RailsBooks; eyebrow: string }) {
  return (
    <>
      <p className="mt-6 text-xs tracking-[0.18em] text-gold uppercase">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{books.ventureName}</h1>
      <p className="mt-3 max-w-2xl text-sm text-mute">
        Every payment of the venture&apos;s own revenue, and how it splits. Pesara&apos;s share is paid from a monthly statement; no money moves
        through Pesara in this version. Money the venture holds for its customers is never metered.
      </p>
    </>
  );
}

export function RailsRecovery({ books }: { books: RailsBooks }) {
  const terms = books.active;
  if (!terms) {
    return (
      <RailsPanel title="Agreement">
        <p className="text-sm text-mute">No Rails agreement is active for this venture yet. Nothing is metered until one is signed and activated.</p>
      </RailsPanel>
    );
  }
  const progress = recoveryProgress(terms, books.recoveredMinor);
  return (
    <>
      <RailsPanel
        title="Recovery toward the cap"
        note={`Pesara takes ${formatBps(terms.revenueShareBps)} of gross revenue until its revenue share reaches ${terms.recoveryMultipleX100 / 100}x the build cost, then ${formatBps(terms.tailBps)}. Platform fees do not count toward the cap.`}
      >
        <div className="h-2 w-full bg-ink-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} aria-label="Recovered toward the cap">
          <div className="h-2 bg-gold" style={{ width: `${progress.percent}%` }} />
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <Figure label="Recovered" value={formatMinor(progress.recoveredMinor, terms.currency)} />
          <Figure label="Cap" value={formatMinor(progress.capMinor, terms.currency)} />
          <Figure label="Remaining" value={formatMinor(progress.remainingMinor, terms.currency)} />
        </dl>
        {progress.reached ? <p className="mt-4 text-sm text-cream">The cap is reached. New revenue is shared at the tail rate.</p> : null}
      </RailsPanel>

      <RailsPanel title="Agreement terms">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Figure label="Revenue share" value={formatBps(terms.revenueShareBps)} />
          <Figure label="After recovery" value={formatBps(terms.tailBps)} />
          <Figure label="Platform fee" value={formatBps(terms.platformFeeBps)} />
          <Figure label="Build cost" value={formatMinor(terms.buildCostMinor, terms.currency)} />
          <Figure label="Recovery multiple" value={`${terms.recoveryMultipleX100 / 100}x`} />
          <Figure label="Cap" value={formatMinor(recoveryCap(terms), terms.currency)} />
          <Figure label="Equity" value={formatBps(terms.equityBps)} />
          <Figure label="Effective from" value={terms.effectiveFrom || "—"} />
          <Figure label="Metered kinds" value={terms.revenueKinds.join(", ") || "—"} />
        </dl>
      </RailsPanel>
    </>
  );
}

export function RailsStatements({
  books,
  renderActions,
}: {
  books: RailsBooks;
  renderActions?: (statement: RailsStatement) => ReactNode;
}) {
  const exceptions = statementExceptions(books.statements, books.months);
  return (
    <RailsPanel title="Monthly statements" note="Each closed month gets one statement. The venture pays Pesara's total by M-Pesa or bank, quoting the statement month.">
      {books.statements.length === 0 ? <p className="text-sm text-mute">No statement issued yet.</p> : null}
      <ul className="divide-y divide-line border-y border-line">
        {books.statements.map((statement) => (
          <li key={statement.id} className="py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-cream">{monthLabel(statement.periodMonth)}</p>
              <p className={`text-xs tracking-[0.14em] uppercase ${statement.status === "settled" ? "text-mute" : "text-gold"}`}>{STATUS_LABEL[statement.status]}</p>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <Figure label="Gross" value={formatMinor(statement.grossMinor, statement.currency)} />
              <Figure label="Revenue share" value={formatMinor(statement.revenueShareMinor, statement.currency)} />
              <Figure label="Platform fee" value={formatMinor(statement.platformFeeMinor, statement.currency)} />
              <Figure label="Pesara total" value={formatMinor(statement.pesaraTotalMinor, statement.currency)} />
              <Figure label="To the venture" value={formatMinor(statement.ventureMinor, statement.currency)} />
              <Figure label="Cap remaining" value={formatMinor(statement.capRemainingMinor, statement.currency)} />
            </dl>
            <p className="mt-3 text-xs text-mute">
              {statement.eventCount} {statement.eventCount === 1 ? "event" : "events"} · issued {formatNairobi(statement.issuedAt)}
              {statement.status === "settled" ? ` · settled ${formatNairobi(statement.settledAt)}, reference ${statement.settlementReference ?? "—"}` : ""}
            </p>
            {renderActions ? renderActions(statement) : null}
          </li>
        ))}
      </ul>
      {exceptions.length > 0 ? (
        <div className="mt-6 border border-gold/40 bg-gold/5 px-5 py-4">
          <p className="text-sm text-cream">Exceptions</p>
          <ul className="mt-2 space-y-2">
            {exceptions.map((exception) => (
              <li key={`${exception.statementId}-${exception.message}`} className="text-sm text-mute">
                {monthLabel(exception.periodMonth)}: {exception.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </RailsPanel>
  );
}

export function RailsEvents({ books }: { books: RailsBooks }) {
  return (
    <RailsPanel
      title="Payments and splits"
      note={
        books.eventCount > books.events.length
          ? `The latest ${books.events.length} of ${books.eventCount} events. Statements cover every event.`
          : "Every revenue event and refund recorded, newest first. The lines of each event add up to its gross."
      }
    >
      {books.events.length === 0 ? <p className="text-sm text-mute">No revenue event recorded yet.</p> : null}
      <ul className="divide-y divide-line border-y border-line">
        {books.events.map((event) => (
          <li key={event.id} className="py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-cream">
                {event.reverses ? "Refund" : event.kind}
                <span className="ml-2 font-mono text-xs text-mute">{event.reference ?? event.sourceEventId}</span>
              </p>
              <p className="font-mono text-sm text-cream">{formatMinor(event.grossMinor, event.currency)}</p>
            </div>
            <p className="mt-1 text-xs text-mute">
              {formatNairobi(event.occurredAt)}
              {event.reverses ? ` · reverses ${event.reverses}` : ""}
            </p>
            <ul className="mt-3 space-y-1">
              {event.lines.map((line) => (
                <li key={`${line.line}-${line.tier ?? "none"}`} className="flex justify-between gap-4 text-sm">
                  <span className={line.line === "venture" ? "text-cream" : "text-mute"}>{lineLabel(line)}</span>
                  <span className="font-mono text-mute">{formatMinor(line.amountMinor, event.currency)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </RailsPanel>
  );
}
