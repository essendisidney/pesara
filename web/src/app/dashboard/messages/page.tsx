import { EmptyState } from "@/components/ui/empty-state";

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Messages</h1>
      <div className="mt-6">
        <EmptyState title="No messages.">
          Pesara writes here when a reviewer needs you.
        </EmptyState>
      </div>
    </>
  );
}
