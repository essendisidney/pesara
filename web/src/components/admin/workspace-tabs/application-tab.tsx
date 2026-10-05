import type { ApplicationFile } from "@/lib/admin/queries";
import { Lines, Panel } from "./shared";

export function ApplicationTab({ application }: { application: ApplicationFile }) {
  return application.sections.map((section) => (
    <Panel key={section.title} title={section.title}>
      <Lines lines={section.lines} />
    </Panel>
  ));
}

export function EvidenceTab({ application }: { application: ApplicationFile }) {
  return (
    <Panel title="Evidence on the application">
      <Lines lines={application.evidence} />
    </Panel>
  );
}
