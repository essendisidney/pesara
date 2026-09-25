import { setPublicMetricsAction } from "@/lib/admin/actions";
import { loadMetricFlags } from "@/lib/admin/metrics";
import { knownMessage, PAGE_ERRORS } from "@/lib/admin/pipeline";
import { PIPELINE_METRICS } from "@/lib/public-pipeline";
import { getAuthContext } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/permissions/roles";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const notices: Record<string, string> = {
  metrics: "Public pipeline updated.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const result = await loadMetricFlags();
  const auth = await getAuthContext();
  const notice = knownMessage(notices, query.notice);
  const error = knownMessage(PAGE_ERRORS, query.error);

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Settings</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Public pipeline</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        Homepage numbers come from applications and live ventures. A metric stays off the public site until an admin publishes it. A zero is not shown.
      </p>
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      {result.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">Metric visibility stays hidden until Pesara is connected.</EmptyState>
        </div>
      ) : null}
      {result.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="Settings could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && !isAdminRole(auth?.role) ? (
        <ul className="mt-8 max-w-md space-y-3 text-sm text-cream">
          {PIPELINE_METRICS.map((metric) => (
            <li key={metric.key}>
              {metric.label} · {result.flags[metric.key] ? "Public" : "Hidden"}
            </li>
          ))}
          <li className="text-mute">An admin changes what the homepage can show.</li>
        </ul>
      ) : null}
      {result.status === "ready" && isAdminRole(auth?.role) ? (
        <form action={setPublicMetricsAction} className="mt-8 grid max-w-md gap-4">
          {PIPELINE_METRICS.map((metric) => (
            <label key={metric.key} className="flex min-h-12 items-center gap-3 text-sm text-cream">
              <input type="checkbox" name={metric.key} defaultChecked={result.flags[metric.key]} className="h-4 w-4" />
              {metric.label}
            </label>
          ))}
          <Button type="submit">Save visibility</Button>
        </form>
      ) : null}
    </>
  );
}
