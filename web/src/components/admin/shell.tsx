import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["Command", "/admin"],
  ["Applications", "/admin/applications"],
  ["Ventures", "/admin/ventures"],
  ["Founders", "/admin/founders"],
  ["Viability", "/admin/viability"],
  ["Pipeline", "/admin/pipeline"],
  ["Analytics", "/admin/analytics"],
  ["Content", "/admin/content"],
  ["Settings", "/admin/settings"],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-ink text-cream">
      <div className="flex min-h-full flex-col md:flex-row">
        <aside className="border-b border-line md:w-56 md:border-r md:border-b-0">
          <p className="px-5 py-4 text-xs tracking-[0.18em] text-gold uppercase">
            Pesara OS
          </p>
          <nav className="flex flex-wrap gap-3 px-5 pb-4 text-sm text-mute md:flex-col">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-cream">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 px-5 py-10">{children}</main>
      </div>
    </div>
  );
}

export function AdminPlaceholder({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Admin</p>
      <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        {children ??
          "Tables, assignment, comments and viability scores land here in Phase 3. Internal notes never render on founder views."}
      </p>
    </div>
  );
}
