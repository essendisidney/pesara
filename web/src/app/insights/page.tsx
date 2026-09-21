import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Insights" title="Editorial, not noise.">
        Ideas, technology, startups, markets, Africa, product, capital, research
        and founder stories. Pieces appear when they are written.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-5 pb-24 text-sm text-mute">
        No articles yet. Pesara will not fill this page with placeholder thought
        leadership.
      </div>
    </SiteShell>
  );
}
