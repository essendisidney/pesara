import { formatNairobi } from "@/lib/admin/present";
import type { ApplicationFile } from "@/lib/admin/queries";
import { CompleteExperimentForm, ExperimentForm } from "@/components/admin/review-forms";
import { EmptyState } from "@/components/ui/empty-state";
import { Lines, Panel } from "./shared";

export function ValidationTab({ application }: { application: ApplicationFile }) {
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
          {experiment.open ? <CompleteExperimentForm applicationId={application.id} experimentId={experiment.id} /> : null}
        </Panel>
      ))}
      <ExperimentForm applicationId={application.id} />
    </>
  );
}
