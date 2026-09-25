import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DOCUMENT_KINDS, documentKindLabel } from "@/lib/documents";
import { uploadDocumentAction } from "@/lib/founder/files";
import { loadFounderDocuments } from "@/lib/founder/inbox";
import { listFounderApplications } from "@/lib/applications/actions";
import { requireFounder } from "@/lib/auth/session";

const notices: Record<string, string> = { document: "Document stored." };
const errors: Record<string, string> = { invalid: "That file was not accepted.", failed: "The file could not be stored." };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireFounder();
  const query = await searchParams;
  const noticeKey = typeof query.notice === "string" ? query.notice : "";
  const errorKey = typeof query.error === "string" ? query.error : "";
  const [documents, applications] = await Promise.all([
    loadFounderDocuments(auth.userId),
    listFounderApplications(),
  ]);

  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Documents</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your files</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        Files stay on your application. Another founder cannot open them.
      </p>
      {notices[noticeKey] ? <p className="mt-4 text-sm text-cream">{notices[noticeKey]}</p> : null}
      {errors[errorKey] ? <p className="mt-4 text-sm text-gold">{errors[errorKey]}</p> : null}
      {documents === null ? (
        <div className="mt-8">
          <EmptyState title="Documents could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {documents && documents.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No documents yet">Add a file once an idea exists on this account.</EmptyState>
        </div>
      ) : null}
      {documents && documents.length > 0 ? (
        <ul className="mt-8 divide-y divide-line border border-line">
          {documents.map((document) => (
            <li key={document.id} className="px-5 py-4">
              <p className="text-sm text-cream">{document.name}</p>
              <p className="mt-1 text-xs text-mute">
                {document.kind} · {document.application}
              </p>
              <Link href={`/files/${document.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-gold">
                Open file
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {applications.length > 0 ? (
        <form action={uploadDocumentAction} className="mt-10 grid max-w-xl gap-4">
          <label className="text-sm text-cream">
            Idea
            <select name="applicationId" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
              {applications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.payload.ideaName || item.reference || "Untitled idea"}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm text-cream">Kind</legend>
            <div className="mt-3 grid gap-2">
              {DOCUMENT_KINDS.map((kind) => (
                <label key={kind} className="flex min-h-12 items-center gap-3 text-sm text-cream">
                  <input type="radio" name="kind" value={kind} required className="h-4 w-4" />
                  {documentKindLabel(kind)}
                </label>
              ))}
            </div>
          </fieldset>
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
      ) : (
        <div className="mt-8">
          <Button href="/submit">Submit Your Idea</Button>
        </div>
      )}
    </>
  );
}
