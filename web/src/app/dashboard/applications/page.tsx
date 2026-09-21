import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { listFounderApplications } from "@/lib/applications/actions";
import { requireFounder } from "@/lib/auth/session";

export default async function Page() {
  await requireFounder();
  const submitted = (await listFounderApplications()).filter((item) => item.reference);

  return (
    <>
      <h1 className="text-2xl font-semibold">Applications</h1>
      {submitted.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No submitted applications yet.">
            Each accepted draft receives a reference in the form PSR-YYYY-XXXXXX.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {submitted.map((item) => (
            <li key={item.id} className="border border-line px-4 py-4">
              <Link href={`/dashboard/ideas/${item.id}`}>
                <p className="font-medium">{item.payload.ideaName || "Untitled idea"}</p>
                <p className="mt-1 font-mono text-[11px] text-gold">{item.reference}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
