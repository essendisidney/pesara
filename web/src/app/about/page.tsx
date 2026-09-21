import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="About" title="Great ideas shouldn't die in notebooks.">
        <p>
          Pesara Limited is a technology venture studio headquartered in Kenya,
          with global ambition. We partner with entrepreneurs, businesses,
          professionals, creators and organisations that have commercially
          promising ideas but lack the technology or execution to bring them to
          market.
        </p>
      </PageIntro>
      <div className="mx-auto max-w-6xl space-y-8 px-5 pb-24 text-mute">
        <p>You bring the idea. We bring the technology. We build the business together.</p>
        <p>
          Pesara evaluates submitted ideas, validates commercial viability, helps
          design the business model, builds the technology, launches the product,
          and may participate through equity, revenue sharing, licensing,
          development fees or another mutually agreed written arrangement.
        </p>
        <p>
          Mission: to ensure great ideas don&apos;t die because someone couldn&apos;t
          build them.
        </p>
        <p>
          Vision: to become the world&apos;s most trusted platform for turning ideas
          into technology companies.
        </p>
        <p>Bring the insight. Pesara brings the engine.</p>
      </div>
    </SiteShell>
  );
}
