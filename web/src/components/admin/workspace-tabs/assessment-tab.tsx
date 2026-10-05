import { formatNairobi } from "@/lib/admin/present";
import type { ApplicationFile } from "@/lib/admin/queries";
import { AssessmentForm, AssessmentSummary, scoreCaption } from "@/components/admin/review-forms";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "./shared";

export function AssessmentTab({ application }: { application: ApplicationFile }) {
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
