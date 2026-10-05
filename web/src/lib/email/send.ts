export type Email = {
  to: string;
  subject: string;
  text: string;
};

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Sends one plain-text email through Resend. Never throws: a failed email must not
 * undo the action that triggered it. Returns whether the provider accepted it.
 */
export async function sendEmail(email: Email, fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        text: email.text,
      }),
    });
    if (!response.ok) {
      console.error("[pesara:email] provider rejected", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[pesara:email] send failed", error);
    return false;
  }
}
