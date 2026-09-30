import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getFounderApplication } from "@/lib/applications/actions";
import { withdrawApplicationAction } from "@/lib/applications/withdraw-action";
import { loadOwnTeam } from "@/lib/founder/team";
import { addTeamMemberAction, removeTeamMemberAction } from "@/lib/team-actions";
import { Input } from "@/components/ui/input";
import { canWithdraw, FOUNDER_TRACK, nextFounderAction, trackIndex } from "@/lib/applications/stages";
import { requireFounder } from "@/lib/auth/session";
import { loadFounderDecision } from "@/lib/founder/load";
import { formatReviewDate } from "@/lib/founder/outcome";
import { loadFounderVenture } from "@/lib/founder/venture-data";
import { loadFounderDocumentRequests } from "@/lib/founder/inbox";
import { formatNairobi } from "@/lib/admin/present";
import { answerClock, formatDue } from "@/lib/answer-clock";
import { groupFingerprint, ideaFingerprint } from "@/lib/fingerprint";
import { FIRST_ANSWER_WORKING_DAYS } from "@/config/promises";

export default async function DashboardIdeaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireFounder();
  const { id } = await params;
  const query = await searchParams;
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
  const decision = await loadFounderDecision(application.id);
  const team = await loadOwnTeam(application.id);
  const venture = await loadFounderVenture(application.id);
  const requests = await loadFounderDocumentRequests(application.id);
  const clock = answerClock(application.stage, application.submitted_at);
  const fingerprint =
    application.reference && application.submitted_at
      ? ideaFingerprint(application.payload, application.reference, application.submitted_at)
      : null;

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

      {clock.state === "due" || clock.state === "overdue" ? (
        <div className="mt-6 max-w-2xl rounded-[6px] border border-gold/40 bg-gold/5 px-5 py-4">
          <p className="text-sm text-cream">
            Written first answer due by <strong className="font-medium">{formatDue(clock.dueAt)}</strong>
          </p>
          <p className="mt-1 text-xs text-mute">
            {clock.state === "due"
              ? `Pesara promises a written answer within ${FIRST_ANSWER_WORKING_DAYS} working days. ${clock.workingDaysLeft} working ${clock.workingDaysLeft === 1 ? "day" : "days"} left.`
              : `This is past Pesara's ${FIRST_ANSWER_WORKING_DAYS}-working-day promise. The team has been flagged.`}
          </p>
        </div>
      ) : null}

      {fingerprint ? (
        <div className="mt-4 max-w-2xl rounded-[6px] border border-line px-5 py-4">
          <p className="text-xs tracking-[0.14em] text-mute uppercase">Idea fingerprint</p>
          <p className="mt-2 font-mono text-lg tracking-[0.08em] text-cream" title={fingerprint}>
            {groupFingerprint(fingerprint)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-mute">
            A SHA-256 fingerprint of your idea name, summary, problem, customer, solution and money flow,
            with reference {application.reference} and submission time {formatNairobi(application.submitted_at)}.
            Keep it. It shows exactly what you sent and when. Only the review team reads your application.
          </p>
          <details className="mt-2 text-xs text-mute">
            <summary className="cursor-pointer text-gold">Show full fingerprint</summary>
            <p className="mt-2 font-mono break-all text-cream/80">{fingerprint}</p>
          </details>
        </div>
      ) : null}

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
      <section className="mt-10 max-w-xl">
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="mt-2 text-sm text-mute">Name the people on this idea. Pesara staff can read the list.</p>
        {query.notice === "team" ? <p className="mt-4 text-sm text-cream">Team member added.</p> : null}
        {query.notice === "team-removed" ? <p className="mt-4 text-sm text-cream">Team member removed.</p> : null}
        {query.error === "team" ? <p className="mt-4 text-sm text-gold">A team member needs a name.</p> : null}
        {query.error === "team-failed" ? <p className="mt-4 text-sm text-gold">The team list could not be updated.</p> : null}
        {team === null ? <p className="mt-4 text-sm text-mute">The team list could not be read.</p> : null}
        {team && team.length === 0 ? <p className="mt-4 text-sm text-mute">No one named yet.</p> : null}
        {team && team.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border border-line">
            {team.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <p className="text-sm text-cream">
                  {member.name}
                  {member.role ? <span className="mt-1 block text-xs text-mute">{member.role}</span> : null}
                </p>
                <form action={removeTeamMemberAction}>
                  <input type="hidden" name="applicationId" value={application.id} />
                  <input type="hidden" name="memberId" value={member.id} />
                  <Button type="submit" variant="line" className="h-10 px-4">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
        {team ? (
          <form action={addTeamMemberAction} className="mt-4 grid gap-4">
            <input type="hidden" name="applicationId" value={application.id} />
            <label className="text-sm">
              Name
              <Input name="name" required maxLength={120} autoComplete="name" />
            </label>
            <label className="text-sm">
              Role
              <Input name="role" maxLength={80} />
            </label>
            <Button type="submit" variant="line">
              Add team member
            </Button>
          </form>
        ) : null}
      </section>
      {canWithdraw(application.stage) ? (
        <section className="mt-10 max-w-xl">
          <h2 className="text-lg font-semibold">Withdraw</h2>
          <p className="mt-2 text-sm text-mute">
            You can withdraw while this idea is a draft, just submitted, or in screening. Pesara keeps the record.
          </p>
          {query.notice === "withdrawn" ? <p className="mt-4 text-sm text-cream">This application is withdrawn.</p> : null}
          {query.error === "withdraw" ? (
            <p className="mt-4 text-sm text-gold">Tick the box to withdraw this application.</p>
          ) : null}
          {query.error === "withdraw-failed" ? (
            <p className="mt-4 text-sm text-gold">This application could not be withdrawn.</p>
          ) : null}
          <form action={withdrawApplicationAction} className="mt-4">
            <input type="hidden" name="applicationId" value={application.id} />
            <label className="flex min-h-12 items-start gap-3 py-1 text-sm">
              <input type="checkbox" name="confirm" className="mt-1 h-5 w-5" />
              <span>I want to withdraw this application.</span>
            </label>
            <Button type="submit" variant="line" className="mt-4">
              Withdraw
            </Button>
          </form>
        </section>
      ) : null}
      {requests === null ? <p className="mt-10 text-sm text-mute">Document requests could not be read.</p> : null}
      {requests && requests.length > 0 ? (
        <section className="mt-10 max-w-xl">
          <h2 className="text-lg font-semibold">Asked for</h2>
          <p className="mt-2 text-sm text-mute">Pesara asked for these files. The notice stays in the app.</p>
          <ul className="mt-4 divide-y divide-line border border-line">
            {requests.map((request) => (
              <li key={request.id} className="px-5 py-4">
                <p className="text-sm text-cream">{request.kind}</p>
                {request.note ? <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{request.note}</p> : null}
                <p className="mt-2 text-xs text-mute">{formatNairobi(request.at)}</p>
              </li>
            ))}
          </ul>
          <Button href="/dashboard/documents" variant="line" className="mt-4">
            Open documents
          </Button>
        </section>
      ) : null}
      {venture === "error" ? (
        <p className="mt-10 text-sm text-mute">The venture record could not be read.</p>
      ) : null}
      {venture && venture !== "error" ? (
        <section className="mt-10 max-w-2xl border border-line px-5 py-6">
          <p className="text-xs tracking-[0.18em] text-gold uppercase">Venture</p>
          <h2 className="mt-3 text-2xl font-semibold">{venture.name}</h2>
          <p className="mt-2 text-sm text-mute">Commercial terms stay inside Pesara.</p>
          {venture.relationship ? <p className="mt-4 text-sm text-cream">{venture.relationship}</p> : null}
          <p className="mt-2 text-sm text-mute">{[venture.status, venture.stage].filter(Boolean).join(" · ")}</p>
          {venture.description ? <p className="mt-4 text-sm whitespace-pre-wrap text-cream">{venture.description}</p> : null}
          {venture.website ? (
            <a href={venture.website} className="mt-4 inline-flex min-h-11 items-center text-sm text-gold">
              {venture.website}
            </a>
          ) : null}
          {venture.milestones.length > 0 ? (
            <ul className="mt-6 divide-y divide-line border border-line">
              {venture.milestones.map((milestone, index) => (
                <li key={`${milestone.title}-${index}`} className="px-5 py-4 text-sm">
                  <span className="text-cream">{milestone.title}</span>
                  <span className="mt-1 block text-xs text-mute">
                    {milestone.dueOn ? `Due ${formatReviewDate(milestone.dueOn)}` : "No due date"}
                    {milestone.completedAt ? ` · Completed ${formatNairobi(milestone.completedAt)}` : " · Open"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      {decision ? (
        <section className="mt-10 max-w-2xl border border-line px-5 py-6">
          <p className="text-xs tracking-[0.18em] text-gold uppercase">Pesara Decision</p>
          <h2 className="mt-3 text-2xl font-semibold">{decision.title}</h2>
          {decision.feedback ? <p className="mt-4 text-sm whitespace-pre-wrap text-cream">{decision.feedback}</p> : null}
          {decision.nextSteps ? (
            <>
              <h3 className="mt-6 text-sm text-cream">Proposed next step</h3>
              <p className="mt-2 text-sm whitespace-pre-wrap text-mute">{decision.nextSteps}</p>
            </>
          ) : null}
          {decision.reviewDate ? (
            <p className="mt-6 text-sm text-mute">Discussion date {formatReviewDate(decision.reviewDate)}</p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
