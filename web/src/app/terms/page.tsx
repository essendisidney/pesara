import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Legal" title="Terms">
        Submitting an idea does not create a partnership. Pesara has no obligation
        to accept or build. Any commercial relationship requires a separate written
        agreement.
      </PageIntro>
      <div className="mx-auto max-w-3xl space-y-4 px-5 pb-24 text-sm leading-relaxed text-mute">
        <p>Do not submit information you lack authority to disclose.</p>
        <p>You confirm the information you provide is accurate to the best of your knowledge.</p>
        <p>Pesara Limited is headquartered in Kenya.</p>
      </div>
    </SiteShell>
  );
}
