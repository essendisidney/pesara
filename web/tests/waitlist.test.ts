import { describe, expect, it } from "vitest";
import { waitlistDraft, waitlistEmail } from "../src/lib/waitlist";

describe("community list", () => {
  it("requires consent and a real email, and does not treat a blank leave as an address", () => {
    expect(
      waitlistDraft({
        name: " Amina ",
        email: "amina@example.com",
        country: "Kenya",
        interests: " Studios ",
        persona: "Founder",
        consent: true,
      }),
    ).toEqual({
      name: "Amina",
      email: "amina@example.com",
      country: "Kenya",
      interests: "Studios",
      persona: "Founder",
    });
    expect(
      waitlistDraft({
        name: "",
        email: "amina@example.com",
        country: "",
        interests: "",
        persona: "Founder",
        consent: false,
      }),
    ).toBe("consent");
    expect(waitlistEmail("not-an-email")).toBeNull();
    expect(waitlistEmail("  amina@example.com ")).toBe("amina@example.com");
  });
});
