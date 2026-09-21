import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Frame } from "@/components/marketing/frame";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Portfolio" };

const work = [
  {
    name: "Marit",
    place: "Nairobi",
    relationship: "Technology by Pesara",
    body: "Premium celebrations — weddings, proposals, and destination days — orchestrated so the hosts can stay present.",
    href: "https://maritevents.com",
  },
  {
    name: "Jameiyah",
    place: "Kenya",
    relationship: "Technology by Pesara",
    body: "Community finance for Kenyan circles: merry-go-round, table banking, and savings, with statements members and officers can both see.",
    href: "https://jameiyah.com",
  },
  {
    name: "Little Scientist",
    place: "Athi River",
    relationship: "Technology by Pesara",
    body: "Big science for little people. Visits, school groups, and birthday bookings at Sabaki Estate.",
    href: "https://little-scientist.vercel.app",
  },
] as const;

export default function PortfolioPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Portfolio" title="Work already in the world.">
        Live companies and products. Each card names the relationship Pesara actually has.
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {work.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block min-h-44"
          >
            <Frame className="flex h-full flex-col px-6 py-7 transition-colors group-hover:border-gold/50">
              <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                {item.relationship}
              </p>
              <h2 className="mt-5 text-2xl font-medium tracking-tight">{item.name}</h2>
              <p className="mt-1 font-mono text-[11px] tracking-[0.16em] text-mute uppercase">
                {item.place}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-mute">{item.body}</p>
              <p className="mt-6 text-[12px] tracking-[0.16em] text-cream uppercase">Visit</p>
            </Frame>
          </a>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <p className="max-w-xl text-sm text-mute">
          Bring the next one. Pesara starts with the problem, then builds the company around it.
        </p>
        <div className="mt-6">
          <Button href="/submit">Submit Your Idea</Button>
        </div>
      </div>
    </SiteShell>
  );
}
