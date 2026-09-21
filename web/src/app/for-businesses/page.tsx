import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For Businesses" };

export default function ForBusinessesPage() {
  return (
    <SiteShell>
      <PageIntro
        eyebrow="Businesses"
        title="Your next technology business may already exist inside your company."
      >
        For SMEs, corporates, SACCOs, financial institutions, NGOs, associations,
        professional firms, manufacturers, retailers, logistics and insurance
        companies.
      </PageIntro>
      <ul className="mx-auto max-w-6xl columns-1 gap-4 px-5 pb-16 text-sm text-mute sm:columns-2">
        {[
          "New digital products",
          "Internal platforms",
          "Customer applications",
          "AI automation",
          "Process digitisation",
          "Data platforms",
          "Marketplaces",
          "Payments",
          "Mobile applications",
        ].map((item) => (
          <li key={item} className="mb-3 border border-line px-4 py-3 break-inside-avoid">
            {item}
          </li>
        ))}
      </ul>
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <Button href="/contact">Talk to Pesara</Button>
      </div>
    </SiteShell>
  );
}
