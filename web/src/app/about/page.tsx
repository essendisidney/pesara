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
          Most software projects fail before the technology matters. Someone commissions a build around an untested problem, a vendor delivers a codebase, and the company never forms. Pesara exists to close that gap.
        </p>
        <p className="text-cream">You bring the idea. We bring the technology. We build the business together.</p>
        <p>
          The philosophy is evidence before engineering, and technology with an owner&apos;s mindset. Pesara reads the commercial case, tests the risky assumption, and only then builds. A person records every venture decision. A score is a note for that judgement. It is not a prediction.
        </p>
        <p>
          Pesara can partner through fees, revenue share, equity, licensing, or another written agreement. The relationship is named on the work. It is never assumed.
        </p>
        <p>
          Mission: to ensure great ideas don&apos;t die because someone couldn&apos;t build them.
        </p>
      </div>
    </SiteShell>
  );
}
