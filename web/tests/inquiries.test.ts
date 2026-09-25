import { describe, expect, it } from "vitest";
import { inquiryDraft } from "../src/lib/inquiries";

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
});
