import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WAITLIST_PERSONAS } from "@/lib/waitlist";
import { joinWaitlistAction, leaveWaitlistAction } from "@/lib/waitlist-action";

const notices: Record<string, string> = {
  joined: "Noted. Pesara has this address.",
  left: "If that address was on the list, it has been removed.",
  consent: "Tick the box if you agree to hear from Pesara. It is never pre-ticked.",
  invalid: "Check the email, then try again.",
  offline: "Pesara is not connected, so this address cannot be stored.",
  failed: "The list could not be updated.",
};

export function WaitlistForm({ status }: { status: string | null }) {
  const message = status ? notices[status] ?? null : null;
  return (
    <div className="mt-8 max-w-xl">
      <form action={joinWaitlistAction} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm sm:col-span-1">
          Name
          <Input name="name" required maxLength={80} autoComplete="name" />
        </label>
        <label className="text-sm">
          Email
          <Input name="email" type="email" required maxLength={160} autoComplete="email" />
        </label>
        <label className="text-sm">
          Country
          <Input name="country" defaultValue="Kenya" maxLength={80} autoComplete="country-name" />
        </label>
        <label className="text-sm">
          I am a
          <select name="persona" className="mt-2 h-12 w-full rounded-[2px] border border-line bg-ink-2 px-3 text-sm" defaultValue="Founder">
            {WAITLIST_PERSONAS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Interests
          <Input name="interests" maxLength={160} />
        </label>
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="consent" className="mt-1" />
          <span className="text-mute">I agree to hear from Pesara about the studio. This box is never pre-ticked.</span>
        </label>
        {message ? <p className="text-sm text-gold sm:col-span-2">{message}</p> : null}
        <div className="sm:col-span-2">
          <Button type="submit">Join the community</Button>
        </div>
      </form>
      <form action={leaveWaitlistAction} className="mt-8 grid gap-3 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          Leave the list
          <Input name="email" type="email" required maxLength={160} autoComplete="email" />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" variant="line">
            Remove this address
          </Button>
        </div>
      </form>
    </div>
  );
}
