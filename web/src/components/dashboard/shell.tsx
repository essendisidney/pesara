import Link from "next/link";
import type { ReactNode } from "react";
import { LogoLockup } from "@/components/logo";

const links = [
  ["Overview", "/dashboard"],
  ["Ideas", "/dashboard/ideas"],
  ["Applications", "/dashboard/applications"],
  ["Messages", "/dashboard/messages"],
  ["Documents", "/dashboard/documents"],
  ["Profile", "/dashboard/profile"],
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-ink text-cream">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" aria-label="Pesara home">
            <LogoLockup size={28} inverted />
          </Link>
          <nav className="flex flex-wrap justify-end gap-4 text-sm text-mute">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-cream">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-12">{children}</main>
    </div>
  );
}
