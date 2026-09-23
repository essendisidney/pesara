import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Frame } from "@/components/marketing/frame";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Portfolio" };

type Work = {
  name: string;
  place: string;
  relationship: string;
  body: string;
  domain: string;
  href: string;
  logo: string | null;
  logoClass: string;
  mark: { title: string; line: string; accent: string } | null;
};

const work: readonly Work[] = [
  {
    name: "Marit",
    place: "Nairobi",
    relationship: "Technology by Pesara",
    body: "Premium celebrations — weddings, proposals, and destination days — orchestrated so the hosts can stay present.",
    domain: "maritevents.com",
    href: "https://maritevents.com",
    logo: "/portfolio/marit-logo.png",
    logoClass: "h-24 max-w-full",
    mark: null,
  },
  {
    name: "Jameiyah",
    place: "Kenya",
    relationship: "Technology by Pesara",
    body: "Community finance for Kenyan circles: merry-go-round, table banking, and savings, with statements members and officers can both see.",
    domain: "jameiyah.com",
    href: "https://jameiyah.com",
    logo: "/portfolio/jameiyah-mark.png",
    logoClass: "h-14 w-auto",
    mark: null,
  },
  {
    name: "Little Scientist",
    place: "Athi River",
    relationship: "Technology by Pesara",
    body: "Big science for little people. Visits, school groups, and birthday bookings at Sabaki Estate.",
    domain: "littlescientist.ke",
    href: "https://littlescientist.ke",
    logo: null,
    logoClass: "",
    mark: {
      title: "Little Scientist",
      line: "Big Science for Little People",
      accent: "#ffc933",
    },
  },
  {
    name: "Mukuna & Co. Advocates",
    place: "Kenya",
    relationship: "Technology by Pesara",
    body: "Strategic counsel for consequential matters across Kenya and East Africa.",
    domain: "mukunaadvocates.co.ke",
    href: "https://www.mukunaadvocates.co.ke",
    logo: "/portfolio/mukuna-mark.png",
    logoClass: "h-20 w-auto",
    mark: null,
  },
  {
    name: "Athi Gardens",
    place: "Lukenya Hills",
    relationship: "Technology by Pesara",
    body: "Gated plots in Lukenya Hills, about 30 minutes from Nairobi. A project of Athi Plains Holdings.",
    domain: "athigardens.com",
    href: "https://athigardens.com",
    logo: "/portfolio/athi-gardens-logo.png",
    logoClass: "h-auto w-full bg-cream p-3",
    mark: null,
  },
];

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
              <div className="flex min-h-24 items-center">
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt=""
                    className={`${item.logoClass} object-contain object-left`}
                  />
                ) : item.mark ? (
                  <div>
                    <p className="text-base font-extrabold tracking-tight text-white">
                      {item.mark.title}
                    </p>
                    {item.mark.line ? (
                      <p className="text-[11px] font-semibold" style={{ color: item.mark.accent }}>
                        {item.mark.line}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <p className="mt-6 font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                {item.relationship}
              </p>
              <h2 className="mt-3 text-2xl font-medium tracking-tight">{item.name}</h2>
              <p className="mt-1 font-mono text-[11px] tracking-[0.16em] text-mute uppercase">
                {item.place}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-mute">{item.body}</p>
              <p className="mt-6 font-mono text-[12px] tracking-[0.08em] text-cream">
                {item.domain}
              </p>
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
