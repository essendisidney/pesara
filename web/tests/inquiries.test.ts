import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import { inquiryDraft, inquiryStatus } from "../src/lib/inquiries";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("contact inquiries", () => {
  it("keeps a complete inquiry and drops a message that is not an email", () => {
    expect(
      inquiryDraft({
        name: "  Amina  ",
        email: "amina@example.com",
        type: "University",
        message: " We have a campus problem. ",
      }),
    ).toEqual({
      name: "Amina",
      email: "amina@example.com",
      type: "University",
      message: "We have a campus problem.",
    });
    expect(inquiryDraft({ name: "", email: "not-an-email", type: "Other", message: "Hello" })).toBeNull();
    expect(inquiryDraft({ name: "", email: "a@b.co", type: "Investor network", message: "Hello" })).toBeNull();
    expect(inquiryDraft({ name: "", email: "a@b.co", type: "Other", message: "" })).toBeNull();
  });

  it("marks an inquiry handled without putting the address or the message on the activity line", () => {
    expect(inquiryStatus("open")).toBe("open");
    expect(inquiryStatus("handled")).toBe("handled");
    expect(inquiryStatus("closed")).toBeNull();
    expect(
      activitySummary("INQUIRY_HANDLED", { inquiry_id: "id", email: "secret@example.com", message: "private" }, new Map()),
    ).toBe("Inquiry marked handled");
    const sql = readFileSync(path.join(root, "supabase/migrations/20260927180000_pesara_os_inquiry_handled.sql"), "utf8");
    expect(sql).toContain("function public.mark_inquiry_handled");
    expect(sql).toContain("'inquiry_id'");
    expect(sql).not.toContain("'email'");
    expect(sql).not.toContain("'message'");
    expect(sql).toContain("revoke update, delete on table public.inquiries");
  });
});
