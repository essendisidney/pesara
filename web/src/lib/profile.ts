import { safeHttp } from "@/lib/admin/present";

export type FounderContact = {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  occupation: string;
  linkedin: string;
};

function limited(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > max) return null;
  return trimmed;
}

export function founderContact(input: {
  fullName: unknown;
  phone: unknown;
  country: unknown;
  city: unknown;
  occupation: unknown;
  linkedin: unknown;
}): FounderContact | null {
  const fullName = limited(input.fullName, 120);
  const phone = limited(input.phone, 40);
  const country = limited(input.country, 80);
  const city = limited(input.city, 80);
  const occupation = limited(input.occupation, 120);
  const linkedinRaw = limited(input.linkedin, 300);
  if (fullName === null || phone === null || country === null || city === null || occupation === null || linkedinRaw === null) {
    return null;
  }
  if (linkedinRaw && !safeHttp(linkedinRaw)) return null;
  return { fullName, phone, country, city, occupation, linkedin: linkedinRaw };
}
