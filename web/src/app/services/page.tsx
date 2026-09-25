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
        Studio builds companies. Digital builds technology for a fee. The fee work helps fund the long venture portfolio. It does not, by itself, make Pesara an owner.
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 md:grid-cols-2">
        <article className="border border-line p-6">
          <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">Pesara Studio</p>
          <h2 className="mt-3 text-2xl font-medium">Venture building</h2>
          <p className="mt-4 text-sm leading-relaxed text-mute">
            You bring the idea. Pesara evaluates it, may validate it, and may build the company with you under a written agreement. Fees, revenue share, equity, licensing, or another structure are chosen for that venture.
          </p>
          <div className="mt-6">
            <Button href="/submit">Submit Your Idea</Button>
          </div>
        </article>
        <article className="border border-line p-6">
          <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">Pesara Digital</p>
          <h2 className="mt-3 text-2xl font-medium">Paid technology</h2>
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
