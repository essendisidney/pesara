export const WAITLIST_PERSONAS = ["Founder", "Investor", "Technologist", "Business", "Student", "Other"] as const;

export type WaitlistPersona = (typeof WAITLIST_PERSONAS)[number];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function waitlistDraft(input: {
  name: string;
  email: string;
  country: string;
  interests: string;
  persona: string;
  consent: boolean;
}): { name: string; email: string; country: string; interests: string; persona: WaitlistPersona } | "consent" | null {
  const name = input.name.trim();
  const email = input.email.trim();
  const country = input.country.trim();
  const interests = input.interests.trim();
  const persona = input.persona.trim();
  if (name.length > 80 || country.length > 80 || interests.length > 160) return null;
  if (!email || email.length > 160 || !EMAIL.test(email)) return null;
  if (!(WAITLIST_PERSONAS as readonly string[]).includes(persona)) return null;
  if (!input.consent) return "consent";
  return { name, email, country, interests, persona: persona as WaitlistPersona };
}

export function waitlistEmail(value: string): string | null {
  const email = value.trim();
  if (!email || email.length > 160 || !EMAIL.test(email)) return null;
  return email;
}
