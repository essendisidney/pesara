import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "What's your idea?" };

const lines = [
  "You don't need to know how to code.",
  "You don't need a 50-page business plan.",
  "You need to understand a problem worth solving.",
];

const paths = [
  {
    title: "Test it",
    body: "Seven questions produce a reading of what you wrote. The reading is not a score and it does not predict whether a venture will succeed.",
    href: "/idea-check",
    label: "Test My Idea",
  },
  {
    title: "Send it",
    body: "The application stays on your account. A submitted idea receives a PSR reference. A person reviews it.",
    href: "/submit",
    label: "Submit Your Idea",
  },
  {
    title: "From a campus",
    body: "A student, a lecturer, or a society uses the same application. The idea is reviewed on the same path.",
    href: "/submit",
    label: "Submit from campus",
  },
  {
    title: "From a company",
    body: "If the idea already sits inside a business, start with the organisation that has the customers or the operation.",
    href: "/for-businesses",
    label: "Build With Pesara",
  },
  {
    title: "From anywhere",
    body: "Submit from any country. Pesara is in Nairobi, and the review is the same path.",
    href: "/submit",
    label: "Submit from abroad",
  },
  {
    title: "Introduce someone",
    body: "Create an account. The dashboard holds your introduction link. Introductions are counted. They are not paid.",
    href: "/register",
    label: "Create an account",
  },
];

export default function WhatsYourIdeaPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="What's your idea?" title="Bring the problem. Pesara brings the technology.">
        {lines[2]} Bring it to Pesara.
      </PageIntro>
      <section className="mx-auto max-w-6xl px-5">
        <ul className="max-w-2xl space-y-3 text-lg text-cream">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/idea-check">Test My Idea</Button>
          <Button href="/submit" variant="line">
            Submit Your Idea
          </Button>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-medium tracking-tight">Where an idea can start</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {paths.map((item) => (
            <article key={item.title} className="border border-line p-6">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mute">{item.body}</p>
              <Button href={item.href} variant="line" className="mt-6">
                {item.label}
              </Button>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-medium tracking-tight">Share a reading</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">
          An Idea Check can be shared as levels only. The written idea stays off the card. Someone who opens the card can run their own check or send an idea to Pesara.
        </p>
        <Button href="/idea-check" variant="line" className="mt-6">
          Test My Idea
        </Button>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-2xl font-medium tracking-tight">Pesara 100</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">
          Pesara 100 means ideas are read by a person, in order, to the same standard. A public count appears only when the pipeline has a real number to show. Founder scores stay off the public site.
        </p>
      </section>
    </SiteShell>
  );
}
