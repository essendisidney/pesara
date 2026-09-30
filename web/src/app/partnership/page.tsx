import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Eyebrow, Frame } from "@/components/marketing/frame";
import { Button } from "@/components/ui/button";
import {
  EXAMPLE,
  PROTECTIONS,
  SETTLEMENT_STEPS,
  SHARES,
  TERMS,
  illustrate,
  kes,
} from "@/config/partnership";

export const metadata: Metadata = {
  title: "Partnership",
  description:
    "How Pesara co-builds with founders: equity, a revenue share that steps down, and a platform fee, collected when the money settles.",
};

const founderBrings = [
  "A problem you understand from the inside",
  "Access to the first customers: a community, a trade, a network",
  "Time to run the business day to day",
  "Licences, relationships or an existing operation, if you have them",
];

const pesaraBrings = [
  "Product design and engineering, web and mobile",
  "Payments, ledgers and hosting on Pesara Rails",
  "Validation before the build, so money isn't spent on guesses",
  "Launch support, reporting and ongoing upgrades",
];

const questions = [
  [
    "Do I pay anything up front?",
    "In a co-build, no build invoice. Pesara carries the build cost and recovers it from the revenue share. Some ventures agree a small founder contribution to cover third-party costs such as licences or devices.",
  ],
  [
    "Why a revenue share and equity?",
    "The revenue share repays the build while the company is young. The equity is what Pesara earns if the company becomes valuable. Together they keep the upfront cost to the founder at zero.",
  ],
  [
    "What if the venture never makes money?",
    "Then Pesara earns nothing from it. That is the risk Pesara takes, and it is why every idea is validated before we build.",
  ],
  [
    "Who owns the product?",
    "The venture owns its brand, customers, data and the features built for it. The shared platform underneath stays with Pesara and is licensed to the venture.",
  ],
  [
    "Are these percentages fixed?",
    "No. They are typical starting points. The final terms depend on what each side brings and are written into a separate agreement for each venture.",
  ],
] as const;

export default function PartnershipPage() {
  const x = illustrate();
  return (
    <SiteShell>
      <PageIntro eyebrow="Partnership" title="We get paid when you get paid.">
        You bring the idea and the market. Pesara brings the technology and the payment
        rails. Pesara is paid from what the business earns, so the only way we win is if you
        do.
      </PageIntro>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-2">
        <Frame className="p-7">
          <h2 className="text-lg font-medium">What you bring</h2>
          <ul className="mt-4 space-y-2 text-sm text-mute">
            {founderBrings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Frame>
        <Frame className="p-7">
          <h2 className="text-lg font-medium">What Pesara brings</h2>
          <ul className="mt-4 space-y-2 text-sm text-mute">
            {pesaraBrings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Frame>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Eyebrow>The three shares</Eyebrow>
        <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          How Pesara is paid.
        </h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {SHARES.map((share) => (
            <div key={share.key} className="grid gap-3 py-7 md:grid-cols-[14rem_12rem_1fr]">
              <h3 className="text-xl font-medium">{share.name}</h3>
              <p className="font-mono text-[12px] tracking-[0.14em] text-gold uppercase">
                {share.range}
              </p>
              <p className="text-sm leading-relaxed text-mute">{share.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink-2/80">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>Worked example</Eyebrow>
          <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
            A venture earning {kes(EXAMPLE.monthlyRevenue)} a month.
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-mute">
            Illustrative only. Not a quote, a forecast or a real client. Build cost{" "}
            {kes(EXAMPLE.buildCost)}. Terms: {EXAMPLE.equity}% equity, {EXAMPLE.revenueShare}%
            revenue share until Pesara recovers {EXAMPLE.recoveryMultiple}× the build cost, then{" "}
            {EXAMPLE.tail}%, and a {EXAMPLE.platformFee}% platform fee.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Frame className="p-7">
              <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                First {x.monthsToCap} months
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">Revenue share ({EXAMPLE.revenueShare}%)</dt>
                  <dd>{kes(x.share)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">Platform fee ({EXAMPLE.platformFee}%)</dt>
                  <dd>{kes(x.platform)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-3">
                  <dt className="text-cream">Stays with the venture</dt>
                  <dd className="text-cream">
                    {kes(x.ventureKeepsEarly)} ({Math.round(x.keepsEarlyPercent)}%)
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-xs text-mute">
                The revenue share steps down once {kes(x.cap)} is recovered, which takes about{" "}
                {x.monthsToCap} months at this level.
              </p>
            </Frame>
            <Frame className="p-7">
              <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                After recovery
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">Revenue share ({EXAMPLE.tail}%)</dt>
                  <dd>{kes(x.tail)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">Platform fee ({EXAMPLE.platformFee}%)</dt>
                  <dd>{kes(x.platform)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-3">
                  <dt className="text-cream">Stays with the venture</dt>
                  <dd className="text-cream">
                    {kes(x.ventureKeepsLater)} ({Math.round(x.keepsLaterPercent)}%)
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-xs text-mute">
                Pesara also holds {EXAMPLE.equity}% of the company, vesting over{" "}
                {TERMS.vestingYears} years. The founder side keeps {100 - EXAMPLE.equity}%.
              </p>
            </Frame>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Eyebrow>Collection</Eyebrow>
        <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          The split happens when the money settles.
        </h2>
        <ol className="mt-10 grid gap-px bg-line md:grid-cols-3">
          {SETTLEMENT_STEPS.map((step, index) => (
            <li key={step.title} className="bg-ink px-6 py-8">
              <p className="font-mono text-[11px] tracking-[0.24em] text-gold">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mute">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-2xl text-sm text-mute">
          Pesara Rails is in development. Until a venture&apos;s payments run on it, shares are
          settled monthly from the venture&apos;s statements, and the founder can see the
          calculation line by line.
        </p>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>Protection</Eyebrow>
          <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
            Written so both sides can trust it.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROTECTIONS.map((item) => (
              <article key={item.title} className="border border-line p-6">
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Eyebrow>When it&apos;s a fee instead</Eyebrow>
        <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          Not every idea fits a co-build.
        </h2>
        <p className="mt-5 max-w-2xl text-mute">
          If money doesn&apos;t pass through the product, or you would rather own it outright,
          Pesara Digital builds it for a fee. Paid work never becomes an ownership claim.
        </p>
        <div className="mt-8">
          <Button href="/services" variant="line">
            See Pesara Digital
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="text-2xl font-medium tracking-tight">Questions</h2>
        <dl className="mt-6 grid gap-6">
          {questions.map(([question, answer]) => (
            <div key={question} className="border-t border-line pt-4">
              <dt className="text-sm text-cream">{question}</dt>
              <dd className="mt-2 max-w-3xl text-sm text-mute">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-5 pb-24">
        <Button href="/submit">Submit Your Idea</Button>
        <Button href="/idea-check" variant="line">
          Test My Idea
        </Button>
      </div>
    </SiteShell>
  );
}
