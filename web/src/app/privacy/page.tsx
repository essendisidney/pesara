import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Legal" title="Privacy">
        Pesara collects only what is required to evaluate ideas, run accounts and
        operate the studio. Marketing consent is never pre-ticked. You may request
        export or deletion of your account.
      </PageIntro>
      <div className="mx-auto max-w-3xl space-y-4 px-5 pb-24 text-sm leading-relaxed text-mute">
        <p>Applications, documents and messages belong to the applicant until a written partnership says otherwise.</p>
        <p>Internal notes are never shown on founder-facing screens.</p>
        <p>This policy will deepen as Pesara appoints a data protection lead. The collection principle will not.</p>
      </div>
    </SiteShell>
  );
}
