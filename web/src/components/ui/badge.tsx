import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import type { Status } from "@/lib/status";
import { statusClass } from "@/lib/status";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-line px-2 py-0.5 text-[11px] tracking-[0.12em] uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge className={statusClass[status]}>{status}</Badge>;
}
