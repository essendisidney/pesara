import { EmptyState } from "@/components/ui/empty-state";

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Applications</h1>
      <div className="mt-6">
        <EmptyState title="No submitted applications yet.">
          Each accepted draft receives a reference in the form PSR-YYYY-XXXXXX.
        </EmptyState>
      </div>
    </>
  );
}
