import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Frame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative border border-line bg-ink/40", className)}>
      <span className="pointer-events-none absolute top-0 left-0 h-2 w-2 border-t border-l border-gold/80" />
      <span className="pointer-events-none absolute top-0 right-0 h-2 w-2 border-t border-r border-gold/80" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b border-l border-gold/80" />
      <span className="pointer-events-none absolute right-0 bottom-0 h-2 w-2 border-r border-b border-gold/80" />
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium tracking-[0.28em] text-gold uppercase">
      {children}
    </p>
  );
}
