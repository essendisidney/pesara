import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { INQUIRY_TYPES } from "@/lib/inquiries";
import { submitInquiryAction } from "@/lib/inquiries-action";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const notice = query.notice === "sent";
  const error =
    query.error === "invalid"
      ? "Check the email and the message, then send it again."
      : query.error === "offline"
        ? "Pesara is not connected, so this message cannot be stored."
        : query.error === "failed"
          ? "The message could not be stored."
          : null;

  return (
    <SiteShell>
      <PageIntro eyebrow="Contact" title="Talk to Pesara.">
        Tell us why you are writing. A person reads what arrives.
      </PageIntro>
      <form action={submitInquiryAction} className="mx-auto max-w-xl space-y-4 px-5 pb-24">
        <label className="block text-sm">
          Name
          <input name="name" maxLength={80} autoComplete="name" className="mt-2 h-12 w-full rounded-[2px] border border-line bg-ink-2 px-3" />
        </label>
        <label className="block text-sm">
          Email
          <input required type="email" name="email" maxLength={160} autoComplete="email" className="mt-2 h-12 w-full rounded-[2px] border border-line bg-ink-2 px-3" />
        </label>
        <label className="block text-sm">
          Inquiry type
          <select name="type" className="mt-2 h-12 w-full rounded-[2px] border border-line bg-ink-2 px-3">
            {INQUIRY_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Message
          <textarea required name="message" rows={5} maxLength={4000} className="mt-2 w-full rounded-[2px] border border-line bg-ink-2 p-3" />
        </label>
        {notice ? <p className="text-sm text-gold">Received. A person at Pesara can read it.</p> : null}
        {error ? <p className="text-sm text-gold">{error}</p> : null}
        {notice ? null : <Button type="submit">Send</Button>}
      </form>
    </SiteShell>
  );
}
