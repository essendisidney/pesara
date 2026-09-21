import { SiteShell } from "@/components/marketing/site-shell";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_480px_at_50%_-10%,rgba(196,164,106,0.12),transparent_55%)]" />
        <div className="mx-auto grid max-w-6xl gap-16 px-5 pt-20 pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:pt-28">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-gold uppercase">
              Ideas deserve execution
            </p>
            <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-6xl">
              You have the idea.
              <br />
              We have the technology.
              <br />
              Let&apos;s build the company.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
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
          <ol className="self-center border-l border-line pl-6">
            {stages.map((stage, index) => (
              <li key={stage} className="relative pb-8 last:pb-0">
                <span className="absolute top-1.5 -left-[31px] h-2.5 w-2.5 rounded-full bg-gold" />
                <p className="text-[11px] tracking-[0.18em] text-mute uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xl font-medium tracking-tight">{stage}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-ink-2">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Ideas don&apos;t need another presentation. They need a path to market.
          </h2>
          {metrics.ready ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.items.map((item) => (
                <div key={item.label} className="border border-line px-5 py-6">
                  <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
                  <p className="mt-2 text-sm text-mute">{item.label}</p>
                </div>
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Too many great ideas never get built.
        </h2>
        <div className="mt-6 max-w-2xl space-y-4 text-mute">
          <p>Some founders understand their industry but cannot build software.</p>
          <p>Some businesses recognise an opportunity but lack product teams.</p>
          <p>Some technologists can build products but don&apos;t understand the market.</p>
          <p>
            Some entrepreneurs spend months and significant capital building something
            nobody actually wants.
          </p>
          <p className="text-cream">Pesara brings these pieces together.</p>
        </div>
        <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
          {pieces.map((piece) => (
            <div key={piece.title} className="bg-ink px-5 py-6">
              <p className="text-sm font-semibold tracking-tight">{piece.title}</p>
              <p className="mt-2 text-sm text-mute">{piece.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm tracking-[0.18em] text-gold uppercase">= Venture</p>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <p className="text-xs tracking-[0.18em] text-gold uppercase">Partnerships</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Different ideas require different partnerships.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {models.map((model) => (
              <article key={model.name} className="border border-line p-6">
                <h3 className="text-xl font-semibold">{model.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">{model.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-mute">
            Every partnership is structured individually. We do not publish fixed
            equity percentages.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="text-3xl font-semibold tracking-tight">
          We don&apos;t start from zero every time.
        </h2>
        <p className="mt-4 max-w-2xl text-mute">
          The Pesara Foundry is our growing collection of reusable infrastructure
          for launching technology products faster. Components below are in
          development until they are actually in production.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {foundry.map((item) => (
            <article key={item.name} className="border border-line p-6">
              <p className="text-[11px] tracking-[0.16em] text-gold uppercase">
                {item.state}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.name}</h3>
              <p className="mt-2 text-sm text-mute">{item.items}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink-2">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="text-3xl font-semibold tracking-tight">
            Every company makes Pesara smarter.
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-mute">
            This is the intended flywheel. We will not claim proprietary performance
            advantages until the evidence exists.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {flywheel.map((item) => (
              <span key={item} className="border border-line px-4 py-2 text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="text-3xl font-semibold tracking-tight">Not ready to submit?</h2>
          <p className="mt-4 max-w-xl text-mute">
            Join the Pesara community. We will not tick marketing consent for you.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-28">
        <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
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
      </section>
    </SiteShell>
  );
}
