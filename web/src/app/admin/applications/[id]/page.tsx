import Link from "next/link";
import { ApplicationWorkspace } from "@/components/admin/application-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { knownMessage, PAGE_ERRORS, PAGE_NOTICES, parseDetailTab } from "@/lib/admin/pipeline";
import { loadApplicationDetail } from "@/lib/admin/queries";
import { getAuthContext } from "@/lib/auth/session";
import { isAdminRole, isCommitteeRole } from "@/lib/permissions/roles";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
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
    return <EmptyState title="Database is not connected">This file stays hidden until Pesara is connected.</EmptyState>;
  }
  if (result.status === "error") {
    return <EmptyState title="This application could not be read">Try opening it again in a moment.</EmptyState>;
  }

  const auth = await getAuthContext();
  return (
    <ApplicationWorkspace
      application={result.application}
      tab={parseDetailTab(query.tab)}
      notice={knownMessage(PAGE_NOTICES, query.notice)}
      error={knownMessage(PAGE_ERRORS, query.error)}
      canRecordDecision={isCommitteeRole(auth?.role)}
      canCreateVenture={isAdminRole(auth?.role)}
    />
  );
}
