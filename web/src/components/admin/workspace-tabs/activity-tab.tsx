import { stageLabel } from "@/lib/admin/pipeline";
import { formatNairobi } from "@/lib/admin/present";
import type { ApplicationFile } from "@/lib/admin/queries";
import { Panel } from "./shared";

export function ActivityTab({ application }: { application: ApplicationFile }) {
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
