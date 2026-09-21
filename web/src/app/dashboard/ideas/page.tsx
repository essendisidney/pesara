import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardIdeasPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Ideas</h1>
      <div className="mt-6">
        <EmptyState title="No ideas on this account yet.">
          <Link href="/submit" className="text-gold">
            Submit Your Idea
          </Link>
        </EmptyState>
      </div>
    </>
  );
}
