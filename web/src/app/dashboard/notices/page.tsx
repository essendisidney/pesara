import { markNoticeReadAction } from "@/lib/notice-actions";
import { loadFounderNotices } from "@/lib/founder/notices";
import { formatNairobi } from "@/lib/admin/present";
import { requireFounder } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireFounder();
  const query = await searchParams;
  const notices = await loadFounderNotices(auth.userId);
  const error =
    query.error === "invalid"
      ? "That notice was not accepted."
      : query.error === "failed"
        ? "The notice could not be marked read."
        : null;

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Notices</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">What changed</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        A notice appears when Pesara receives your idea, changes its stage, asks for a document, sends a message, records a decision, or opens a venture. It does not include the message, the document note, or the decision text.
      </p>
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      {notices === null ? (
        <div className="mt-10">
          <EmptyState title="Notices could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {notices && notices.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No notices yet">Nothing has changed on your ideas.</EmptyState>
        </div>
      ) : null}
      {notices && notices.length > 0 ? (
        <ul className="mt-10 max-w-xl divide-y divide-line border border-line">
          {notices.map((notice) => (
            <li key={notice.id} className="px-5 py-4">
              <p className="text-sm text-cream">{notice.body}</p>
              <p className="mt-1 text-xs text-mute">
                {formatNairobi(notice.at)} · {notice.read ? "Read" : "Unread"}
              </p>
              {notice.read ? null : (
                <form action={markNoticeReadAction} className="mt-3">
                  <input type="hidden" name="noticeId" value={notice.id} />
                  <Button type="submit" variant="line">
                    Mark read
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
