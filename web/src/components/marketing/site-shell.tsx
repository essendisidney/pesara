import type { ReactNode } from "react";
import { Footer } from "@/components/marketing/footer";
import { Header } from "@/components/marketing/header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-ink text-cream">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
