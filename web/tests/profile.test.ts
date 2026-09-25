import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { founderContact } from "../src/lib/profile";

const migration = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations/20260925100000_pesara_os_profile.sql"),
  "utf8",
);

const blank = {
  fullName: "Amina Otieno",
  phone: "",
  country: "Kenya",
  city: "",
  occupation: "",
  linkedin: "",
};

describe("founder contact", () => {
  it("keeps a complete contact line and drops a link that is not a web address", () => {
    expect(founderContact(blank)?.fullName).toBe("Amina Otieno");
    expect(founderContact({ ...blank, linkedin: "https://www.linkedin.com/in/amina" })?.linkedin).toBe(
      "https://www.linkedin.com/in/amina",
    );
    expect(founderContact({ ...blank, linkedin: "javascript:alert(1)" })).toBeNull();
    expect(founderContact({ ...blank, phone: "x".repeat(41) })).toBeNull();
    expect(migration).toContain("where id = auth.uid()");
    expect(migration).not.toContain("marketing_opt_in");
  });
});
