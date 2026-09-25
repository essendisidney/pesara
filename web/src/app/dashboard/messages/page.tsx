import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { openThreadAction } from "@/lib/founder/files";
import { loadFounderThreads } from "@/lib/founder/inbox";
import { listFounderApplications } from "@/lib/applications/actions";
import { requireFounder } from "@/lib/auth/session";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireFounder();
  const query = await searchParams;
  const error = query.error === "invalid" ? "That message was not accepted." : query.error === "failed" ? "The message could not be sent." : null;
  const [threads, applications] = await Promise.all([loadFounderThreads(auth.userId), listFounderApplications()]);

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Messages</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your conversations</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">Each thread belongs to one of your ideas.</p>
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      {threads === null ? (
        <div className="mt-8">
          <EmptyState title="Messages could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {threads && threads.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No messages yet">Start a thread when you want Pesara to see a question on an idea.</EmptyState>
        </div>
      ) : null}
      {threads && threads.length > 0 ? (
        <ul className="mt-8 divide-y divide-line border border-line">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link href={`/dashboard/messages/${thread.id}`} className="block px-5 py-4">
                <p className="text-sm text-cream">{thread.subject}</p>
                <p className="mt-1 text-xs text-mute">
                  {thread.reference}
                  {thread.unread > 0 ? ` · ${thread.unread} unread` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {applications.length > 0 ? (
        <form action={openThreadAction} className="mt-10 grid max-w-xl gap-4">
          <h2 className="text-lg font-semibold">New message</h2>
          <label className="text-sm text-cream">
            Idea
            <select name="applicationId" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
              {applications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.reference ?? (item.payload.ideaName || "Untitled idea")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-cream">
            Subject
            <input name="subject" required maxLength={120} className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3" />
          </label>
          <label className="text-sm text-cream">
            Message
            <textarea name="body" required maxLength={4000} rows={4} className="mt-2 w-full min-h-28 rounded-[2px] border border-line bg-ink-2/80 px-3 py-3" />
          </label>
          <Button type="submit">Send</Button>
        </form>
      ) : null}
    </>
  );
}
