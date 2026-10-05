import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Services" };

const digital = [
  "Product strategy",
  "Software development",
  "Web applications",
  "Mobile applications",
  "AI and automation",
  "Payments",
  "Cloud architecture",
  "Data and analytics",
  "Enterprise integrations",
  "Managed technology",
];

export default function ServicesPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Services" title="Two ways to work with Pesara.">
        Pesara Studio co-builds companies and is paid from what they earn. Pesara Digital builds technology for a fee. The fee work keeps the studio independent. It never makes Pesara an owner.
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 md:grid-cols-2">
        <article className="border border-line p-6">
          <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">Pesara Studio</p>
          <h2 className="mt-3 text-2xl font-medium">Co-build</h2>
          <p className="mt-4 text-sm leading-relaxed text-mute">
            You bring the idea and the market. Pesara validates it, builds it on Pesara Rails, and runs its payments. No build invoice: Pesara is paid through equity, a revenue share that steps down once the build is recovered, and a platform fee on the venture's own revenue collected.
          </p>
          <p className="mt-3 text-sm text-mute">Best for products that people pay through.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/submit">Submit Your Idea</Button>
            <Button href="/partnership" variant="line">
              See the terms
            </Button>
          </div>
        </article>
        <article className="border border-line p-6">
          <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">Pesara Digital</p>
          <h2 className="mt-3 text-2xl font-medium">Paid build</h2>
          <p className="mt-4 text-sm leading-relaxed text-mute">
            You pay for the build and own it outright. For businesses, institutions and SACCOs, or any product where money does not pass through it.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-mute">
            {digital.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-6">
            <Button href="/contact" variant="line">
              Build With Pesara
            </Button>
          </div>
        </article>
      </div>
    </SiteShell>
  );
}
