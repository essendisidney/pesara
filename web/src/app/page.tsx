import { SiteShell } from "@/components/marketing/site-shell";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Eyebrow, Frame } from "@/components/marketing/frame";
import { UrbanField } from "@/components/marketing/urban-field";
import { Button } from "@/components/ui/button";
import { getPublicMetrics } from "@/lib/metrics";

const stages = ["Idea", "Validate", "Build", "Launch", "Scale"] as const;

const pieces = [
  { title: "Market insight", body: "The person who sees the problem." },
  { title: "Product strategy", body: "What should exist, and why now." },
  { title: "Technology", body: "The engine that makes it real." },
  { title: "Distribution", body: "How it reaches the customer." },
  { title: "Capital readiness", body: "A structure that can grow." },
];

const models = [
  {
    name: "Build",
    body: "Client funds development. Pesara builds the technology. Pesara earns development and/or support fees.",
  },
  {
    name: "Build + Grow",
    body: "Founder contributes part of the required capital. Pesara contributes technology and product. Fees and revenue participation can combine.",
  },
  {
    name: "Venture Build",
    body: "Pesara contributes significant technology, product and venture-building resources, and receives an agreed ownership interest.",
  },
  {
    name: "Joint Venture",
    body: "Both parties contribute strategic assets — expertise, customers, distribution, technology, capital, licences or IP. Economics follow contribution.",
  },
];

const foundry = [
  { name: "Identity", items: "Authentication, profiles, KYC, roles, permissions", state: "Developing" },
  { name: "Money", items: "M-Pesa, payments, subscriptions, billing, reconciliation", state: "Developing" },
  { name: "Commerce", items: "Orders, bookings, marketplaces, inventory, invoices", state: "Developing" },
  { name: "Communication", items: "Email, SMS, WhatsApp, push notifications", state: "Developing" },
  { name: "Intelligence", items: "Analytics, AI, risk engines, dashboards", state: "Developing" },
  { name: "Operations", items: "Admin, CRM, audit logs, reporting, support", state: "Developing" },
];

const flywheel = [
  "More ideas",
  "More market knowledge",
  "Better validation",
  "Better venture selection",
  "More products",
  "More reusable technology",
  "Faster builds",
  "More success stories",
  "More founders",
];

export default async function HomePage() {
  const metrics = await getPublicMetrics();

  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 pt-16 pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-16">
          <div>
            <Eyebrow>Ideas deserve execution</Eyebrow>
            <h1 className="mt-7 text-[2.6rem] leading-[1.02] font-medium tracking-[-0.05em] sm:text-6xl lg:text-[4.35rem]">
              You have the idea.
              <br />
              We have the technology.
              <br />
              Let&apos;s build the company.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-mute sm:text-lg">
              Pesara partners with ambitious people and organisations to validate,
              build and launch commercially viable technology businesses.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/submit">Submit Your Idea</Button>
              <Button href="/how-it-works" variant="line">
                See How It Works
              </Button>
            </div>
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
            <span>Technology venture studio</span>
            <span>Nairobi</span>
            <span>Africa → the world</span>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-ink-2/80">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Eyebrow>Pipeline</Eyebrow>
          <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
            Ideas don&apos;t need another presentation. They need a path to market.
          </h2>
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
            <p className="mt-8 max-w-2xl text-mute">
              Pesara is in formation. Pipeline numbers will appear here when
              applications exist. We will not invent them.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <Eyebrow>The problem</Eyebrow>
        <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
          Too many great ideas never get built.
        </h2>
        <div className="mt-8 max-w-2xl space-y-4 text-mute">
          <p>Some founders understand their industry but cannot build software.</p>
          <p>Some businesses recognise an opportunity but lack product teams.</p>
          <p>Some technologists can build products but don&apos;t understand the market.</p>
          <p>
            Some entrepreneurs spend months and significant capital building something
            nobody actually wants.
          </p>
          <p className="text-cream">Pesara brings these pieces together.</p>
        </div>
        <div className="mt-14 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
          {pieces.map((piece) => (
            <div key={piece.title} className="bg-ink px-5 py-7">
              <p className="text-sm font-medium tracking-tight">{piece.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-mute">{piece.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 font-mono text-[11px] tracking-[0.24em] text-gold uppercase">
          = Venture
        </p>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Eyebrow>Partnerships</Eyebrow>
          <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
            Different ideas require different partnerships.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {models.map((model) => (
              <Frame key={model.name} className="p-7">
                <h3 className="text-xl font-medium">{model.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">{model.body}</p>
              </Frame>
            ))}
          </div>
          <p className="mt-8 text-sm text-mute">
            Every partnership is structured individually. We do not publish fixed
            equity percentages.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <Eyebrow>Foundry</Eyebrow>
        <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
          We don&apos;t start from zero every time.
        </h2>
        <p className="mt-5 max-w-2xl text-mute">
          The Pesara Foundry is our growing collection of reusable infrastructure
          for launching technology products faster. Components below are in
          development until they are actually in production.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {foundry.map((item) => (
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
          <Eyebrow>Flywheel</Eyebrow>
          <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
            Every company makes Pesara smarter.
          </h2>
          <p className="mt-5 max-w-2xl text-sm text-mute">
            This is the intended flywheel. We will not claim proprietary performance
            advantages until the evidence exists.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {flywheel.map((item) => (
              <span
                key={item}
                className="border border-line px-4 py-2 font-mono text-[11px] tracking-[0.14em] text-mute uppercase"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Eyebrow>Community</Eyebrow>
          <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
            Not ready to submit?
          </h2>
          <p className="mt-5 max-w-xl text-mute">
            Join the Pesara community. We will not tick marketing consent for you.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="city-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-5 py-32">
          <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.05em] sm:text-6xl">
            Your idea doesn&apos;t need to stay an idea.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-mute">
            If you&apos;ve discovered a problem worth solving, Pesara wants to hear
            about it.
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
