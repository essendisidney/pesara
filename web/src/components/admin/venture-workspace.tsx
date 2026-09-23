import type { ReactNode } from "react";
import Link from "next/link";
import {
  addVentureKpiAction,
  addVentureMilestoneAction,
  addVentureNoteAction,
  updateVentureAction,
} from "@/lib/admin/actions";
import { formatNairobi } from "@/lib/admin/present";
import type { VentureWorkspace } from "@/lib/admin/venture-data";
import {
  COMMERCIAL_KINDS,
  PUBLIC_RELATIONSHIPS,
  VENTURE_STATUSES,
  commercialKindLabel,
  relationshipLabel,
  ventureStatusLabel,
} from "@/lib/admin/venture";
import { formatReviewDate } from "@/lib/founder/outcome";
import { Button } from "@/components/ui/button";

const controlClass = "mt-2 w-full min-h-12 rounded-[2px] border border-line bg-ink-2/80 px-3 text-base text-cream";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 border border-line px-5 py-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-cream">
      {label}
      {children}
    </label>
  );
}

export function VentureWorkspaceView({
  venture,
  canAdminister,
  notice,
  error,
}: {
  venture: VentureWorkspace;
  canAdminister: boolean;
  notice: string | null;
  error: string | null;
}) {
  return (
    <>
      <Link href="/admin/ventures" className="text-sm text-gold">
        Ventures
      </Link>
      <p className="mt-6 text-xs tracking-[0.18em] text-gold uppercase">Venture</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{venture.name}</h1>
      <p className="mt-3 text-sm text-mute">
        {ventureStatusLabel(venture.status)} · {venture.stage || "Stage not set"} · {relationshipLabel(venture.relationship)}
      </p>
      {venture.published ? null : <p className="mt-2 text-sm text-mute">Not on the public portfolio.</p>}
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}

      <Panel title="Profile">
        {venture.description ? <p className="text-sm whitespace-pre-wrap text-cream">{venture.description}</p> : <p className="text-sm text-mute">No description yet.</p>}
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-[0.14em] text-mute uppercase">Sector</dt>
            <dd className="mt-2 text-sm text-cream">{venture.sector || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.14em] text-mute uppercase">Country</dt>
            <dd className="mt-2 text-sm text-cream">{venture.country || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.14em] text-mute uppercase">Website</dt>
            <dd className="mt-2 text-sm text-cream">{venture.website || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.14em] text-mute uppercase">Opened</dt>
            <dd className="mt-2 text-sm text-cream">{formatNairobi(venture.createdAt)}</dd>
          </div>
        </dl>
        <h3 className="mt-6 text-sm text-cream">Founders</h3>
        {venture.founders.length === 0 ? <p className="mt-2 text-sm text-mute">No founder recorded.</p> : null}
        <ul className="mt-2 space-y-1">
          {venture.founders.map((founder) => (
            <li key={founder.id} className="text-sm text-cream">
              {founder.name}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Technology">
        {venture.technologyNotes ? (
          <p className="text-sm whitespace-pre-wrap text-cream">{venture.technologyNotes}</p>
        ) : (
          <p className="text-sm text-mute">No technology notes yet.</p>
        )}
      </Panel>

      <Panel title="Internal commercial model">
        <p className="text-sm text-mute">These terms stay inside Pesara. They are not shown to founders or on the public site.</p>
        <dl className="mt-5 grid gap-4">
          <div>
            <dt className="text-xs tracking-[0.14em] text-mute uppercase">Kind</dt>
            <dd className="mt-2 text-sm text-cream">{commercialKindLabel(venture.commercialKind)}</dd>
          </div>
          <CommercialLine label="Pesara contribution" value={venture.pesaraContribution} />
          <CommercialLine label="Founder contribution" value={venture.founderContribution} />
          <CommercialLine label="Commercial terms" value={venture.commercialTerms} />
          <CommercialLine label="Revenue share" value={venture.revenueShare} />
          <CommercialLine label="Equity interest" value={venture.equityInterest} />
          <div>
            <dt className="text-xs tracking-[0.14em] text-mute uppercase">Agreement date</dt>
            <dd className="mt-2 text-sm text-cream">{venture.agreementDate ? formatReviewDate(venture.agreementDate) : "—"}</dd>
          </div>
          <CommercialLine label="Agreement document" value={venture.agreementDocument} />
        </dl>
      </Panel>

      {canAdminister ? <ProfileForm venture={venture} /> : <p className="mt-8 text-sm text-mute">An admin updates the profile and commercial terms.</p>}

      <Panel title="Milestones">
        {venture.milestones.length === 0 ? <p className="text-sm text-mute">No milestones yet.</p> : null}
        <ul className="space-y-3">
          {venture.milestones.map((milestone) => (
            <li key={milestone.id} className="text-sm text-cream">
              {milestone.title}
              <span className="mt-1 block text-xs text-mute">
                {milestone.dueOn ? `Due ${formatReviewDate(milestone.dueOn)}` : "No due date"}
                {milestone.completedAt ? ` · Completed ${formatNairobi(milestone.completedAt)}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <form action={addVentureMilestoneAction} className="mt-6 grid gap-4">
          <input type="hidden" name="ventureId" value={venture.id} />
          <Field label="Milestone">
            <input name="title" required maxLength={200} className={controlClass} />
          </Field>
          <Field label="Due date">
            <input name="dueOn" type="date" className={controlClass} />
          </Field>
          <Button type="submit">Add milestone</Button>
        </form>
      </Panel>

      <Panel title="KPIs">
        <p className="text-sm text-mute">Staff-entered snapshots. Nothing here is seeded revenue.</p>
        {venture.kpis.length === 0 ? <p className="mt-4 text-sm text-mute">No KPIs yet.</p> : null}
        <ul className="mt-4 space-y-3">
          {venture.kpis.map((kpi) => (
            <li key={kpi.id} className="text-sm text-cream">
              {kpi.label}
              <span className="mt-1 block text-xs text-mute">
                {kpi.value}
                {kpi.capturedOn ? ` · ${formatReviewDate(kpi.capturedOn)}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <form action={addVentureKpiAction} className="mt-6 grid gap-4">
          <input type="hidden" name="ventureId" value={venture.id} />
          <Field label="Label">
            <input name="label" required maxLength={80} className={controlClass} />
          </Field>
          <Field label="Value">
            <input name="value" required inputMode="decimal" className={controlClass} />
          </Field>
          <Button type="submit">Record KPI</Button>
        </form>
      </Panel>

      <Panel title="Documents">
        {venture.documents.length === 0 ? (
          <p className="text-sm text-mute">No documents have been stored. File upload waits for a storage bucket.</p>
        ) : (
          <ul className="space-y-3">
            {venture.documents.map((document) => (
              <li key={document.id} className="text-sm text-cream">
                {document.title}
                <span className="mt-1 block text-xs text-mute">{formatNairobi(document.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Notes">
        <p className="text-sm text-mute">Internal. Not shown to the founder.</p>
        <ul className="mt-4 space-y-4">
          {venture.notes.map((note) => (
            <li key={note.id} className="border-t border-line pt-4">
              <p className="text-xs text-mute">
                {note.author} · {formatNairobi(note.at)}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{note.body}</p>
            </li>
          ))}
        </ul>
        <form action={addVentureNoteAction} className="mt-6 grid gap-4">
          <input type="hidden" name="ventureId" value={venture.id} />
          <Field label="Note">
            <textarea name="body" required maxLength={4000} rows={4} className={controlClass} />
          </Field>
          <Button type="submit">Save note</Button>
        </form>
      </Panel>
    </>
  );
}

function CommercialLine({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.14em] text-mute uppercase">{label}</dt>
      <dd className="mt-2 text-sm whitespace-pre-wrap text-cream">{value || "—"}</dd>
    </div>
  );
}

function ProfileForm({ venture }: { venture: VentureWorkspace }) {
  return (
    <form action={updateVentureAction} className="mt-8 grid max-w-2xl gap-4 border border-line px-5 py-6">
      <h2 className="text-lg font-semibold">Update workspace</h2>
      <input type="hidden" name="ventureId" value={venture.id} />
      <Field label="Name">
        <input name="name" required maxLength={200} defaultValue={venture.name} className={controlClass} />
      </Field>
      <Field label="Description">
        <textarea name="description" maxLength={4000} rows={3} defaultValue={venture.description ?? ""} className={controlClass} />
      </Field>
      <Field label="Sector">
        <input name="industry" maxLength={200} defaultValue={venture.sector ?? ""} className={controlClass} />
      </Field>
      <Field label="Country">
        <input name="country" maxLength={80} defaultValue={venture.country ?? ""} className={controlClass} />
      </Field>
      <Field label="Stage">
        <input name="stage" maxLength={80} defaultValue={venture.stage ?? ""} className={controlClass} />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={venture.status} className={controlClass}>
          {VENTURE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ventureStatusLabel(status)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Pesara relationship">
        <select name="relationship" defaultValue={venture.relationship} className={controlClass}>
          {PUBLIC_RELATIONSHIPS.map((relationship) => (
            <option key={relationship} value={relationship}>
              {relationshipLabel(relationship)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Website">
        <input name="website" defaultValue={venture.website ?? ""} placeholder="https://" className={controlClass} />
      </Field>
      <Field label="Technology notes">
        <textarea name="technology" maxLength={4000} rows={3} defaultValue={venture.technologyNotes ?? ""} className={controlClass} />
      </Field>
      <Field label="Commercial kind">
        <select name="commercialKind" defaultValue={venture.commercialKind ?? ""} className={controlClass}>
          <option value="">Not set</option>
          {COMMERCIAL_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {commercialKindLabel(kind)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Pesara contribution">
        <textarea name="pesaraContribution" maxLength={4000} rows={3} defaultValue={venture.pesaraContribution ?? ""} className={controlClass} />
      </Field>
      <Field label="Founder contribution">
        <textarea name="founderContribution" maxLength={4000} rows={3} defaultValue={venture.founderContribution ?? ""} className={controlClass} />
      </Field>
      <Field label="Commercial terms">
        <textarea name="commercialTerms" maxLength={4000} rows={3} defaultValue={venture.commercialTerms ?? ""} className={controlClass} />
      </Field>
      <Field label="Revenue share">
        <input name="revenueShare" maxLength={200} defaultValue={venture.revenueShare ?? ""} className={controlClass} />
      </Field>
      <Field label="Equity interest">
        <input name="equityInterest" maxLength={200} defaultValue={venture.equityInterest ?? ""} className={controlClass} />
      </Field>
      <Field label="Agreement date">
        <input name="agreementDate" type="date" defaultValue={venture.agreementDate ?? ""} className={controlClass} />
      </Field>
      <Field label="Agreement document">
        <input name="agreementDocument" maxLength={400} defaultValue={venture.agreementDocument ?? ""} className={controlClass} />
      </Field>
      <Button type="submit">Save workspace</Button>
    </form>
  );
}
