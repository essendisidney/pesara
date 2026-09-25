import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { replyMessageAction } from "@/lib/founder/files";
import { loadThread } from "@/lib/founder/inbox";
import { requireFounder } from "@/lib/auth/session";
import { formatNairobi } from "@/lib/admin/present";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireFounder();
  const { id } = await params;
  const query = await searchParams;
  const thread = await loadThread(id, auth.userId);
  if (!thread) notFound();
  const error = query.error === "failed" ? "The message could not be sent." : null;

  return (
    <>
      <Link href="/dashboard/messages" className="text-sm text-gold">
        Messages
      </Link>
      <p className="mt-6 font-mono text-xs tracking-[0.16em] text-gold">{thread.reference}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{thread.subject}</h1>
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      {thread.messages.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No messages in this thread yet" />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {thread.messages.map((message) => (
            <li key={message.id} className="border border-line px-5 py-4">
              <p className="text-xs text-mute">
                {message.mine ? "You" : "Pesara"} · {formatNairobi(message.at)} · {message.read ? "Read" : "Unread"}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{message.body}</p>
              {message.attachment ? (
                <a href={`/files/${message.attachment.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-gold">
                  {message.attachment.name}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form action={replyMessageAction} className="mt-8 grid max-w-xl gap-4">
        <input type="hidden" name="threadId" value={thread.id} />
        <label className="text-sm text-cream">
          Reply
          <textarea name="body" required maxLength={4000} rows={4} className="mt-2 w-full min-h-28 rounded-[2px] border border-line bg-ink-2/80 px-3 py-3" />
        </label>
        {thread.documents.length > 0 ? (
          <label className="text-sm text-cream">
            Attachment
            <select name="documentId" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
              <option value="">No document</option>
              {thread.documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Button type="submit">Send</Button>
      </form>
    </>
  );
}
