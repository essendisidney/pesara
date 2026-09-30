export const INQUIRY_TYPES = [
  "Build software",
  "Submit idea",
  "Corporate partnership",
  "Investor",
  "University",
  "Media",
  "Other",
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

export type InquiryStatus = "open" | "handled";

export function inquiryStatus(value: string | null): InquiryStatus | null {
  if (value === "open" || value === "handled") return value;
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function inquiryDraft(input: {
  name: string;
  email: string;
  type: string;
  message: string;
}): { name: string; email: string; type: InquiryType; message: string } | null {
  const name = input.name.trim();
  const email = input.email.trim();
  const type = input.type.trim();
  const message = input.message.trim();
  if (name.length > 80) return null;
  if (!email || email.length > 160 || !EMAIL.test(email)) return null;
  if (!(INQUIRY_TYPES as readonly string[]).includes(type)) return null;
  if (!message || message.length > 4000) return null;
  return { name, email, type: type as InquiryType, message };
}
