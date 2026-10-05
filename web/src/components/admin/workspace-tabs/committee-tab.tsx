import Link from "next/link";
import { createVentureAction } from "@/lib/admin/actions";
import { formatNairobi } from "@/lib/admin/present";
import type { ApplicationFile } from "@/lib/admin/queries";
import { CommitteeForm } from "@/components/admin/review-forms";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Lines, Panel } from "./shared";

export function CommitteeTab({
  application,
  canRecordDecision,
  canCreateVenture,
}: {
  application: ApplicationFile;
  canRecordDecision: boolean;
  canCreateVenture: boolean;
}) {
  const latest = application.decisions[0];
  return (
    <>
      {application.decisions.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No committee decision has been recorded">Decisions are written by people.</EmptyState>
        </div>
      ) : null}
      {application.decisions.map((decision) => (
        <CommitteeDecision key={decision.id} decision={decision} />
      ))}
      {application.ventureId ? (
        <p className="mt-8 text-sm text-cream">
          <Link href={`/admin/ventures/${application.ventureId}`} className="text-gold">
            Open the venture workspace
          </Link>
        </p>
      ) : latest?.code === "BUILD" && canCreateVenture ? (
        <form action={createVentureAction} className="mt-8 max-w-xl">
          <input type="hidden" name="applicationId" value={application.id} />
          <p className="text-sm text-mute">
            The latest decision is Build. Creating a venture copies this idea into a workspace and moves the application to venture structuring. It stays off the public portfolio.
          </p>
          <Button type="submit" className="mt-4">
            Create venture
          </Button>
        </form>
      ) : latest?.code === "BUILD" ? (
        <p className="mt-8 text-sm text-mute">An admin can create the venture from this Build decision.</p>
      ) : null}
      {canRecordDecision ? (
        <CommitteeForm applicationId={application.id} staff={application.staff} />
      ) : (
        <p className="mt-8 text-sm text-mute">A committee member records the decision.</p>
      )}
    </>
  );
}

function CommitteeDecision({ decision }: { decision: ApplicationFile["decisions"][number] }) {
  return (
    <Panel title={decision.decision}>
      <p className="text-xs text-mute">{formatNairobi(decision.at)}</p>
      <h3 className="mt-5 text-sm text-cream">Visible to the founder</h3>
      {decision.shared.length ? (
        <div className="mt-3">
          <Lines lines={decision.shared} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-mute">Nothing has been written for the founder on this decision.</p>
      )}
      <h3 className="mt-6 text-sm text-cream">Visible to Pesara staff</h3>
      {decision.internal.length ? (
        <div className="mt-3">
          <Lines lines={decision.internal} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-mute">No internal committee notes on this decision.</p>
      )}
    </Panel>
  );
}
