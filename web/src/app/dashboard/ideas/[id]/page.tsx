import { EmptyState } from "@/components/ui/empty-state";

export default async function DashboardIdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <>
      <h1 className="text-2xl font-semibold">Idea</h1>
      <div className="mt-6">
        <EmptyState title="This idea is not on your account.">
          Open an idea from your list once it exists. Founder A cannot open Founder B.
        </EmptyState>
      </div>
    </>
  );
}
