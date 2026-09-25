import Link from "next/link";
import { ARTICLE_CATEGORIES } from "@/lib/admin/office";
import { saveArticleAction } from "@/lib/admin/office-actions";
import { loadStaffArticles } from "@/lib/admin/office-data";
import { knownMessage, PAGE_ERRORS } from "@/lib/admin/pipeline";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const notices: Record<string, string> = { article: "Article saved." };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const result = await loadStaffArticles();
  const notice = knownMessage(notices, query.notice);
  const error = knownMessage(PAGE_ERRORS, query.error);

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Content</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Insights</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">A piece appears on the public site only when it is marked published. Drafts stay here.</p>
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      {result.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">Articles stay hidden until Pesara is connected.</EmptyState>
        </div>
      ) : null}
      {result.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="Articles could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && result.articles.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No articles yet">The public archive stays empty until a piece is written.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && result.articles.length > 0 ? (
        <ul className="mt-8 divide-y divide-line border border-line">
          {result.articles.map((article) => (
            <li key={article.id} className="px-5 py-4">
              <p className="text-sm text-cream">{article.title}</p>
              <p className="mt-1 text-xs text-mute">{article.published ? "Published" : "Draft"} · {article.slug}</p>
              {article.published ? (
                <Link href={`/insights/${article.slug}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-gold">
                  Open public page
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <form action={saveArticleAction} className="mt-10 grid max-w-xl gap-4">
        <h2 className="text-lg font-semibold">Write a piece</h2>
        <label className="text-sm text-cream">
          Title
          <input name="title" required maxLength={160} className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3" />
        </label>
        <label className="text-sm text-cream">
          Slug
          <input name="slug" maxLength={80} className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3" />
        </label>
        <label className="text-sm text-cream">
          Category
          <select name="category" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
            <option value="">None</option>
            {ARTICLE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-cream">
          Excerpt
          <input name="excerpt" maxLength={300} className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3" />
        </label>
        <label className="text-sm text-cream">
          Body
          <textarea name="body" required maxLength={20000} rows={8} className="mt-2 w-full min-h-40 rounded-[2px] border border-line bg-ink-2/80 px-3 py-3" />
        </label>
        <label className="flex min-h-12 items-center gap-3 text-sm text-cream">
          <input name="published" type="checkbox" className="h-4 w-4" />
          Published
        </label>
        <Button type="submit">Save article</Button>
      </form>
    </>
  );
}
