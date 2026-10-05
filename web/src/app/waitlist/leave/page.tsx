import type { Metadata } from "next";
import { SiteShell } from "@/components/marketing/site-shell";
import { Button } from "@/components/ui/button";
import { leaveWaitlistAction } from "@/lib/waitlist-action";

export const metadata: Metadata = {
  title: "Leave the list",
  robots: { index: false, follow: false },
};

const messages: Record<string, string> = {
  left: "Done. If that link was still active, the address has been removed from the list.",
  invalid: "This link is not valid. Use the link from the most recent Pesara email.",
  offline: "Pesara is not connected, so the list cannot be updated right now.",
  failed: "The list could not be updated. Try the link again later.",
};

export default async function LeaveWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";
  const status = typeof query.status === "string" ? messages[query.status] ?? null : null;

  return (
    <SiteShell>
      <section className="mx-auto max-w-xl px-5 py-24">
        <h1 className="text-3xl font-semibold">Leave the Pesara list</h1>
        {status ? (
          <p className="mt-4 text-gold">{status}</p>
        ) : token ? (
          <form action={leaveWaitlistAction} className="mt-8">
            <p className="text-mute">Pesara will stop sending community email to this address.</p>
            <input type="hidden" name="token" value={token} />
            <div className="mt-6">
              <Button type="submit">Remove me from the list</Button>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-mute">Open the link from a Pesara email to leave the list.</p>
        )}
      </section>
    </SiteShell>
  );
}
