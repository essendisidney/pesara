import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For Businesses" };

const audiences = [
  "SMEs",
  "Corporates",
  "Financial institutions",
  "SACCOs",
  "NGOs",
  "Associations",
  "Professional firms",
  "Enterprise innovators",
];

const work = [
  "Digital product creation",
  "Internal systems",
  "AI automation",
  "Payments",
  "Data",
  "Customer platforms",
  "Enterprise integrations",
  "Venture creation",
];

export default function ForBusinessesPage() {
  return (
    <SiteShell>
      <PageIntro
        eyebrow="Businesses"
        title="Your next technology business may already exist inside your company."
      >
        Pesara partners with organisations that have a market, a distribution path, or an operation — and a product that should exist beside it.
      </PageIntro>
      <section className="mx-auto max-w-6xl px-5">
        <h2 className="text-2xl font-medium tracking-tight">Who this is for</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((item) => (
            <li key={item} className="border border-line px-4 py-3 text-sm text-cream">
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-medium tracking-tight">What we can build together</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {work.map((item) => (
            <li key={item} className="border border-line px-4 py-3 text-sm text-mute">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-sm text-mute">
          A paid build can stand alone. A venture is a separate decision, with a written commercial model.
        </p>
      </section>
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <Button href="/contact">Build With Pesara</Button>
      </div>
    </SiteShell>
  );
}
