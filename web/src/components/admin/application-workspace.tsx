import Link from "next/link";
import { DETAIL_TABS, stageLabel, type DetailTab } from "@/lib/admin/pipeline";
import type { ApplicationFile } from "@/lib/admin/queries";
import { ActivityTab } from "@/components/admin/workspace-tabs/activity-tab";
import { ApplicationTab, EvidenceTab } from "@/components/admin/workspace-tabs/application-tab";
import { AssessmentTab } from "@/components/admin/workspace-tabs/assessment-tab";
import { CommitteeTab } from "@/components/admin/workspace-tabs/committee-tab";
import { DocumentsTab } from "@/components/admin/workspace-tabs/documents-tab";
import { MessagesTab } from "@/components/admin/workspace-tabs/messages-tab";
import { Overview } from "@/components/admin/workspace-tabs/overview-tab";
import { ValidationTab } from "@/components/admin/workspace-tabs/validation-tab";

export function ApplicationWorkspace({
  application,
  tab,
  notice,
  error,
  canRecordDecision,
  canCreateVenture,
}: {
  application: ApplicationFile;
  tab: DetailTab;
  notice: string | null;
  error: string | null;
  canRecordDecision: boolean;
  canCreateVenture: boolean;
}) {
  const analysts = application.staff.some((person) => person.id === application.analystId)
    ? application.staff
    : application.analystId
      ? [{ id: application.analystId, name: application.analyst, role: "ANALYST" }, ...application.staff]
      : application.staff;

  return (
    <>
      <Link href="/admin/applications" className="text-sm text-gold">
        Applications
      </Link>
      <p className="mt-6 text-xs tracking-[0.18em] text-gold uppercase">Application</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{application.idea}</h1>
      <p className="mt-3 font-mono text-sm text-cream">{application.reference ?? "No reference yet"}</p>
      <p className="mt-3 max-w-2xl text-sm text-mute">
        {application.founder} · {stageLabel(application.stage)} · {application.analyst}
      </p>
      {application.oneLiner ? <p className="mt-3 max-w-2xl text-sm text-cream">{application.oneLiner}</p> : null}
      <Link href={`/admin/applications/${application.id}/report`} className="mt-4 inline-flex min-h-11 items-center text-sm text-gold">
        Opportunity report
      </Link>
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      <nav className="mt-8 flex gap-5 overflow-x-auto border-b border-line">
        {DETAIL_TABS.map((item) => (
          <Link
            key={item.key}
            href={`/admin/applications/${application.id}?tab=${item.key}`}
            className={`inline-flex min-h-11 shrink-0 items-center border-b-2 text-xs tracking-[0.14em] uppercase ${
              tab === item.key ? "border-gold text-cream" : "border-transparent text-mute"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "overview" ? <Overview application={application} analysts={analysts} /> : null}
      {tab === "application" ? <ApplicationTab application={application} /> : null}
      {tab === "evidence" ? <EvidenceTab application={application} /> : null}
      {tab === "assessment" ? <AssessmentTab application={application} /> : null}
      {tab === "validation" ? <ValidationTab application={application} /> : null}
      {tab === "committee" ? (
        <CommitteeTab application={application} canRecordDecision={canRecordDecision} canCreateVenture={canCreateVenture} />
      ) : null}
      {tab === "documents" ? <DocumentsTab application={application} /> : null}
      {tab === "messages" ? <MessagesTab application={application} /> : null}
      {tab === "activity" ? <ActivityTab application={application} /> : null}
    </>
  );
}
