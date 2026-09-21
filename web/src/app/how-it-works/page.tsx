import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "How Pesara Works" };

const steps = [
  {
    n: "01",
    title: "Submit",
    body: "Tell us what you want to solve. No 50-page business plan. Explain the problem, who feels it, why it matters, and what people do instead.",
  },
  {
    n: "02",
    title: "Screen",
    body: "Pesara performs an initial opportunity assessment: problem quality, market, customer, competition, monetisation, technology, regulation, founder-market fit.",
  },
  {
    n: "03",
    title: "Validate",
    body: "Evidence before engineering. Promising ideas enter a validation sprint: interviews, landing pages, waitlists, pricing tests, prototypes, LOIs, pre-orders, unit economics.",
  },
  {
    n: "04",
    title: "Decide",
    body: "Possible outcomes: Build, Pilot, Pivot, Park, Decline. Disciplined selection protects both founders and Pesara from building without evidence. Decline is not a verdict on the person.",
  },
  {
    n: "05",
    title: "Build",
    body: "Pesara designs and engineers the product: strategy, UX, web, mobile, backend, payments, AI, data, cloud, security, analytics.",
  },
  {
    n: "06",
    title: "Launch",
    body: "Take the product into the real market. Measure activation, acquisition, conversion, retention, revenue and unit economics.",
  },
  {
    n: "07",
    title: "Scale",
    body: "Successful products can receive ongoing support around technology, growth, partnerships, capital readiness, enterprise sales and international expansion.",
  },
];

export default function HowItWorksPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Process" title="From idea to company.">
        Evidence before engineering. Don&apos;t just build an app. Build a business.
      </PageIntro>
      <ol className="mx-auto max-w-6xl px-5 pb-16 md:flex md:overflow-x-auto">
        {steps.map((step) => (
          <li
            key={step.n}
            className="border-t border-line py-8 md:min-w-[250px] md:border-t-0 md:border-l md:px-6 md:py-2"
          >
            <p className="font-mono text-[11px] tracking-[0.24em] text-gold">{step.n}</p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight">{step.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-mute">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <Button href="/submit">Submit Your Idea</Button>
      </div>
    </SiteShell>
  );
}
