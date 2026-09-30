import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="About" title="Great ideas shouldn't die in notebooks.">
        Pesara Limited is a technology venture studio headquartered in Kenya. Africa is the starting point, not the boundary.
      </PageIntro>
      <div className="mx-auto max-w-3xl space-y-8 px-5 pb-24 text-mute">
        <p>
          Most people with a good idea hit the same wall. Building the technology costs more than they have, and a developer paid by the hour has no reason to care whether the business works. So the idea stays an idea, or it gets built and never earns.
        </p>
        <p className="text-cream">
          You bring the idea. We bring the technology. We get paid when you get paid.
        </p>
        <p>
          Pesara carries the build and is paid from what the business earns: a share of the company, a revenue share that steps down once the build is recovered, and a small fee on money that moves through Pesara Rails. If the venture doesn&apos;t earn, neither does Pesara. That keeps us honest about which ideas we take on.
        </p>
        <p>
          Pesara is built by people who have spent more than fifteen years implementing core banking and payment systems across East Africa. That is why we focus on products money moves through, and why we run the payments ourselves.
        </p>
        <p>
          The philosophy is evidence before engineering. Pesara reads the commercial case, tests the riskiest assumption, and only then builds. A person records every venture decision. A score is a note for that judgement. It is not a prediction.
        </p>
        <p>
          Mission: to make sure great ideas don&apos;t die because someone couldn&apos;t afford to build them.
        </p>
      </div>
    </SiteShell>
  );
}
