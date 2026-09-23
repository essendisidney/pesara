import {
  recordCommitteeAction,
  saveAssessmentAction,
  saveExperimentAction,
  saveWeightsAction,
} from "@/lib/admin/actions";
import { formatMean } from "@/lib/admin/pipeline";
import {
  ASSESSMENT_DISCLAIMER,
  COMMITTEE_DECISIONS,
  EXPERIMENT_OUTCOMES,
  EXPERIMENT_TYPES,
  SCORE_LABELS,
  assessmentSummary,
  experimentTypeLabel,
  groupDimensions,
  outcomeLabel,
  scoreLabel,
  type DimensionRow,
} from "@/lib/admin/viability";
import { decisionLabel } from "@/lib/admin/present";
import type { ScoreLine, StaffOption } from "@/lib/admin/queries";
import { Button } from "@/components/ui/button";

const controlClass =
  "mt-2 w-full min-h-12 rounded-[2px] border border-line bg-ink-2/80 px-3 text-base text-cream";

export function AssessmentSummary({ scores }: { scores: ScoreLine[] }) {
  const summary = assessmentSummary(scores);
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-gold uppercase">Pesara Opportunity Assessment</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{formatMean(summary.overall)}</p>
      <p className="mt-2 text-sm text-mute">
        {summary.scored} of {summary.total} dimensions scored. {ASSESSMENT_DISCLAIMER}
      </p>
      <ul className="mt-6 space-y-4">
        {summary.categories.map((category) => (
          <li key={category.category}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-cream">{category.category}</span>
              <span className="text-mute">{category.mean == null ? "Not scored" : formatMean(category.mean)}</span>
            </div>
            <div className="mt-2 h-1 bg-ink-2">
              <div
                className="h-1 bg-gold"
                style={{ width: `${category.mean == null ? 0 : (category.mean / 5) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AssessmentForm({
  applicationId,
  dimensions,
}: {
  applicationId: string;
  dimensions: DimensionRow[];
}) {
  const groups = groupDimensions(dimensions);
  return (
    <form action={saveAssessmentAction} className="mt-8 border border-line px-5 py-6">
      <h2 className="text-lg font-semibold">Record an assessment</h2>
      <p className="mt-2 text-sm text-mute">{ASSESSMENT_DISCLAIMER}</p>
      <input type="hidden" name="applicationId" value={applicationId} />
      {groups.map((group) => (
        <fieldset key={group.category} className="mt-8">
          <legend className="text-xs tracking-[0.16em] text-gold uppercase">{group.category}</legend>
          <div className="mt-4 space-y-6">
            {group.items.map((item) => (
              <div key={item.key} className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                <label className="text-sm text-mute">
                  {item.label}
                  <select name={`score:${item.key}`} defaultValue="" className={controlClass}>
                    <option value="">Not scored</option>
                    {SCORE_LABELS.map((score) => (
                      <option key={score.score} value={score.score}>
                        {score.score} — {score.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-mute">
                  Commentary
                  <textarea name={`note:${item.key}`} rows={3} maxLength={2000} className={`${controlClass} py-3`} />
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      <label className="mt-8 block text-sm text-mute">
        Assessment note
        <textarea name="notes" rows={4} maxLength={4000} className={`${controlClass} py-3`} />
      </label>
      <div className="mt-4">
        <Button type="submit">Save assessment</Button>
      </div>
    </form>
  );
}

export function ExperimentForm({ applicationId }: { applicationId: string }) {
  return (
    <form action={saveExperimentAction} className="mt-8 border border-line px-5 py-6">
      <h2 className="text-lg font-semibold">New experiment</h2>
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-mute">
          Type
          <select name="experimentType" required defaultValue="" className={controlClass}>
            <option value="" disabled>
              Choose a type
            </option>
            {EXPERIMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {experimentTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-mute">
          Title
          <input name="title" required maxLength={200} className={controlClass} />
        </label>
        <label className="text-sm text-mute sm:col-span-2">
          Hypothesis
          <textarea name="hypothesis" required rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute sm:col-span-2">
          Method
          <textarea name="method" rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute sm:col-span-2">
          Target
          <input name="target" maxLength={500} className={controlClass} />
        </label>
        <label className="text-sm text-mute">
          Start
          <input type="date" name="startsOn" className={controlClass} />
        </label>
        <label className="text-sm text-mute">
          End
          <input type="date" name="endsOn" className={controlClass} />
        </label>
        <label className="text-sm text-mute sm:col-span-2">
          Success criteria
          <textarea name="success" rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute">
          Cost
          <input name="cost" maxLength={200} className={controlClass} />
        </label>
        <label className="text-sm text-mute">
          Outcome
          <select name="outcome" defaultValue="" className={controlClass}>
            <option value="">Not concluded</option>
            {EXPERIMENT_OUTCOMES.map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcomeLabel(outcome)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-mute sm:col-span-2">
          Results
          <textarea name="results" rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute sm:col-span-2">
          Evidence
          <textarea name="evidence" rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute sm:col-span-2">
          Conclusion
          <textarea name="conclusion" rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
      </div>
      <div className="mt-4">
        <Button type="submit">Save experiment</Button>
      </div>
    </form>
  );
}

export function CommitteeForm({
  applicationId,
  staff,
}: {
  applicationId: string;
  staff: StaffOption[];
}) {
  return (
    <form action={recordCommitteeAction} className="mt-8 border border-line px-5 py-6">
      <h2 className="text-lg font-semibold">Record a decision</h2>
      <p className="mt-2 text-sm text-mute">
        Founder feedback is stored for the founder. Rationale, commercial notes, and technology notes stay with Pesara.
        The decision does not change the application stage by itself.
      </p>
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="mt-4 grid gap-4">
        <label className="text-sm text-mute">
          Decision
          <select name="decision" required defaultValue="" className={controlClass}>
            <option value="" disabled>
              Choose an outcome
            </option>
            {COMMITTEE_DECISIONS.map((decision) => (
              <option key={decision} value={decision}>
                {decisionLabel(decision)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-mute">
          Rationale
          <textarea name="rationale" required rows={4} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute">
          Conditions
          <textarea name="conditions" required rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute">
          Next steps
          <textarea name="nextSteps" required rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute">
          Commercial considerations
          <textarea name="commercial" required rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute">
          Technology considerations
          <textarea name="technology" required rows={3} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <label className="text-sm text-mute">
          Review date
          <input type="date" name="reviewDate" className={controlClass} />
        </label>
        <label className="text-sm text-mute">
          Founder feedback
          <textarea name="founderFeedback" required rows={4} maxLength={4000} className={`${controlClass} py-3`} />
        </label>
        <fieldset>
          <legend className="text-sm text-mute">Committee members</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {staff.map((person) => (
              <label key={person.id} className="flex min-h-11 items-center gap-3 text-sm text-cream">
                <input type="checkbox" name="member" value={person.id} className="h-4 w-4" />
                {person.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-4">
        <Button type="submit">Record decision</Button>
      </div>
    </form>
  );
}

export function WeightForm({ dimensions }: { dimensions: DimensionRow[] }) {
  const groups = groupDimensions(dimensions);
  return (
    <form action={saveWeightsAction} className="mt-8">
      {groups.map((group) => (
        <fieldset key={group.category} className="mt-8">
          <legend className="text-xs tracking-[0.16em] text-gold uppercase">{group.category}</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {group.items.map((item) => (
              <label key={item.key} className="text-sm text-mute">
                {item.label}
                <input
                  name={`weight:${item.key}`}
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  required
                  defaultValue={item.weight}
                  className={controlClass}
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="mt-6">
        <Button type="submit">Save weights</Button>
      </div>
    </form>
  );
}

export function scoreCaption(score: number): string {
  return `${score} / 5 · ${scoreLabel(score)}`;
}
