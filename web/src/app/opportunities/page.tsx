import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Opportunities" };

const challenges = [
  {
    title: "Agriculture",
    problem: "Smallholders still lose harvest value to opacity, logistics and delayed payment.",
    market: "Kenya and East Africa's agricultural value chains are large, cash-heavy and under-digitised.",
    looking: "A founder who already lives this problem, not a generic farm app.",
  },
  {
    title: "Financial inclusion",
    problem: "Useful money tools still fail people whose income is daily and irregular.",
    market: "Mobile money is ubiquitous; products that respect cash-flow reality are not.",
    looking: "Evidence of a paying customer, not a lecture on inclusion.",
  },
  {
    title: "Mobility",
    problem: "Riders, owners and passengers still run on informal, unrecorded systems.",
    market: "Urban mobility is dense. The opportunity is operations, not another map.",
    looking: "Someone who can reach riders or fleet owners without buying ads.",
  },
  {
    title: "Housing",
    problem: "Finding, paying for and proving occupancy is still slow and informal.",
    market: "Urban housing demand is structural. Trust and payments are the bottleneck.",
    looking: "A wedge that landlords or tenants would pay for this year.",
  },
  {
    title: "Healthcare",
    problem: "Clinics, pharmacies and patients still lose time to paper and missed follow-up.",
    market: "Out-of-pocket care is common. Regulation is real. Shortcuts fail.",
    looking: "A tightly scoped product with a path through licensing.",
  },
  {
    title: "Climate",
    problem: "Adaptation and measurement products rarely survive contact with buyers.",
    market: "The buyer is often not the person who feels the weather.",
    looking: "A clear payer, not a manifesto.",
  },
  {
    title: "Education",
    problem: "Credentials, skills and work still fail to meet.",
    market: "Young populations, expensive training, weak job matching.",
    looking: "Proof that someone other than a student will pay.",
  },
  {
    title: "Informal economy",
    problem: "Most commerce is informal. Software often pretends it is not.",
    market: "Traders, artisans, agents, stage-based work.",
    looking: "A product that works on a cheap Android phone.",
  },
  {
    title: "SME productivity",
    problem: "Small firms leak money through inventory, invoicing and collections.",
    market: "SMEs are numerous. Attention is scarce. Switching is painful.",
    looking: "An operator who already has distribution into a trade.",
  },
  {
    title: "Logistics",
    problem: "Goods move. Information does not.",
    market: "Corridors, last-mile, cold chain, fragmented fleets.",
    looking: "A founder who can sit with dispatchers, not only dashboards.",
  },
  {
    title: "Insurance",
    problem: "Cover is sold. Claims are the product people actually experience.",
    market: "Distribution exists. Trust and operations are the gap.",
    looking: "A specific risk, a specific channel, a path through the regulator.",
  },
];

export default function OpportunitiesPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Originate" title="Problems Pesara wants solved.">
        Founders can bring their own idea. Pesara can also name the problems it
        wants entrepreneurs to work on.
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((item) => (
          <article key={item.title} className="border border-line p-6">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm text-mute">{item.problem}</p>
            <p className="mt-2 text-sm text-mute">{item.market}</p>
            <p className="mt-2 text-sm text-cream">{item.looking}</p>
            <div className="mt-5">
              <Button href="/submit" variant="line" className="h-10 px-4">
                Apply
              </Button>
            </div>
          </article>
        ))}
      </div>
    </SiteShell>
  );
}
