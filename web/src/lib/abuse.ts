/** Name of the hidden field a person never fills. Bots that fill every input reveal themselves. */
export const HONEYPOT_FIELD = "company_website";

const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function honeypotTripped(formData: FormData): boolean {
  const value = formData.get(HONEYPOT_FIELD);
  return typeof value === "string" && value.trim() !== "";
}

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

/**
 * Verifies a Cloudflare Turnstile token. Passes when Turnstile is not configured,
 * so local development and previews keep working; the database limits still apply.
 */
export async function turnstilePassed(
  formData: FormData,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  const token = formData.get("cf-turnstile-response");
  if (typeof token !== "string" || !token) return false;
  try {
    const response = await fetcher(TURNSTILE_VERIFY, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY ?? "",
        response: token,
      }),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

/** True when the submission looks human enough to store. */
export async function humanSubmission(formData: FormData): Promise<boolean> {
  if (honeypotTripped(formData)) return false;
  return turnstilePassed(formData);
}

export function rateLimited(message: string | undefined): boolean {
  return Boolean(message?.includes("rate limited"));
}
