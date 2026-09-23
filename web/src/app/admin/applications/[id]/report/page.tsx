import Link from "next/link";
import { PrintReportButton } from "@/components/admin/print-report";
import { EmptyState } from "@/components/ui/empty-state";
import { buildOpportunityReport, reportFromFile } from "@/lib/admin/report";
import { loadApplicationDetail } from "@/lib/admin/queries";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadApplicationDetail(id);
  if (result.status === "missing") {
    return (
      <EmptyState title="Application not found">
        <Link href="/admin/applications" className="text-gold">
          Back to applications
        </Link>
      </EmptyState>
    );
  }
  if (result.status === "offline") {
    return <EmptyState title="Database is not connected">This report stays hidden until Pesara is connected.</EmptyState>;
  }
  if (result.status === "error") {
    return <EmptyState title="This report could not be read">Try opening it again in a moment.</EmptyState>;
  }

  const report = buildOpportunityReport(reportFromFile(result.application));
  return (
    <article>
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link href={`/admin/applications/${result.application.id}`} className="text-sm text-gold">
          Application
        </Link>
        <PrintReportButton />
      </div>
      <p className="mt-6 text-xs tracking-[0.18em] text-gold uppercase">Opportunity report</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{result.application.idea}</h1>
      <p className="mt-4 max-w-2xl text-sm text-mute">{report.disclaimer}</p>
      {report.sections.map((section) => (
        <section key={section.title} className="mt-8 border border-line px-5 py-6">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.body ? <p className="mt-3 text-sm whitespace-pre-wrap text-cream">{section.body}</p> : null}
          {section.lines.length ? (
            <dl className="mt-5 grid gap-4">
              {section.lines.map((line) => (
                <div key={`${section.title}-${line.label}`}>
                  <dt className="text-xs tracking-[0.14em] text-mute uppercase">{line.label}</dt>
                  <dd className="mt-2 text-sm whitespace-pre-wrap text-cream">{line.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ))}
    </article>
  );
}
