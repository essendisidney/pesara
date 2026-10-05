import { afterEach, describe, expect, it, vi } from "vitest";
import { NOTIFICATION_KINDS } from "../src/lib/notifications";
import { notificationEmail } from "../src/lib/notifications/email";
import { sendEmail } from "../src/lib/email/send";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("founder notification email", () => {
  it("has copy for every notification kind, naming the reference and an absolute link", () => {
    for (const kind of NOTIFICATION_KINDS) {
      const email = notificationEmail(kind, { reference: "PES-2026-0001", path: "/dashboard/ideas/x" });
      expect(email.subject).toContain("PES-2026-0001");
      expect(email.text).toMatch(/https?:\/\/[^\s]+\/dashboard\/ideas\/x/);
    }
  });

  it("names the new stage", () => {
    const email = notificationEmail("stage_changed", {
      reference: "PES-1",
      stage: "Validation",
      path: "/dashboard",
    });
    expect(email.subject).toBe("PES-1 moved to Validation");
  });
});

describe("sendEmail", () => {
  it("does nothing when no provider is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const fetcher = vi.fn();
    expect(await sendEmail({ to: "a@b.co", subject: "s", text: "t" }, fetcher)).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("posts to Resend and never throws", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Pesara <hello@pesara.africa>");
    const ok = vi.fn(async () => new Response("{}", { status: 200 }));
    expect(await sendEmail({ to: "a@b.co", subject: "s", text: "t" }, ok)).toBe(true);
    const [url, init] = ok.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(String(init.body))).toMatchObject({ to: ["a@b.co"], subject: "s" });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const down = vi.fn(async () => {
      throw new Error("network");
    });
    expect(await sendEmail({ to: "a@b.co", subject: "s", text: "t" }, down)).toBe(false);
    errorSpy.mockRestore();
  });
});
