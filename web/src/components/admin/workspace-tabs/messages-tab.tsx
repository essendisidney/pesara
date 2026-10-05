import { replyMessageAction, openThreadAction } from "@/lib/founder/files";
import { formatNairobi } from "@/lib/admin/present";
import type { ApplicationFile } from "@/lib/admin/queries";
import { Button } from "@/components/ui/button";
import { Panel } from "./shared";

export function MessagesTab({ application }: { application: ApplicationFile }) {
  const thread = application.threads[0];
  return (
    <Panel title="Messages">
      <p className="text-sm text-mute">Shared with the founder on this application.</p>
      {application.messages.length === 0 ? <p className="mt-4 text-sm text-mute">No messages yet.</p> : null}
      <ul className="mt-4 space-y-4">
        {application.messages.map((message) => (
          <li key={message.id} className="border-t border-line pt-4">
            <p className="text-xs text-mute">
              {message.sender} · {formatNairobi(message.at)} · {message.read ? "Read" : "Unread"}
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
      {application.threads.length > 0 ? (
        <form action={replyMessageAction} className="mt-6 grid gap-4">
          <input type="hidden" name="applicationId" value={application.id} />
          {application.threads.length === 1 && thread ? <input type="hidden" name="threadId" value={thread.id} /> : null}
          {application.threads.length > 1 ? (
            <label className="text-sm text-cream">
              Thread
              <select name="threadId" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
                {application.threads.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.subject}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="text-sm text-cream">
            Reply
            <textarea name="body" required maxLength={4000} rows={4} className="mt-2 w-full min-h-28 rounded-[2px] border border-line bg-ink-2/80 px-3 py-3" />
          </label>
          {application.documents.length > 0 ? (
            <label className="text-sm text-cream">
              Attachment
              <select name="documentId" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
                <option value="">No document</option>
                {application.documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button type="submit">Send</Button>
        </form>
      ) : (
        <form action={openThreadAction} className="mt-6 grid gap-4">
          <input type="hidden" name="applicationId" value={application.id} />
          <input type="hidden" name="next" value="admin" />
          <input type="hidden" name="subject" value="Application" />
          <label className="text-sm text-cream">
            Message the founder
            <textarea name="body" required maxLength={4000} rows={4} className="mt-2 w-full min-h-28 rounded-[2px] border border-line bg-ink-2/80 px-3 py-3" />
          </label>
          {application.documents.length > 0 ? (
            <label className="text-sm text-cream">
              Attachment
              <select name="documentId" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
                <option value="">No document</option>
                {application.documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button type="submit">Send</Button>
        </form>
      )}
    </Panel>
  );
}
