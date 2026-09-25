import { requestAccountAction } from "@/lib/account-actions";
import { accountRequestLabel } from "@/lib/account-requests";
import { setMarketingConsentAction } from "@/lib/consent-actions";
import { loadOwnMarketing } from "@/lib/founder/consent";
import { loadOwnContact } from "@/lib/founder/profile";
import { updateFounderProfileAction } from "@/lib/profile-actions";
import { Input } from "@/components/ui/input";
import { loadOwnAccountRequests } from "@/lib/admin/office-data";
import { formatNairobi } from "@/lib/admin/present";
import { requireFounder } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireFounder();
  const query = await searchParams;
  const requests = await loadOwnAccountRequests(auth.userId);
  const marketing = await loadOwnMarketing(auth.userId);
  const contact = await loadOwnContact(auth.userId);
  const consentNotice = query.notice === "consent" ? "Choice saved." : null;
  const requestNotice = query.notice === "requested" ? "Request received. A person at Pesara will handle it." : null;
  const consentError =
    query.error === "choice"
      ? "That choice was not accepted."
      : query.error === "unstored"
        ? "The choice could not be stored."
        : null;
  const profileNotice = query.notice === "profile" ? "Contact details saved." : null;
  const profileError =
    query.error === "profile"
      ? "Check the details. A link needs to start with http:// or https://."
      : query.error === "profile-failed"
        ? "The details could not be stored."
        : null;
  const requestError =
    query.error === "invalid"
      ? "That request was not accepted."
      : query.error === "failed"
        ? "The request could not be stored."
        : null;

  return (
    <>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-3 max-w-xl text-sm text-mute">
        {auth.fullName || auth.email}. Your founder record is created when you register. Your introduction link is on the dashboard.
      </p>
      <section className="mt-10 max-w-xl">
        <h2 className="text-lg font-semibold">Contact details</h2>
        <p className="mt-2 text-sm text-mute">
          These details are what Pesara staff see on your founder record. They are not shown on the public site.
        </p>
        {profileNotice ? <p className="mt-4 text-sm text-cream">{profileNotice}</p> : null}
        {profileError ? <p className="mt-4 text-sm text-gold">{profileError}</p> : null}
        {contact === null ? (
          <p className="mt-4 text-sm text-mute">Contact details could not be read.</p>
        ) : (
          <form action={updateFounderProfileAction} className="mt-4 grid gap-4">
            <label className="text-sm">
              Name
              <Input name="fullName" defaultValue={contact.fullName} maxLength={120} autoComplete="name" />
            </label>
            <label className="text-sm">
              Phone
              <Input name="phone" defaultValue={contact.phone} maxLength={40} autoComplete="tel" />
            </label>
            <label className="text-sm">
              Country
              <Input name="country" defaultValue={contact.country} maxLength={80} autoComplete="country-name" />
            </label>
            <label className="text-sm">
              City
              <Input name="city" defaultValue={contact.city} maxLength={80} autoComplete="address-level2" />
            </label>
            <label className="text-sm">
              Occupation
              <Input name="occupation" defaultValue={contact.occupation} maxLength={120} />
            </label>
            <label className="text-sm">
              LinkedIn
              <Input name="linkedin" defaultValue={contact.linkedin} maxLength={300} placeholder="https://" />
            </label>
            <Button type="submit" variant="line">
              Save details
            </Button>
          </form>
        )}
      </section>
      <section className="mt-10 max-w-xl">
        <h2 className="text-lg font-semibold">Hearing from Pesara</h2>
        <p className="mt-2 text-sm text-mute">
          The box starts unticked. Pesara records a yes only after you tick it and save. Saving the same choice again does not add another record.
        </p>
        {consentNotice ? <p className="mt-4 text-sm text-cream">{consentNotice}</p> : null}
        {consentError ? <p className="mt-4 text-sm text-gold">{consentError}</p> : null}
        {marketing === null ? (
          <p className="mt-4 text-sm text-mute">This choice could not be read.</p>
        ) : (
          <form action={setMarketingConsentAction} className="mt-4">
            <label className="flex min-h-12 items-start gap-3 py-1 text-sm">
              <input type="checkbox" name="marketing" defaultChecked={marketing} className="mt-1 h-5 w-5" />
              <span>I agree to hear from Pesara about the studio.</span>
            </label>
            <Button type="submit" variant="line" className="mt-4">
              Save choice
            </Button>
          </form>
        )}
      </section>
      <section className="mt-10 max-w-xl">
        <h2 className="text-lg font-semibold">Your account</h2>
        <p className="mt-2 text-sm text-mute">
          You can ask for a copy of your account, or ask for it to be deleted. Sending the request does not delete anything. A person handles it.
        </p>
        {requestNotice ? <p className="mt-4 text-sm text-cream">{requestNotice}</p> : null}
        {requestError ? <p className="mt-4 text-sm text-gold">{requestError}</p> : null}
        {requests === null ? <p className="mt-4 text-sm text-mute">Account requests could not be read.</p> : null}
        {requests && requests.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border border-line">
            {requests.map((request) => (
              <li key={request.id} className="px-5 py-4 text-sm">
                <span className="text-cream">{accountRequestLabel(request.kind)}</span>
                <span className="mt-1 block text-xs text-mute">
                  {request.status === "recorded" ? "Recorded" : "Requested"} · {formatNairobi(request.at)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={requestAccountAction}>
            <input type="hidden" name="kind" value="export" />
            <Button type="submit" variant="line">
              Request an export
            </Button>
          </form>
          <form action={requestAccountAction}>
            <input type="hidden" name="kind" value="deletion" />
            <Button type="submit" variant="line">
              Request deletion
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
