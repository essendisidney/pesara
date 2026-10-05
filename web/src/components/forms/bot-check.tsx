import Script from "next/script";
import { HONEYPOT_FIELD } from "@/lib/abuse";

/**
 * Hidden honeypot plus, when configured, a Cloudflare Turnstile widget.
 * Place inside a <form>; the server action checks both with humanSubmission().
 */
export function BotCheck({ className }: { className?: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {siteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
          <div className={`cf-turnstile ${className ?? ""}`} data-sitekey={siteKey} data-theme="dark" />
        </>
      ) : null}
    </>
  );
}
