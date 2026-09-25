import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/marketing/site-shell";
import { loadPublishedArticle } from "@/lib/admin/office-data";

export const metadata: Metadata = { title: "Insight" };

export default async function InsightArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await loadPublishedArticle(slug);
  if (!article) notFound();
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-5 pt-20 pb-24">
        <Link href="/insights" className="text-sm text-gold">
          Insights
        </Link>
        <h1 className="mt-6 text-4xl font-medium tracking-tight">{article.title}</h1>
        {article.excerpt ? <p className="mt-4 text-lg text-mute">{article.excerpt}</p> : null}
        <div className="mt-8 text-sm leading-relaxed whitespace-pre-wrap text-cream">{article.body}</div>
      </article>
    </SiteShell>
  );
}
