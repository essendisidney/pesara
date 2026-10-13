import Link from "next/link";
import { RailsStatementDocument } from "@/components/rails/statement-document";
import { EmptyState } from "@/components/ui/empty-state";
import { loadRailsStatement } from "@/lib/rails/data";

export default async function StatementPage({ params }: { params: Promise<{ id: string; statementId: string }> }) {
  const { id, statementId } = await params;
  const result = await loadRailsStatement(id, statementId);
  if (result.status === "offline") {
    return <EmptyState title="Database is not connected">Statements appear here once Pesara is connected.</EmptyState>;
  }
  if (result.status === "error") {
    return <EmptyState title="The statement could not be read">Try opening it again in a moment.</EmptyState>;
  }
  if (result.status === "missing") {
    return <EmptyState title="Statement not found">Only the venture&apos;s founders and the Pesara team can open its statements.</EmptyState>;
  }
  return (
    <>
      <Link href={`/admin/ventures/${id}/rails`} className="no-print text-sm text-gold">
        Back to the books
      </Link>
      <RailsStatementDocument
        ventureId={result.ventureId}
        ventureName={result.ventureName}
        statement={result.statement}
        events={result.events}
      />
    </>
  );
}
