import type { ReactNode } from "react";
import { Footer } from "@/components/marketing/footer";
import { Header } from "@/components/marketing/header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-col bg-ink text-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(900px_420px_at_18%_-10%,rgba(26,60,50,0.28),transparent_58%),radial-gradient(700px_380px_at_88%_0%,rgba(196,164,106,0.08),transparent_50%)]" />
      <Header />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
