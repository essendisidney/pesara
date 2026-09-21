import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Services" };

const services = [
  "Product Strategy",
  "Software Development",
  "Web Applications",
  "Mobile Applications",
  "AI & Automation",
  "Payments",
  "Cloud Architecture",
  "Data & Analytics",
  "Enterprise Integrations",
  "Technology Advisory",
  "Managed Technology",
];

export default function ServicesPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Pesara Digital" title="Technology built with an owner's mindset.">
        Paid services exist so Pesara can generate cash flow. They do not replace
        the venture studio. Don&apos;t just hire a vendor. Build a business.
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div key={service} className="border border-line px-5 py-6 text-sm">
            {service}
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <Button href="/contact?type=software">Build software</Button>
      </div>
    </SiteShell>
  );
}
