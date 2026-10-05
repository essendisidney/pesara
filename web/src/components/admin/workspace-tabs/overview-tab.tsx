import { addNoteAction, assignAnalystAction, setStageAction } from "@/lib/admin/actions";
import { STAFF_STAGES, isStaffStage, stageLabel } from "@/lib/admin/pipeline";
import { formatNairobi, roleLabel } from "@/lib/admin/present";
import type { ApplicationFile } from "@/lib/admin/queries";
import { Button } from "@/components/ui/button";
import { Lines, Panel, controlClass } from "./shared";

export function Overview({
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
      <Panel title="Team">
        <p className="text-sm text-mute">Named by the founder on this application.</p>
        {application.team.length === 0 ? (
          <p className="mt-4 text-sm text-mute">No team members named.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border border-line">
            {application.team.map((member) => (
              <li key={member.id} className="px-5 py-4 text-sm text-cream">
                {member.name}
                {member.role ? <span className="mt-1 block text-xs text-mute">{member.role}</span> : null}
              </li>
            ))}
          </ul>
        )}
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
