import Link from "next/link";
import { addFounderMeetingAction, addFounderNoteAction } from "@/lib/admin/office-actions";
import { recordAccountRequestAction } from "@/lib/account-actions";
import { accountRequestLabel } from "@/lib/account-requests";
import { loadFounder } from "@/lib/admin/office-data";
import { knownMessage, PAGE_ERRORS } from "@/lib/admin/pipeline";
import { formatNairobi } from "@/lib/admin/present";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const notices: Record<string, string> = {
  note: "Internal note saved.",
  meeting: "Meeting recorded.",
  request: "Account request marked recorded.",
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const result = await loadFounder(id);
  const notice = knownMessage(notices, query.notice);
  const error = knownMessage(PAGE_ERRORS, query.error);

  if (result.status === "offline") {
    return <EmptyState title="Database is not connected">This founder stays hidden until Pesara is connected.</EmptyState>;
  }
  if (result.status === "error") {
    return <EmptyState title="This founder could not be read">Try opening the record again in a moment.</EmptyState>;
  }
  if (!result.founder) {
    return (
      <EmptyState title="Founder not found">
        <Link href="/admin/founders" className="text-gold">
          Back to founders
        </Link>
      </EmptyState>
    );
  }

  const founder = result.founder;
  return (
    <>
      <Link href="/admin/founders" className="text-sm text-gold">
        Founders
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{founder.name}</h1>
      <p className="mt-2 text-sm text-mute">{[founder.place, founder.occupation, founder.phone].filter(Boolean).join(" · ") || "Contact details have not been added."}</p>
      {founder.linkedin ? (
        <a href={founder.linkedin} className="mt-2 inline-flex min-h-11 items-center text-sm text-gold">
          LinkedIn
        </a>
      ) : null}
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Applications</h2>
        {founder.applications.length === 0 ? <p className="mt-3 text-sm text-mute">No applications on this account.</p> : null}
        <ul className="mt-3 divide-y divide-line border border-line">
          {founder.applications.map((item) => (
            <li key={item.id}>
              <Link href={`/admin/applications/${item.id}`} className="block px-5 py-4 text-sm text-cream">
                {item.reference} · {item.stage}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Account requests</h2>
        <p className="mt-2 text-sm text-mute">Marking a request recorded does not delete the account or send a file.</p>
        {founder.requests.length === 0 ? <p className="mt-3 text-sm text-mute">No account requests.</p> : null}
        <ul className="mt-3 space-y-4">
          {founder.requests.map((request) => (
            <li key={request.id} className="border border-line px-5 py-4">
              <p className="text-sm text-cream">
                {accountRequestLabel(request.kind)} · {request.status === "recorded" ? "Recorded" : "Requested"}
              </p>
              <p className="mt-1 text-xs text-mute">{formatNairobi(request.at)}</p>
              {request.status === "requested" ? (
                <form action={recordAccountRequestAction} className="mt-3">
                  <input type="hidden" name="requestId" value={request.id} />
                  <input type="hidden" name="founderId" value={founder.id} />
                  <Button type="submit" variant="line">
                    Mark recorded
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Marketing</h2>
        <p className="mt-2 text-sm text-mute">A founder records this. Staff cannot tick it for them.</p>
        <p className="mt-3 text-sm text-cream">{founder.marketing ? "Opted in" : "Not opted in"}</p>
        {founder.consents.length === 0 ? <p className="mt-3 text-sm text-mute">No consent recorded.</p> : (
          <ul className="mt-3 divide-y divide-line border border-line">
            {founder.consents.map((consent) => (
              <li key={consent.id} className="px-5 py-4 text-sm">
                <span className="text-cream">{consent.granted ? "Granted" : "Withdrawn"}</span>
                <span className="mt-1 block text-xs text-mute">{formatNairobi(consent.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Meetings</h2>
        <p className="mt-2 text-sm text-mute">Visible to Pesara staff.</p>
        {founder.meetings.length === 0 ? <p className="mt-3 text-sm text-mute">No meetings recorded.</p> : null}
        <ul className="mt-3 space-y-4">
          {founder.meetings.map((meeting) => (
            <li key={meeting.id} className="border border-line px-5 py-4">
              <p className="text-xs text-mute">
                {meeting.heldOn} · {meeting.reference}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{meeting.summary}</p>
            </li>
          ))}
        </ul>
        <form action={addFounderMeetingAction} className="mt-6 grid max-w-xl gap-4">
          <input type="hidden" name="founderId" value={founder.id} />
          <label className="text-sm text-cream">
            Date
            <input name="heldOn" type="date" required className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3" />
          </label>
          {founder.applications.length > 0 ? (
            <label className="text-sm text-cream">
              Application
              <select name="applicationId" className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-ink-2/80 px-3">
                <option value="">General</option>
                {founder.applications.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.reference}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="text-sm text-cream">
            Summary
            <textarea name="summary" required maxLength={4000} rows={4} className="mt-2 w-full min-h-28 rounded-[2px] border border-line bg-ink-2/80 px-3 py-3" />
          </label>
          <Button type="submit">Record meeting</Button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Internal notes</h2>
        <p className="mt-2 text-sm text-mute">These notes do not appear on the founder dashboard.</p>
        {founder.notes.length === 0 ? <p className="mt-3 text-sm text-mute">No internal notes.</p> : null}
        <ul className="mt-3 space-y-4">
          {founder.notes.map((note) => (
            <li key={note.id} className="border border-line px-5 py-4">
              <p className="text-xs text-mute">{formatNairobi(note.at)}</p>
              <p className="mt-2 text-sm whitespace-pre-wrap text-cream">{note.body}</p>
            </li>
          ))}
        </ul>
        <form action={addFounderNoteAction} className="mt-6 grid max-w-xl gap-4">
          <input type="hidden" name="founderId" value={founder.id} />
          <label className="text-sm text-cream">
            Note
            <textarea name="body" required maxLength={4000} rows={4} className="mt-2 w-full min-h-28 rounded-[2px] border border-line bg-ink-2/80 px-3 py-3" />
          </label>
          <Button type="submit">Save note</Button>
        </form>
      </section>
    </>
  );
}
