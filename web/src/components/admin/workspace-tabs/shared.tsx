import type { ReactNode } from "react";
import type { Line } from "@/lib/admin/present";

export const controlClass =
  "mt-2 w-full min-h-12 rounded-[2px] border border-line bg-ink-2/80 px-3 text-base text-cream";

export function Lines({ lines }: { lines: Line[] }) {
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

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 border border-line px-5 py-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
