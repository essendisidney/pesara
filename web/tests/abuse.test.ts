import { afterEach, describe, expect, it, vi } from "vitest";
import { HONEYPOT_FIELD, honeypotTripped, rateLimited, turnstilePassed } from "../src/lib/abuse";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("abuse guard", () => {
  it("trips the honeypot only when the hidden field is filled", () => {
    expect(honeypotTripped(form({ email: "a@b.co" }))).toBe(false);
    expect(honeypotTripped(form({ [HONEYPOT_FIELD]: "  " }))).toBe(false);
    expect(honeypotTripped(form({ [HONEYPOT_FIELD]: "https://spam.example" }))).toBe(true);
  });

  it("passes Turnstile when it is not configured", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const fetcher = vi.fn();
    expect(await turnstilePassed(form({}), fetcher)).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("requires a token and a successful verification when configured", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    const ok = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    const bad = vi.fn(async () => new Response(JSON.stringify({ success: false })));
    const down = vi.fn(async () => {
      throw new Error("network");
    });

    expect(await turnstilePassed(form({}), ok)).toBe(false);
    expect(ok).not.toHaveBeenCalled();
    expect(await turnstilePassed(form({ "cf-turnstile-response": "t" }), ok)).toBe(true);
    expect(await turnstilePassed(form({ "cf-turnstile-response": "t" }), bad)).toBe(false);
    expect(await turnstilePassed(form({ "cf-turnstile-response": "t" }), down)).toBe(false);
  });

  it("recognises the database rate-limit error", () => {
    expect(rateLimited("rate limited")).toBe(true);
    expect(rateLimited("invalid waitlist")).toBe(false);
    expect(rateLimited(undefined)).toBe(false);
  });
});
