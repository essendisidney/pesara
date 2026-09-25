import Link from "next/link";
import { loadFounders } from "@/lib/admin/office-data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function Page() {
  const result = await loadFounders();
  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Founders</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">People on applications</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        Contact details come from the account. Notes and meetings stay on this side of the desk.
      </p>
      {result.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">Founder records stay hidden until Pesara is connected.</EmptyState>
        </div>
      ) : null}
      {result.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="Founders could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && result.founders.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No founder profiles yet">A profile appears when someone creates an account.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && result.founders.length > 0 ? (
        <ul className="mt-8 divide-y divide-line border border-line">
          {result.founders.map((founder) => (
            <li key={founder.id}>
              <Link href={`/admin/founders/${founder.id}`} className="block px-5 py-4">
                <p className="text-sm text-cream">{founder.name}</p>
                <p className="mt-1 text-xs text-mute">
                  {founder.place || "Place not recorded"}
                  {founder.applications === 1 ? " · 1 application" : ` · ${founder.applications} applications`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
