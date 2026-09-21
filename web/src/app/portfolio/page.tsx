import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Portfolio" title="Companies Pesara helps bring to market.">
        Ventures appear here when they are real. We will not publish fictional
        investments. A card may read Built by Pesara, A Pesara Company, or
        Technology by Pesara — only according to the actual relationship.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <div className="border border-line px-6 py-16 text-center">
          <p className="text-lg text-mute">The book is still empty. That is honest.</p>
          <p className="mt-2 text-sm text-mute">
            If you are building something that belongs here, start with an idea.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/submit">Submit Your Idea</Button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
