import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For Founders" };

const bring = [
  "A problem you understand from the inside",
  "Customers, distribution, or a community",
  "Domain knowledge, licences, or an existing operation",
  "Time. Capital, if that is part of the partnership",
];

const pesara = [
  "Technology, product, and engineering",
  "A commercial reading of the opportunity",
  "Validation before a large build",
  "A written partnership, if both sides proceed",
];

const models = [
  ["Build", "You fund the build. Pesara builds the technology and can earn fees."],
  ["Build + grow", "You contribute part of the capital. Pesara contributes technology and product. Fees and revenue participation can combine."],
  ["Venture build", "Pesara contributes significant technology and venture-building resources, and may receive an agreed ownership interest."],
  ["Joint venture", "Both sides contribute assets. The economics follow what each side actually brings."],
];

const questions = [
  ["Do I need to be technical?", "No. You need a problem worth solving and a reason you can stay with it."],
  ["Does submitting create a partnership?", "No. A committee records a decision. A venture starts only when an admin creates it from a Build decision, under a written agreement."],
  ["Will Pesara publish my idea?", "No. The application stays private. Public numbers, when shown, are aggregates."],
  ["Is this a loan or a grant?", "No. Pesara is a technology venture studio. It does not lend money and it does not promise funding."],
  ["Are equity percentages listed?", "No. Ownership, fees, and revenue share are written for that venture. They are not a public rate card."],
];

export default function ForFoundersPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Founders" title="You understand the problem. Let's build the solution.">
        Pesara works with people who have found a real problem and want a company around it. You do not need a technical co-founder to start the conversation.
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-2">
        <article className="border border-line p-6">
          <h2 className="text-lg font-semibold">What you bring</h2>
          <ul className="mt-4 space-y-2 text-sm text-mute">
            {bring.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="border border-line p-6">
          <h2 className="text-lg font-semibold">What Pesara brings</h2>
          <ul className="mt-4 space-y-2 text-sm text-mute">
            {pesara.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-medium tracking-tight">How an idea is selected</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "You submit the idea.",
            "Pesara screens it.",
            "A founder conversation, when the idea warrants one.",
            "Validation of the riskiest assumption.",
            "A committee records Build, Pilot, Pivot, Park, or Decline.",
            "A Build decision can become a venture. Nothing is accepted automatically.",
          ].map((step, index) => (
            <li key={step} className="border border-line px-5 py-4 text-sm text-mute">
              <span className="font-mono text-[11px] tracking-[0.16em] text-gold">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-2 text-cream">{step}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-medium tracking-tight">Commercial models</h2>
        <p className="mt-3 max-w-2xl text-sm text-mute">
          The shape is chosen for the idea. Terms stay in the agreement.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {models.map(([name, body]) => (
            <article key={name} className="border border-line p-6">
              <h3 className="text-lg font-medium">{name}</h3>
              <p className="mt-3 text-sm text-mute">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-medium tracking-tight">What Pesara does not do</h2>
        <ul className="mt-4 max-w-2xl space-y-2 text-sm text-mute">
          <li>It does not buy an idea with a standard cheque.</li>
          <li>It does not guarantee investment, revenue, or success.</li>
          <li>It does not publish your application.</li>
          <li>It does not turn a services invoice into an ownership claim.</li>
        </ul>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-medium tracking-tight">Questions</h2>
        <dl className="mt-6 grid gap-6">
          {questions.map(([question, answer]) => (
            <div key={question} className="border-t border-line pt-4">
              <dt className="text-sm text-cream">{question}</dt>
              <dd className="mt-2 text-sm text-mute">{answer}</dd>
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
