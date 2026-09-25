import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { site } from "@/config/site";
import { IDEA_CHECK_DISCLAIMER, parseShare } from "@/lib/idea-check";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Idea Check" };

export default async function ShareCardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const categories = parseShare(await searchParams);
  const host = site.url.replace(/^https?:\/\//, "");
  return (
    <SiteShell>
      <PageIntro eyebrow="Pesara Idea Check" title="What's your idea?">
        {IDEA_CHECK_DISCLAIMER}
      </PageIntro>
      <div className="mx-auto max-w-xl px-5 pb-24">
        {categories ? (
          <ul className="space-y-5 border border-line px-5 py-6">
            {categories.map((category) => (
              <li key={category.key}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm text-cream">{category.label}</p>
                  <p className="font-mono text-[11px] tracking-[0.14em] text-mute uppercase">{category.caption}</p>
                </div>
                <div className="mt-2 flex gap-1" aria-hidden>
                  {Array.from({ length: 9 }, (_, index) => (
                    <span key={index} className={`h-2 flex-1 ${index < category.level * 3 ? "bg-gold" : "bg-white/10"}`} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mute">This card does not have a reading.</p>
        )}
        <div className="mt-8">
          <Button href="/idea-check">Test My Idea</Button>
        </div>
        <p className="mt-6 font-mono text-[11px] tracking-[0.16em] text-mute uppercase">
          <Link href="/" className="text-gold">
            {host}
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
