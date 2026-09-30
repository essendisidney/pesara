import { formatNairobi } from "@/lib/admin/present";
import { markInquiryHandledAction } from "@/lib/admin/office-actions";
import { loadInquiries, loadOpenInquiryCount, loadWaitlist } from "@/lib/admin/office-data";
import { knownMessage, PAGE_ERRORS } from "@/lib/admin/pipeline";
import { EmptyState } from "@/components/ui/empty-state";

const notices: Record<string, string> = { handled: "Inquiry marked handled." };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const [result, open, community] = await Promise.all([loadInquiries(), loadOpenInquiryCount(), loadWaitlist()]);
  const notice = knownMessage(notices, query.notice);
  const error = knownMessage(PAGE_ERRORS, query.error);
  return (
    <>
      <p className="text-xs tracking-[0.18em] text-gold uppercase">Inquiries</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Contact desk</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">Messages sent from the public contact page. They are not applications. Marking one handled does not reply to the sender.</p>
      {notice ? <p className="mt-4 text-sm text-cream">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}
      {open.status === "ready" ? (
        <p className="mt-4 text-sm text-mute">{open.open === 1 ? "1 open message." : `${open.open} open messages.`}</p>
      ) : null}
      {result.status === "offline" ? (
        <div className="mt-10">
          <EmptyState title="Database is not connected">Inquiries stay hidden until Pesara is connected.</EmptyState>
        </div>
      ) : null}
      {result.status === "error" ? (
        <div className="mt-10">
          <EmptyState title="Inquiries could not be read">Try this page again in a moment.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && result.inquiries.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No inquiries yet">A message appears here after someone sends the contact form.</EmptyState>
        </div>
      ) : null}
      {result.status === "ready" && result.inquiries.length > 0 ? (
        <ul className="mt-10 max-w-3xl divide-y divide-line border border-line">
          {result.inquiries.map((item) => (
            <li key={item.id} className="px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-cream">{item.name}</p>
                  <p className="mt-1 text-sm text-gold">{item.email}</p>
                </div>
                {item.status === "open" ? (
                  <form action={markInquiryHandledAction}>
                    <input type="hidden" name="inquiryId" value={item.id} />
                    <button type="submit" className="min-h-11 text-sm text-gold">
                      Mark handled
                    </button>
                  </form>
                ) : (
                  <p className="text-xs tracking-[0.14em] text-mute uppercase">Handled</p>
                )}
              </div>
              <p className="mt-2 text-xs tracking-[0.14em] text-mute uppercase">{item.type}</p>
              <p className="mt-3 text-sm whitespace-pre-wrap text-cream">{item.message}</p>
              <p className="mt-3 text-xs text-mute">{formatNairobi(item.at)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <section className="mt-16 max-w-3xl">
        <h2 className="text-lg font-semibold">Community</h2>
        <p className="mt-2 text-sm text-mute">Addresses from the homepage list. Someone who left is kept here so the removal is visible.</p>
        {community.status === "offline" ? <p className="mt-4 text-sm text-mute">The list stays hidden until Pesara is connected.</p> : null}
        {community.status === "error" ? <p className="mt-4 text-sm text-mute">The community list could not be read.</p> : null}
        {community.status === "ready" && community.people.length === 0 ? (
          <p className="mt-4 text-sm text-mute">No one has joined.</p>
        ) : null}
        {community.status === "ready" && community.people.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border border-line">
            {community.people.map((person) => (
              <li key={person.id} className="px-5 py-4">
                <p className="text-sm text-cream">{person.name}</p>
                <p className="mt-1 text-sm text-gold">{person.email}</p>
                <p className="mt-2 text-xs text-mute">
                  {person.persona} · {person.country}
                  {person.left ? " · Left" : ""}
                  {" · "}
                  {formatNairobi(person.at)}
                </p>
                {person.interests ? <p className="mt-2 text-sm text-cream">{person.interests}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}
