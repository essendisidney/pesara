import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Legal" title="Cookies">
        Essential cookies keep you signed in. Analytics, if enabled, will require
        an explicit choice. We do not sell browsing data.
      </PageIntro>
    </SiteShell>
  );
}
