import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getFounderApplication } from "@/lib/applications/actions";
import { FOUNDER_TRACK, nextFounderAction, trackIndex } from "@/lib/applications/stages";
import { requireFounder } from "@/lib/auth/session";

export default async function DashboardIdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFounder();
  const { id } = await params;
  const application = await getFounderApplication(id);
  if (!application) {
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

  const current = trackIndex(application.stage);

  return (
    <>
      <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
        {application.reference ?? "Draft"}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {application.payload.ideaName || "Untitled idea"}
      </h1>
      <p className="mt-3 max-w-2xl text-mute">{application.payload.oneLiner}</p>
      <p className="mt-4 text-sm text-mute">{nextFounderAction(application.stage)}</p>

      <ol className="mt-10 space-y-0">
        {FOUNDER_TRACK.map((item, index) => {
          const done = current >= index;
          const active = current === index;
          return (
            <li key={item.key} className="flex gap-4 border-l border-line py-4 pl-5">
              <span className={`font-mono text-xs ${active ? "text-gold" : "text-mute"}`}>
                {done ? "●" : "○"}
              </span>
              <div>
                <p className={active ? "text-cream" : "text-mute"}>{item.label}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {application.stage === "draft" ? (
        <div className="mt-8">
          <Button href="/submit">Continue application</Button>
        </div>
      ) : null}
      {application.stage === "declined" || application.stage === "parked" ? (
        <p className="mt-8 max-w-xl text-sm text-mute">
          When Pesara records an outcome, the founder-facing note will appear here. Internal
          debate stays internal.
        </p>
      ) : null}
    </>
  );
}
