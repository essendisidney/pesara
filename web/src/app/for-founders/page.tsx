import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For Founders" };

export default function ForFoundersPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Founders" title="You understand the problem. Let's build the solution.">
        You do not need to be technical. You may contribute industry expertise,
        customers, distribution, capital, regulation, operations, an existing
        business or intellectual property.
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-24 md:grid-cols-2">
        <article className="border border-line p-6">
          <h2 className="text-lg font-semibold">You may bring</h2>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Industry expertise, customer relationships, distribution, capital,
            regulatory knowledge, operations, an existing business, intellectual
            property.
          </p>
        </article>
        <article className="border border-line p-6">
          <h2 className="text-lg font-semibold">Pesara can bring</h2>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Technology, product, UX, engineering, data, cloud, validation and
            commercialisation support.
          </p>
        </article>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <Button href="/submit">Submit Your Idea</Button>
      </div>
    </SiteShell>
  );
}
