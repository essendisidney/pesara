import Link from "next/link";
import { SiteShell } from "@/components/marketing/site-shell";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Eyebrow, Frame } from "@/components/marketing/frame";
import { UrbanField } from "@/components/marketing/urban-field";
import { Button } from "@/components/ui/button";
import { MONEY_MOVES, SETTLEMENT_STEPS, SHARES } from "@/config/partnership";
import { getPublicMetrics } from "@/lib/metrics";

const stages = ["Idea", "Validate", "Build", "Launch", "Earn together"] as const;

const rails = [
  { name: "Collections & settlement", items: "M-Pesa, cards, bank transfers, automatic splits, reconciliation", state: "Developing" },
  { name: "Ledgers", items: "Member and customer accounts, balances, statements, audit trail", state: "Developing" },
  { name: "Identity", items: "Sign-in, profiles, KYC, roles, permissions", state: "Developing" },
  { name: "Commerce", items: "Orders, bookings, invoices, subscriptions, instalments", state: "Developing" },
  { name: "Communication", items: "SMS, WhatsApp, email, push notifications", state: "Developing" },
  { name: "Operations", items: "Admin, support, reporting, analytics", state: "Developing" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const metrics = await getPublicMetrics();
  const query = await searchParams;
  const waitlist = typeof query.waitlist === "string" ? query.waitlist : null;

  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 pt-16 pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-16">
          <div>
            <Eyebrow>Technology venture studio</Eyebrow>
            <h1 className="mt-7 text-[2.6rem] leading-[1.02] font-medium tracking-[-0.05em] sm:text-6xl lg:text-[4.1rem]">
              You bring the idea.
              <br />
              We bring the technology.
              <br />
              <span className="text-gold">We get paid when you get paid.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-mute sm:text-lg">
              Pesara co-builds companies with founders. We design and engineer the product,
              run its payments, and take our share from what it earns. No big invoice up
              front. If the business doesn&apos;t earn, neither do we.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/submit">Submit Your Idea</Button>
              <Button href="/partnership" variant="line">
                How the partnership works
              </Button>
            </div>
            <p className="mt-6 text-sm text-mute">
              Not sure yet?{" "}
              <Link href="/idea-check" className="text-gold">
                Test your idea in five minutes
              </Link>
              .
            </p>
          </div>
          <div className="relative">
            <UrbanField />
            <ol className="absolute inset-0 flex flex-col justify-center gap-1 p-8 sm:p-10">
              {stages.map((stage, index) => (
                <li
                  key={stage}
                  className="flex items-baseline justify-between border-b border-line/80 py-3 last:border-b-0"
                >
                  <span className="font-mono text-[10px] tracking-[0.22em] text-gold uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xl font-medium tracking-tight sm:text-2xl">{stage}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-2 px-5 py-4 font-mono text-[10px] tracking-[0.22em] text-mute uppercase">
            <span>Co-build, not contract</span>
            <span>Nairobi</span>
            <span>Africa → the world</span>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-ink-2/80">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Eyebrow>The partnership</Eyebrow>
          <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
            One partnership. Three ways we share what the business earns.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {SHARES.map((share) => (
              <Frame key={share.key} className="flex flex-col p-7">
                <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                  {share.range}
                </p>
                <h3 className="mt-3 text-xl font-medium">{share.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">{share.body}</p>
              </Frame>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-sm text-mute">
            Typical starting ranges. The founder keeps the majority of the company, and every
            venture has its own written agreement.{" "}
            <Link href="/partnership" className="text-gold">
              See a worked example
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <Eyebrow>Paid at the till</Eyebrow>
        <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
          No invoices to chase. No books to audit. The split happens when the money settles.
        </h2>
        <ol className="mt-12 grid gap-px bg-line md:grid-cols-3">
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
          settled monthly from the venture&apos;s statements.
        </p>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-2">
          <div>
            <Eyebrow>What we back</Eyebrow>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
              Ideas where money moves.
            </h2>
            <p className="mt-6 max-w-md text-mute">
              We co-build products that people pay through: fees, savings, bookings,
              premiums, repayments. That is what lets us share in the upside instead of
              billing for hours.
            </p>
            <p className="mt-4 max-w-md text-sm text-mute">
              If money doesn&apos;t pass through your product, we can still build it for a fee
              through{" "}
              <Link href="/services" className="text-gold">
                Pesara Digital
              </Link>
              .
            </p>
          </div>
          <ul className="grid gap-px self-start bg-line sm:grid-cols-2">
            {MONEY_MOVES.map((item) => (
              <li key={item} className="bg-ink px-5 py-5 text-sm text-cream">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <Eyebrow>Pesara Rails</Eyebrow>
        <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
          Built once. Launched many times.
        </h2>
        <p className="mt-5 max-w-2xl text-mute">
          Every venture runs on the same platform, so each new company starts from working
          parts, not a blank page. Components are marked in development until they are
          running in production.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rails.map((item) => (
            <Frame key={item.name} className="p-6">
              <p className="font-mono text-[10px] tracking-[0.22em] text-gold uppercase">
                {item.state}
              </p>
              <h3 className="mt-3 text-lg font-medium">{item.name}</h3>
              <p className="mt-2 text-sm text-mute">{item.items}</p>
            </Frame>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink-2/80">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Eyebrow>Pipeline</Eyebrow>
          <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
            Evidence before engineering.
          </h2>
          <p className="mt-5 max-w-2xl text-mute">
            Every idea is screened and tested before we commit to building it. A committee
            records Build, Pilot, Pivot, Park or Decline. Nothing is accepted automatically.
          </p>
          {metrics.ready ? (
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.items.map((item) => (
                <Frame key={item.label} className="px-5 py-6">
                  <p className="text-3xl font-medium tracking-tight">{item.value}</p>
                  <p className="mt-2 font-mono text-[11px] tracking-[0.16em] text-mute uppercase">
                    {item.label}
                  </p>
                </Frame>
              ))}
            </div>
          ) : (
            <p className="mt-6 max-w-2xl text-sm text-mute">
              Pipeline numbers appear here once there is real activity to show.
            </p>
          )}
          <div className="mt-10">
            <Button href="/how-it-works" variant="line">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <Eyebrow>Pesara Digital</Eyebrow>
        <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
          Not every project needs a partner.
        </h2>
        <p className="mt-5 max-w-2xl text-mute">
          Businesses and institutions can hire Pesara to build technology for a fee. That work
          keeps the studio independent. A paid build never turns into an ownership claim.
        </p>
        <div className="mt-8">
          <Button href="/services" variant="line">
            Build With Pesara
          </Button>
        </div>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Eyebrow>Community</Eyebrow>
          <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
            Not ready to submit?
          </h2>
          <p className="mt-5 max-w-xl text-mute">
            Join the Pesara community. We will not tick marketing consent for you.
          </p>
          <WaitlistForm status={waitlist} />
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="city-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-5 py-32">
          <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.05em] sm:text-6xl">
            Your idea doesn&apos;t need to stay an idea.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-mute">
            If people would pay to solve the problem you&apos;ve found, Pesara wants to build it
            with you.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/submit">Submit Your Idea</Button>
            <Button href="/contact" variant="line">
              Talk to Pesara
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
