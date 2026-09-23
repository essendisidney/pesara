import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FILTER_STAGES,
  filtersActive,
  formatMean,
  nextSortDir,
  pipelineHref,
  stageLabel,
  type PipelineQuery,
  type SortKey,
} from "@/lib/admin/pipeline";
import { formatNairobi } from "@/lib/admin/present";
import type { PipelineResult, StaffOption } from "@/lib/admin/queries";

const controlClass =
  "mt-2 w-full min-h-12 rounded-[2px] border border-line bg-ink-2/80 px-3 text-base text-cream";

function show(value: string): string {
  return value.trim() ? value : "—";
}

function SortLink({
  label,
  column,
  query,
}: {
  label: string;
  column: SortKey;
  query: PipelineQuery;
}) {
  const active = query.sort === column;
  return (
    <Link
      href={pipelineHref(query, { sort: column, dir: nextSortDir(query, column) })}
      className={`inline-flex min-h-11 items-center gap-2 tracking-[0.12em] uppercase ${active ? "text-cream" : "text-mute"}`}
    >
      {label}
      {active ? <span aria-hidden>{query.dir === "asc" ? "↑" : "↓"}</span> : null}
    </Link>
  );
}

function Options({
  values,
  current,
  labelFor,
}: {
  values: readonly string[];
  current: string;
  labelFor?: (value: string) => string;
}) {
  const items = current && !values.includes(current) ? [current, ...values] : values;
  return items.map((value) => (
    <option key={value} value={value}>
      {labelFor ? labelFor(value) : value}
    </option>
  ));
}

export function PipelineBoard({
  query,
  result,
  notice,
  error,
}: {
  query: PipelineQuery;
  result: PipelineResult;
  notice: string | null;
  error: string | null;
}) {
  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Pipeline</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Applications</h1>
      <p className="mt-3 max-w-2xl text-sm text-mute">
        Assessment is the weighted mean of scores already on file. It is an internal aid for staff.
      </p>
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      <FilterForm query={query} result={result} />
      <Results query={query} result={result} />
    </>
  );
}

function FilterForm({ query, result }: { query: PipelineQuery; result: PipelineResult }) {
  const sectors = result.status === "ready" ? result.sectors : [];
  const countries = result.status === "ready" ? result.countries : [];
  const analysts: StaffOption[] = result.status === "ready" ? result.analysts : [];
  return (
    <form method="get" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm text-mute">
        Stage
        <select name="stage" defaultValue={query.stage} className={controlClass}>
          <option value="">All except drafts</option>
          <Options values={FILTER_STAGES} current={query.stage} labelFor={stageLabel} />
        </select>
      </label>
      <label className="text-sm text-mute">
        Sector
        <select name="sector" defaultValue={query.sector} className={controlClass}>
          <option value="">All sectors</option>
          <Options values={sectors} current={query.sector} />
        </select>
      </label>
      <label className="text-sm text-mute">
        Country
        <select name="country" defaultValue={query.country} className={controlClass}>
          <option value="">All countries</option>
          <Options values={countries} current={query.country} />
        </select>
      </label>
      <label className="text-sm text-mute">
        Analyst
        <select name="analyst" defaultValue={query.analyst} className={controlClass}>
          <option value="">All analysts</option>
          <option value="unassigned">Unassigned</option>
          {query.analyst &&
          query.analyst !== "unassigned" &&
          !analysts.some((analyst) => analyst.id === query.analyst) ? (
            <option value={query.analyst}>Assigned analyst</option>
          ) : null}
          {analysts.map((analyst) => (
            <option key={analyst.id} value={analyst.id}>
              {analyst.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-mute">
        Submitted from
        <input type="date" name="from" defaultValue={query.from} className={controlClass} />
      </label>
      <label className="text-sm text-mute">
        Submitted to
        <input type="date" name="to" defaultValue={query.to} className={controlClass} />
      </label>
      <label className="text-sm text-mute sm:col-span-2">
        Search
        <input
          type="search"
          name="q"
          defaultValue={query.q}
          placeholder="Reference, idea, or founder"
          className={controlClass}
        />
      </label>
      {query.sort !== "submitted" ? <input type="hidden" name="sort" value={query.sort} /> : null}
      {query.dir !== "desc" ? <input type="hidden" name="dir" value={query.dir} /> : null}
      <div className="flex flex-wrap items-end gap-3">
        <Button type="submit">Filter</Button>
        {filtersActive(query) ? (
          <Button href="/admin/applications" variant="line">
            Reset
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Results({ query, result }: { query: PipelineQuery; result: PipelineResult }) {
  if (result.status === "offline") {
    return (
      <div className="mt-10">
        <EmptyState title="Database is not connected">
          Applications stay hidden until Pesara is connected.
        </EmptyState>
      </div>
    );
  }
  if (result.status === "error") {
    return (
      <div className="mt-10">
        <EmptyState title="Applications could not be read">Try the pipeline again in a moment.</EmptyState>
      </div>
    );
  }
  if (result.rows.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState title={filtersActive(query) ? "No applications match these filters" : "No applications yet"}>
          {filtersActive(query) ? "Clear a filter to widen the pipeline." : "Submitted ideas will appear here."}
        </EmptyState>
      </div>
    );
  }

  const columns: { label: string; column: SortKey }[] = [
    { label: "Reference", column: "reference" },
    { label: "Idea", column: "idea" },
    { label: "Founder", column: "founder" },
    { label: "Country", column: "country" },
    { label: "Sector", column: "sector" },
    { label: "Submitted", column: "submitted" },
    { label: "Stage", column: "stage" },
    { label: "Assigned analyst", column: "analyst" },
    { label: "Assessment", column: "assessment" },
    { label: "Last activity", column: "activity" },
  ];

  return (
    <div className="mt-8">
      <p className="text-sm text-mute">
        {result.matched} {result.matched === 1 ? "application" : "applications"}.
        {result.rows.length < result.matched ? ` Showing ${result.rows.length} of ${result.matched}.` : ""}
        {result.limited ? " Filters apply to the 500 most recently active applications." : ""}
      </p>
      <div className="mt-4 overflow-x-auto border border-line">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {columns.map((item) => (
                <th key={item.column} scope="col" className="px-3 font-normal">
                  <SortLink label={item.label} column={item.column} query={query} />
                </th>
              ))}
              <th scope="col" className="px-3 font-normal">
                <span className="inline-flex min-h-11 items-center tracking-[0.12em] text-mute uppercase">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0">
                <td className="px-3 py-3 font-mono text-xs text-cream">{show(row.reference)}</td>
                <td className="px-3 py-3 text-cream">{row.idea}</td>
                <td className="px-3 py-3">{row.founder}</td>
                <td className="px-3 py-3">{show(row.country)}</td>
                <td className="px-3 py-3">{show(row.sector)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{formatNairobi(row.submittedAt)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{stageLabel(row.stage)}</td>
                <td className="px-3 py-3">{row.analyst}</td>
                <td className="px-3 py-3 whitespace-nowrap">{formatMean(row.assessmentMean)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{formatNairobi(row.lastActivityAt)}</td>
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/applications/${row.id}`}
                    className="inline-flex min-h-11 items-center text-gold"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
