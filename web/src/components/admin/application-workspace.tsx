import type { ReactNode } from "react";
import Link from "next/link";
import { addNoteAction, assignAnalystAction, createVentureAction, setStageAction } from "@/lib/admin/actions";
import {
  DETAIL_TABS,
  STAFF_STAGES,
  isStaffStage,
  stageLabel,
  type DetailTab,
} from "@/lib/admin/pipeline";
import { formatNairobi, roleLabel, type Line } from "@/lib/admin/present";
import type { ApplicationFile } from "@/lib/admin/queries";
import { AssessmentForm, AssessmentSummary, CommitteeForm, ExperimentForm, scoreCaption } from "@/components/admin/review-forms";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const controlClass =
  "mt-2 w-full min-h-12 rounded-[2px] border border-line bg-ink-2/80 px-3 text-base text-cream";

function Lines({ lines }: { lines: Line[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {lines.map((item) => (
        <div key={item.label}>
          <dt className="text-xs tracking-[0.14em] text-mute uppercase">{item.label}</dt>
          <dd className="mt-2 text-sm whitespace-pre-wrap text-cream">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 border border-line px-5 py-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ApplicationWorkspace({
  application,
  tab,
  notice,
  error,
  canRecordDecision,
  canCreateVenture,
}: {
  application: ApplicationFile;
  tab: DetailTab;
  notice: string | null;
  error: string | null;
  canRecordDecision: boolean;
  canCreateVenture: boolean;
}) {
  const analysts = application.staff.some((person) => person.id === application.analystId)
    ? application.staff
    : application.analystId
      ? [{ id: application.analystId, name: application.analyst, role: "ANALYST" }, ...application.staff]
      : application.staff;

  return (
    <>
      <Link href="/admin/applications" className="text-sm text-gold">
        Applications
      </Link>
      <p className="mt-6 text-xs tracking-[0.18em] text-gold uppercase">Application</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{application.idea}</h1>
      <p className="mt-3 font-mono text-sm text-cream">{application.reference ?? "No reference yet"}</p>
      <p className="mt-3 max-w-2xl text-sm text-mute">
        {application.founder} · {stageLabel(application.stage)} · {application.analyst}
      </p>
      {application.oneLiner ? <p className="mt-3 max-w-2xl text-sm text-cream">{application.oneLiner}</p> : null}
      <Link href={`/admin/applications/${application.id}/report`} className="mt-4 inline-flex min-h-11 items-center text-sm text-gold">
        Opportunity report
      </Link>
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      <nav className="mt-8 flex gap-5 overflow-x-auto border-b border-line">
        {DETAIL_TABS.map((item) => (
          <Link
            key={item.key}
            href={`/admin/applications/${application.id}?tab=${item.key}`}
            className={`inline-flex min-h-11 shrink-0 items-center border-b-2 text-xs tracking-[0.14em] uppercase ${
              tab === item.key ? "border-gold text-cream" : "border-transparent text-mute"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "overview" ? <Overview application={application} analysts={analysts} /> : null}
      {tab === "application" ? <ApplicationTab application={application} /> : null}
      {tab === "evidence" ? <EvidenceTab application={application} /> : null}
      {tab === "assessment" ? <AssessmentTab application={application} /> : null}
      {tab === "validation" ? <ValidationTab application={application} /> : null}
      {tab === "committee" ? (
        <CommitteeTab application={application} canRecordDecision={canRecordDecision} canCreateVenture={canCreateVenture} />
      ) : null}
      {tab === "documents" ? <DocumentsTab application={application} /> : null}
      {tab === "messages" ? <MessagesTab application={application} /> : null}
      {tab === "activity" ? <ActivityTab application={application} /> : null}
    </>
  );
}

function Overview({
  application,
  analysts,
}: {
  application: ApplicationFile;
  analysts: ApplicationFile["staff"];
}) {
  return (
    <>
      <Panel title="File">
        <Lines
          lines={[
            { label: "Founder", value: application.founder },
            { label: "Country", value: application.country || "—" },
            { label: "Sector", value: application.sector || "—" },
            { label: "Submitted", value: formatNairobi(application.submittedAt) },
            { label: "Last activity", value: formatNairobi(application.lastActivityAt) },
            { label: "Stage", value: stageLabel(application.stage) },
          ]}
        />
      </Panel>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <form action={assignAnalystAction} className="border border-line px-5 py-6">
          <h2 className="text-lg font-semibold">Assigned analyst</h2>
          <input type="hidden" name="applicationId" value={application.id} />
          <label className="mt-4 block text-sm text-mute">
            Staff member
            <select
              name="analystId"
              defaultValue={application.analystId ?? ""}
              className={controlClass}
            >
              <option value="">Unassigned</option>
              {analysts.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {roleLabel(person.role)}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4">
            <Button type="submit">Assign</Button>
          </div>
        </form>
        <form action={setStageAction} className="border border-line px-5 py-6">
          <h2 className="text-lg font-semibold">Stage</h2>
          <p className="mt-2 text-sm text-mute">A person at Pesara sets the stage. The history is kept.</p>
          <input type="hidden" name="applicationId" value={application.id} />
          <label className="mt-4 block text-sm text-mute">
            Next stage
            <select
              name="stage"
              defaultValue={isStaffStage(application.stage) ? application.stage : ""}
              required
              className={controlClass}
            >
              <option value="" disabled>
                Choose a stage
              </option>
              {STAFF_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabel(stage)}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4">
            <Button type="submit">Update stage</Button>
          </div>
        </form>
      </div>
      <Panel title="Internal notes">
        <p className="text-sm text-mute">Visible to Pesara staff.</p>
        <form action={addNoteAction} className="mt-4">
          <input type="hidden" name="applicationId" value={application.id} />
          <label className="block text-sm text-mute">
            Note
            <textarea name="body" rows={4} maxLength={4000} required className={`${controlClass} py-3`} />
          </label>
          <div className="mt-4">
            <Button type="submit">Save note</Button>
          </div>
        </form>
        <NoteList notes={application.notes} />
      </Panel>
    </>
  );
}

function NoteList({ notes }: { notes: ApplicationFile["notes"] }) {
  if (notes.length === 0) return <p className="mt-6 text-sm text-mute">No internal notes yet.</p>;
  return (
    <ul className="mt-6 space-y-4">
      {notes.map((note) => (
        <li key={note.id} className="border-t border-line pt-4">
          <p className="text-xs text-mute">
            {note.author} · {formatNairobi(note.at)}
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{note.body}</p>
        </li>
      ))}
    </ul>
  );
}

function ApplicationTab({ application }: { application: ApplicationFile }) {
  return application.sections.map((section) => (
    <Panel key={section.title} title={section.title}>
      <Lines lines={section.lines} />
    </Panel>
  ));
}

function EvidenceTab({ application }: { application: ApplicationFile }) {
  return (
    <Panel title="Evidence on the application">
      <Lines lines={application.evidence} />
    </Panel>
  );
}

function AssessmentTab({ application }: { application: ApplicationFile }) {
  return (
    <>
      {application.assessments.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No assessment has been recorded">
            Score the dimensions that have evidence. Commentary is required for every score.
          </EmptyState>
        </div>
      ) : null}
      {application.assessments.map((assessment) => (
        <Panel key={assessment.id} title={`Version ${assessment.version} · ${assessment.mean}`}>
          <p className="text-xs text-mute">{formatNairobi(assessment.at)}</p>
          <div className="mt-5">
            <AssessmentSummary scores={assessment.scores} />
          </div>
          {assessment.notes ? (
            <p className="mt-4 text-sm whitespace-pre-wrap text-cream">
              <span className="text-mute">Internal note. </span>
              {assessment.notes}
            </p>
          ) : null}
          <ul className="mt-5 divide-y divide-line">
            {assessment.scores.map((score, index) => (
              <li key={`${assessment.id}-${index}`} className="py-3">
                <p className="text-xs tracking-[0.14em] text-mute uppercase">{score.category}</p>
                <p className="mt-1 text-sm text-cream">
                  {score.label} · {scoreCaption(score.score)}
                </p>
                {score.note ? <p className="mt-2 text-sm text-mute">Internal note. {score.note}</p> : null}
              </li>
            ))}
          </ul>
        </Panel>
      ))}
      <AssessmentForm applicationId={application.id} dimensions={application.dimensions} />
    </>
  );
}

function ValidationTab({ application }: { application: ApplicationFile }) {
  return (
    <>
      {application.experiments.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No validation experiments have been recorded" />
        </div>
      ) : null}
      {application.experiments.map((experiment) => (
        <Panel key={experiment.id} title={experiment.title}>
          <p className="text-xs text-mute">{formatNairobi(experiment.at)}</p>
          {experiment.method ? <p className="mt-3 text-sm whitespace-pre-wrap text-cream">{experiment.method}</p> : null}
          {experiment.lines.length ? (
            <div className="mt-4">
              <Lines lines={experiment.lines} />
            </div>
          ) : null}
          {experiment.results.length === 0 ? <p className="mt-4 text-sm text-mute">No result recorded.</p> : null}
          {experiment.results.map((result) => (
            <div key={result.id} className="mt-4 border-t border-line pt-4">
              <p className="text-xs text-mute">{formatNairobi(result.at)}</p>
              {result.summary ? <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{result.summary}</p> : null}
              {result.evidence.length ? (
                <div className="mt-3">
                  <Lines lines={result.evidence} />
                </div>
              ) : null}
            </div>
          ))}
        </Panel>
      ))}
      <ExperimentForm applicationId={application.id} />
    </>
  );
}

function CommitteeTab({
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

function DocumentsTab({ application }: { application: ApplicationFile }) {
  if (application.documents.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title="No documents have been stored" />
      </div>
    );
  }
  return (
    <ul className="mt-8 divide-y divide-line border border-line">
      {application.documents.map((document) => (
        <li key={document.id} className="px-5 py-4">
          <p className="text-sm text-cream">{document.name}</p>
          <p className="mt-1 text-xs text-mute">
            {[document.mime, document.size, formatNairobi(document.at)].filter((item) => item && item !== "—").join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MessagesTab({ application }: { application: ApplicationFile }) {
  return (
    <Panel title="Messages">
      <p className="text-sm text-mute">Shared with the founder on this application.</p>
      {application.messages.length === 0 ? <p className="mt-4 text-sm text-mute">No messages yet.</p> : null}
      <ul className="mt-4 space-y-4">
        {application.messages.map((message) => (
          <li key={message.id} className="border-t border-line pt-4">
            <p className="text-xs text-mute">
              {message.sender} · {formatNairobi(message.at)}
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{message.body}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ActivityTab({ application }: { application: ApplicationFile }) {
  return (
    <>
      <Panel title="Activity">
        {application.activity.length === 0 ? <p className="text-sm text-mute">No activity has been recorded.</p> : null}
        <ul className="space-y-4">
          {application.activity.map((item) => (
            <li key={item.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
              <p className="text-sm text-cream">{item.summary}</p>
              <p className="mt-1 text-xs text-mute">
                {item.actor} · {formatNairobi(item.at)}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Stage history">
        {application.history.length === 0 ? <p className="text-sm text-mute">No stage changes have been recorded.</p> : null}
        <ul className="space-y-4">
          {application.history.map((item) => (
            <li key={item.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
              <p className="text-sm text-cream">
                {item.from ? `${stageLabel(item.from)} to ${stageLabel(item.to)}` : stageLabel(item.to)}
              </p>
              <p className="mt-1 text-xs text-mute">
                {item.actor} · {formatNairobi(item.at)}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
