import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { IdeaCheck } from "@/components/marketing/idea-check";

export const metadata: Metadata = {
  title: "Idea Check",
  description: "A short reading of an idea. Not a prediction, and not an application.",
};

export default function IdeaCheckPage() {
  return (
    <SiteShell>
      <PageIntro eyebrow="Idea Check" title="Test the shape of the idea before you apply.">
        Eight questions. A preliminary reading of what you write, including whether money moves through the product. Pesara does not treat this as investment advice, and it does not predict whether a venture will succeed.
      </PageIntro>
      <IdeaCheck />
    </SiteShell>
  );
}
