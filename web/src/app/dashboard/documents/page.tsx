import { EmptyState } from "@/components/ui/empty-state";

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Documents</h1>
      <div className="mt-6">
        <EmptyState title="No documents.">
          Supporting files attach to an application once storage is connected.
        </EmptyState>
      </div>
    </>
  );
}
