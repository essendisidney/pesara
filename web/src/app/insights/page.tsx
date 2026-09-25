import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { loadPublishedArticles } from "@/lib/admin/office-data";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const articles = await loadPublishedArticles();
  return (
    <SiteShell>
      <PageIntro eyebrow="Insights" title="Editorial, not noise.">
        Ideas, technology, startups, markets, Africa, product, capital, research and founder stories. Pieces appear when they are written.
      </PageIntro>
      {articles && articles.length > 0 ? (
        <ul className="mx-auto max-w-6xl divide-y divide-line border border-line px-0 pb-24">
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/insights/${article.slug}`} className="block px-5 py-5">
                <p className="text-lg text-cream">{article.title}</p>
                {article.excerpt ? <p className="mt-2 text-sm text-mute">{article.excerpt}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mx-auto max-w-6xl px-5 pb-24 text-sm text-mute">
          No articles yet. Pesara will not fill this page with placeholder thought leadership.
        </div>
      )}
    </SiteShell>
  );
}
