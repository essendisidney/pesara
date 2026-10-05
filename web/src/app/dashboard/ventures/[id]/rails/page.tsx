import Link from "next/link";
import { RailsEvents, RailsHeader, RailsRecovery, RailsStatements } from "@/components/rails/books-view";
import { EmptyState } from "@/components/ui/empty-state";
import { requireFounder } from "@/lib/auth/session";
import { loadRailsBooks } from "@/lib/rails/data";

export default async function FounderRailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireFounder();
  const { id } = await params;
  const result = await loadRailsBooks(id, "founder");
  if (result.status === "offline") {
    return <EmptyState title="Database is not connected">Your venture&apos;s books appear here once Pesara is connected.</EmptyState>;
  }
  if (result.status === "error") {
    return <EmptyState title="The books could not be read">Try opening them again in a moment.</EmptyState>;
  }
  if (result.status === "missing") {
    return (
      <EmptyState title="This venture is not on your account.">
        Only the founders of a venture and the Pesara team can open its books.
      </EmptyState>
    );
  }
  const books = result.value;
  return (
    <>
      <Link href="/dashboard" className="text-sm text-gold">
        Dashboard
      </Link>
      <RailsHeader books={books} eyebrow="Pesara Rails" />
      <RailsRecovery books={books} />
      <RailsStatements books={books} />
      <RailsEvents books={books} />
    </>
  );
}
