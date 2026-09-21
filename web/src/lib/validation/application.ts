import { z } from "zod";

export const applyingAsSchema = z.enum([
  "Individual",
  "Existing company",
  "Team",
  "Organisation",
  "Other",
]);

export const stepOneSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  country: z.string().min(2),
  city: z.string().min(1),
  linkedin: z.string().url().optional().or(z.literal("")),
  occupation: z.string().min(1),
  applyingAs: applyingAsSchema,
});

export const declarationsSchema = z.object({
  accurate: z.literal(true),
  noPartnership: z.literal(true),
  noObligation: z.literal(true),
  authority: z.literal(true),
  writtenAgreement: z.literal(true),
});
