import { WeightForm } from "@/components/admin/review-forms";
import { EmptyState } from "@/components/ui/empty-state";
import { knownMessage, PAGE_ERRORS, PAGE_NOTICES } from "@/lib/admin/pipeline";
import { ASSESSMENT_DISCLAIMER, groupDimensions } from "@/lib/admin/viability";
import { loadDimensionCatalog } from "@/lib/admin/queries";
import { getAuthContext } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/permissions/roles";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [catalog, auth] = await Promise.all([loadDimensionCatalog(), getAuthContext()]);
  const notice = knownMessage(PAGE_NOTICES, params.notice);
  const error = knownMessage(PAGE_ERRORS, params.error);

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Viability</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Pesara Opportunity Assessment</h1>
      <p className="mt-3 max-w-2xl text-sm text-mute">
        Twelve dimensions, scored from 1 (weak) to 5 (exceptional). Weights change the overall mean.
        {` ${ASSESSMENT_DISCLAIMER}`}
      </p>
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      {catalog.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">The viability catalog stays hidden until Pesara is connected.</EmptyState>
        </div>
      ) : null}
      {catalog.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="The viability catalog could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {catalog.status === "ready" ? (
        <>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupDimensions(catalog.dimensions).map((group) => (
              <li key={group.category} className="border border-line px-4 py-4">
                <p className="text-sm text-cream">{group.category}</p>
                <p className="mt-1 text-xs text-mute">{group.items.length} scored parts</p>
              </li>
            ))}
          </ul>
          {isAdminRole(auth?.role) ? <WeightForm dimensions={catalog.dimensions} /> : null}
        </>
      ) : null}
    </>
  );
}