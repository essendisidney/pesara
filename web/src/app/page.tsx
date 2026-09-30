import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/marketing/site-shell";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Eyebrow } from "@/components/marketing/frame";
import { SettlementVisual } from "@/components/marketing/settlement-visual";
import { KeepCalculator } from "@/components/marketing/keep-calculator";
import { Button } from "@/components/ui/button";
import { MONEY_MOVES } from "@/config/partnership";
import { PROMISES } from "@/config/promises";

const live = [
  { name: "Jameiyah", note: "Community finance", href: "https://jameiyah.com", logo: "/portfolio/jameiyah-mark.png", light: false },
  { name: "Marit", note: "Celebrations", href: "https://maritevents.com", logo: "/portfolio/marit-logo.png", light: false },
  { name: "Little Scientist", note: "Bookings", href: "https://littlescientist.ke", logo: null, light: false },
  { name: "Mukuna & Co. Advocates", note: "Legal", href: "https://www.mukunaadvocates.co.ke", logo: "/portfolio/mukuna-mark.png", light: false },
  { name: "Athi Gardens", note: "Property", href: "https://athigardens.com", logo: "/portfolio/athi-gardens-logo.png", light: true },
] as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const waitlist = typeof query.waitlist === "string" ? query.waitlist : null;

  return (
    <SiteShell>
      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24 lg:pb-28">
          <div>
            <Eyebrow>Technology venture studio · Nairobi</Eyebrow>
            <h1 className="display mt-6 text-[3.1rem] leading-[0.98] text-balance sm:text-[4.4rem] lg:text-[5.2rem]">
              You bring the idea. We bring the technology.{" "}
              <em className="text-gold">We get paid when you get paid.</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-cream/85">
              Pesara co-builds companies with founders. We design and engineer the product, run its
              payments, and take our share from what it earns. No invoice for the build.
            </p>
            <p className="display mt-4 text-xl text-cream/60 italic">
              Wazo ni lako. Teknolojia ni yetu. Tunafaidika pamoja.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/submit">Submit Your Idea</Button>
              <Button href="#keep" variant="line">
                See what you&apos;d keep
              </Button>
            </div>
          </div>
          <SettlementVisual />
        </div>
      </section>

      {/* 2. Proof */}
      <section className="border-y border-line bg-ink-2/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow>Built by operators</Eyebrow>
            <p className="mt-4 text-lg leading-relaxed text-cream/90">
              Pesara is led by Sidney Essendi, who has spent more than fifteen years implementing core
              banking and payment systems for over 50 institutions across East Africa, including as
              Head of ICT at Faulu Microfinance Bank.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {live.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full flex-col justify-between gap-3 rounded-[6px] border border-line bg-ink p-4 transition-colors hover:border-gold/50"
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
                      <p className="text-base leading-tight font-extrabold tracking-tight text-white">{item.name}</p>
                    )}
                  </div>
                  <p className="text-[12px] text-mute">{item.note}</p>
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/portfolio"
                className="flex h-full min-h-24 items-center justify-center rounded-[6px] border border-dashed border-line p-4 text-sm text-gold hover:border-gold/50"
              >
                See the portfolio →
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* 3. Promises */}
      <section className="mx-auto max-w-6xl px-5 py-24 lg:py-32">
        <Eyebrow>Our promises to founders</Eyebrow>
        <h2 className="display mt-5 max-w-3xl text-5xl leading-[1.02] text-balance sm:text-6xl">
          What you get here that you won&apos;t get anywhere else.
        </h2>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-[6px] border border-line bg-line md:grid-cols-2">
          {PROMISES.map((promise, index) => (
            <li key={promise.key} className="bg-ink p-8 sm:p-10">
              <p className="font-mono text-[12px] text-gold">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="display mt-4 text-3xl leading-tight">{promise.title}</h3>
              <p className="mt-4 max-w-md leading-relaxed text-mute">{promise.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Calculator */}
      <section id="keep" className="scroll-mt-24 border-y border-line bg-ink-2/60">
        <div className="mx-auto max-w-6xl px-5 py-24 lg:py-32">
          <Eyebrow>See what you&apos;d keep</Eyebrow>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <h2 className="display max-w-2xl text-5xl leading-[1.02] text-balance sm:text-6xl">
              Put in your numbers. No sign-up.
            </h2>
            <Link href="/partnership" className="text-sm text-gold underline-offset-4 hover:underline">
              How the partnership works →
            </Link>
          </div>
          <div className="mt-12">
            <KeepCalculator />
          </div>
        </div>
      </section>

      {/* 5. What we back */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-2 lg:py-32">
        <div>
          <Eyebrow>What we back</Eyebrow>
          <h2 className="display mt-5 text-5xl leading-[1.02] sm:text-6xl">Ideas where money moves.</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/85">
            We co-build products that people pay through. That is what lets us share in the upside
            instead of billing for hours.
          </p>
          <p className="mt-4 max-w-md text-sm text-mute">
            Money doesn&apos;t pass through your product, or you&apos;d rather own it outright? We build
            it for a fee through{" "}
            <Link href="/services" className="text-gold underline-offset-4 hover:underline">
              Pesara Digital
            </Link>
            .
          </p>
        </div>
        <ul className="grid gap-px self-start overflow-hidden rounded-[6px] border border-line bg-line sm:grid-cols-2">
          {MONEY_MOVES.map((item) => (
            <li key={item} className="bg-ink px-6 py-6 text-cream">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Close */}
      <section className="relative overflow-hidden border-t border-line">
        <div className="city-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-24 lg:grid-cols-[1.2fr_0.8fr] lg:py-32">
          <div>
            <h2 className="display max-w-2xl text-5xl leading-[1.02] text-balance sm:text-7xl">
              Your idea doesn&apos;t need to stay an idea.
            </h2>
            <p className="mt-6 max-w-lg text-lg text-cream/85">
              Tell us the problem, who has it and how they&apos;d pay. You&apos;ll have a written answer
              within ten working days.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/submit">Submit Your Idea</Button>
              <Button href="/idea-check" variant="line">
                Test it first
              </Button>
            </div>
          </div>
          <div className="self-end">
            <p className="text-sm text-cream">Not ready yet?</p>
            <p className="mt-1 text-sm text-mute">
              Join the Pesara community. We will not tick marketing consent for you.
            </p>
            <WaitlistForm status={waitlist} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
