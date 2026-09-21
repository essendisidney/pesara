import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="border border-line px-6 py-16 text-center">
      <p className="text-lg text-cream">{title}</p>
      {children ? <div className="mt-3 text-sm text-mute">{children}</div> : null}
    </div>
  );
}

export function LoadingSkeleton() {
  return <div className="h-24 animate-pulse border border-line bg-ink-2" aria-hidden />;
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-5 py-6">
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-mute">{label}</p>
    </div>
  );
}
