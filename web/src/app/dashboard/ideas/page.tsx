import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { listFounderApplications } from "@/lib/applications/actions";
import { requireFounder } from "@/lib/auth/session";

export default async function DashboardIdeasPage() {
  await requireFounder();
  const applications = await listFounderApplications();

  return (
    <>
      <h1 className="text-2xl font-semibold">Ideas</h1>
      {applications.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No ideas on this account yet.">
            <Link href="/submit" className="text-gold">
              Submit Your Idea
            </Link>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {applications.map((item) => (
            <li key={item.id} className="border border-line px-4 py-4">
              <Link href={`/dashboard/ideas/${item.id}`} className="block">
                <p className="font-medium">{item.payload.ideaName || "Untitled idea"}</p>
                <p className="mt-1 font-mono text-[11px] text-gold">{item.reference ?? "Draft"}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
