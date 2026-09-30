import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/marketing/site-shell";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Eyebrow, Frame } from "@/components/marketing/frame";
import { SettlementVisual } from "@/components/marketing/settlement-visual";
import { Button } from "@/components/ui/button";
import { MONEY_MOVES, SETTLEMENT_STEPS, SHARES } from "@/config/partnership";
import { getPublicMetrics } from "@/lib/metrics";

const live = [
  { name: "Jameiyah", note: "Community finance", href: "https://jameiyah.com", logo: "/portfolio/jameiyah-mark.png", light: false },
  { name: "Marit", note: "Celebrations", href: "https://maritevents.com", logo: "/portfolio/marit-logo.png", light: false },
  { name: "Little Scientist", note: "Bookings", href: "https://littlescientist.ke", logo: null, light: false },
  { name: "Mukuna & Co. Advocates", note: "Legal", href: "https://www.mukunaadvocates.co.ke", logo: "/portfolio/mukuna-mark.png", light: false },
  { name: "Athi Gardens", note: "Property", href: "https://athigardens.com", logo: "/portfolio/athi-gardens-logo.png", light: true },
] as const;

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
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20 lg:pb-20">
          <div>
            <Eyebrow>Technology venture studio · Nairobi</Eyebrow>
            <h1 className="mt-6 text-[2.5rem] leading-[1.04] font-medium tracking-[-0.045em] text-balance sm:text-[3.4rem] lg:text-[3.9rem]">
              You bring the idea. We bring the technology.{" "}
              <span className="text-gold">We get paid when you get paid.</span>
            </h1>
            <p className="mt-5 text-base text-cream/70 italic">
              Wazo ni lako. Teknolojia ni yetu. Tunafaidika pamoja.
            </p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/85">
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
              <Link href="/idea-check" className="text-gold underline-offset-4 hover:underline">
                Test your idea in five minutes
              </Link>
              .
            </p>
          </div>
          <SettlementVisual />
        </div>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-medium tracking-[0.14em] text-gold uppercase">
              Built by operators
            </p>
            <p className="mt-4 text-lg leading-relaxed text-cream/90">
              Pesara is led by Sidney Essendi, who has spent more than fifteen years
              implementing core banking and payment systems for over 50 institutions across
              East Africa, including as Head of ICT at Faulu Microfinance Bank.
            </p>
            <p className="mt-3 text-sm text-mute">
              That is why we focus on products money moves through, and why we run the
              payments ourselves.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-medium tracking-[0.14em] text-mute uppercase">
              Already running
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {live.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full flex-col justify-between gap-3 rounded-[4px] border border-line p-4 transition-colors hover:border-gold/50"
                  >
                    <div className="relative h-12">
                      {item.logo ? (
                        <Image
                          src={item.logo}
                          alt={item.name}
                          fill
                          sizes="160px"
                          className={`object-contain object-left ${item.light ? "rounded-[2px] bg-cream p-1.5" : ""}`}
                        />
                      ) : (
                        <p className="text-base leading-tight font-extrabold tracking-tight text-white">
                          {item.name}
                        </p>
                      )}
                    </div>
                    <p className="text-[12px] text-mute">{item.note}</p>
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/portfolio"
                  className="flex h-full min-h-24 items-center justify-center rounded-[4px] border border-dashed border-line p-4 text-sm text-gold hover:border-gold/50"
                >
                  See the portfolio →
                </Link>
              </li>
            </ul>
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
              <p className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
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
