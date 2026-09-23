import { VentureWorkspaceView } from "@/components/admin/venture-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { knownMessage, PAGE_ERRORS } from "@/lib/admin/pipeline";
import { VENTURE_NOTICES } from "@/lib/admin/venture";
import { loadVentureWorkspace } from "@/lib/admin/venture-data";
import { getAuthContext } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/permissions/roles";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const result = await loadVentureWorkspace(id);
  if (result.status === "missing") return <EmptyState title="Venture not found" />;
  if (result.status === "offline") {
    return <EmptyState title="Database is not connected">This workspace stays hidden until Pesara is connected.</EmptyState>;
  }
  if (result.status === "error") {
    return <EmptyState title="This venture could not be read">Try opening it again in a moment.</EmptyState>;
  }
  const auth = await getAuthContext();
  return (
    <VentureWorkspaceView
      venture={result.value}
      canAdminister={isAdminRole(auth?.role)}
      notice={knownMessage(VENTURE_NOTICES, query.notice)}
      error={knownMessage(PAGE_ERRORS, query.error)}
    />
  );
}
