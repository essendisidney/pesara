import { requestDocumentAction } from "@/lib/admin/actions";
import { uploadDocumentAction } from "@/lib/founder/files";
import { DOCUMENT_KINDS, documentKindLabel } from "@/lib/documents";
import { formatNairobi } from "@/lib/admin/present";
import type { ApplicationFile } from "@/lib/admin/queries";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function DocumentsTab({ application }: { application: ApplicationFile }) {
  return (
    <>
      <section className="mt-8 max-w-xl">
        <h2 className="text-lg font-semibold">Asked for</h2>
        <p className="mt-2 text-sm text-mute">
          The founder sees the kind and the note on their documents page. The notice stays in the app. It does not send an email.
        </p>
        {application.documentRequests.length === 0 ? (
          <p className="mt-4 text-sm text-mute">No document has been requested.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border border-line">
            {application.documentRequests.map((request) => (
              <li key={request.id} className="px-5 py-4">
                <p className="text-sm text-cream">{documentKindLabel(request.kind)}</p>
                {request.note ? <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{request.note}</p> : null}
                <p className="mt-2 text-xs text-mute">{formatNairobi(request.at)}</p>
              </li>
            ))}
          </ul>
        )}
        <form action={requestDocumentAction} className="mt-4 grid gap-4">
          <input type="hidden" name="applicationId" value={application.id} />
          <label className="text-sm text-cream">
            Kind
            <select name="kind" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
              {DOCUMENT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {documentKindLabel(kind)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-cream">
            Note
            <input name="note" maxLength={160} className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3" />
          </label>
          <Button type="submit" variant="line">
            Ask for this document
          </Button>
        </form>
      </section>
      {application.documents.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No documents have been stored" />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border border-line">
          {application.documents.map((document) => (
            <li key={document.id} className="px-5 py-4">
              <p className="text-sm text-cream">{document.name}</p>
              <p className="mt-1 text-xs text-mute">
                {[documentKindLabel(document.kind), document.mime, document.size, formatNairobi(document.at)]
                  .filter((item) => item && item !== "—")
                  .join(" · ")}
              </p>
              <a href={`/files/${document.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-gold">
                Open file
              </a>
            </li>
          ))}
        </ul>
      )}
      <form action={uploadDocumentAction} className="mt-8 grid max-w-xl gap-4">
        <input type="hidden" name="applicationId" value={application.id} />
        <input type="hidden" name="next" value="admin" />
        <label className="text-sm text-cream">
          Kind
          <select name="kind" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
            {DOCUMENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {documentKindLabel(kind)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-cream">
          Title
          <input name="title" maxLength={160} className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3" />
        </label>
        <label className="text-sm text-cream">
          File
          <input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.pptx" className="mt-2 block w-full text-sm" />
        </label>
        <Button type="submit">Store document</Button>
      </form>
    </>
  );
}
