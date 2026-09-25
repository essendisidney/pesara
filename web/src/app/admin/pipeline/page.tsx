import Link from "next/link";
import { loadFunnel } from "@/lib/admin/office-data";
import { pipelineHref, stageLabel, type PipelineQuery } from "@/lib/admin/pipeline";
import { EmptyState } from "@/components/ui/empty-state";

const emptyQuery: PipelineQuery = {
  stage: "",
  sector: "",
  country: "",
  analyst: "",
  from: "",
  to: "",
  q: "",
  sort: "submitted",
  dir: "desc",
};

function applicationsHref(patch: Partial<PipelineQuery>): string {
  return pipelineHref(emptyQuery, patch);
}

function CountList({
  rows,
  hrefFor,
}: {
  rows: { key: string; label: string; count: number }[];
  hrefFor?: (key: string) => string | null;
}) {
  return (
    <ul className="mt-4 divide-y divide-line border border-line">
      {rows.map((row) => {
        const href = hrefFor?.(row.key) ?? null;
        const body = (
          <>
            <span className="text-cream">{row.label}</span>
            <span className="text-mute">{row.count}</span>
          </>
        );
        return (
          <li key={row.key}>
            {href ? (
              <Link href={href} className="flex items-baseline justify-between gap-4 px-5 py-4 text-sm">
                {body}
              </Link>
            ) : (
              <div className="flex items-baseline justify-between gap-4 px-5 py-4 text-sm">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default async function Page() {
  const result = await loadFunnel();
  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Pipeline</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Funnel</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        Counts are submitted ideas, grouped by stage, country, industry, and whether the founder arrived through an introduction. Drafts are left out.
      </p>
      {result.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">The funnel stays hidden until Pesara is connected.</EmptyState>
        </div>
      ) : null}
      {result.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="The funnel could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && result.funnel && result.funnel.submitted === 0 ? (
        <div className="mt-10">
          <EmptyState title="No submitted ideas yet">Conversion appears when an idea leaves draft.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && result.funnel && result.funnel.submitted > 0 ? (
        <>
          {result.funnel.limited ? (
            <p className="mt-4 text-sm text-mute">This reading uses the latest 1,000 submitted ideas.</p>
          ) : null}
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Stage</h2>
            <CountList
              rows={result.funnel.stages.map((row) => ({ ...row, label: stageLabel(row.key) }))}
              hrefFor={(key) => applicationsHref({ stage: key })}
            />
          </section>
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Country</h2>
            <CountList
              rows={result.funnel.countries.map((row) => ({ ...row, label: row.key }))}
              hrefFor={(key) => (key === "Not recorded" ? null : applicationsHref({ country: key }))}
            />
          </section>
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Industry</h2>
            <CountList
              rows={result.funnel.industries.map((row) => ({ ...row, label: row.key }))}
              hrefFor={(key) => (key === "Not recorded" ? null : applicationsHref({ sector: key }))}
            />
          </section>
          <section className="mt-10">
            <h2 className="text-lg font-semibold">How they arrived</h2>
            <p className="mt-2 text-sm text-mute">An introduction is a founder whose account records who referred them. Everyone else is direct.</p>
            <CountList rows={result.funnel.sources.map((row) => ({ ...row, label: row.key }))} />
          </section>
        </>
      ) : null}
    </>
  );
}
