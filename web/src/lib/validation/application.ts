import { z } from "zod";
import {
  APPLYING_AS,
  COMMITMENT,
  CUSTOMER_KINDS,
  MARKET_GEOS,
  PRICING_MODELS,
} from "@/lib/application";

export const applyingAsSchema = z.enum(APPLYING_AS);

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

export const stepProblemSchema = z.object({
  problem: z.string().min(8),
  whoHasIt: z.string().min(2),
  problemSeverity: z.string().min(2),
  frequency: z.string().min(2),
  currentSolution: z.string().min(2),
  whyInadequate: z.string().min(2),
});

export const marketSchema = z.object({
  customerKind: z.enum(CUSTOMER_KINDS),
  marketGeo: z.enum(MARKET_GEOS),
  commitment: z.enum(COMMITMENT),
  pricingModel: z.enum(PRICING_MODELS),
});

export const declarationsSchema = z.object({
  accurate: z.literal(true),
  noPartnership: z.literal(true),
  noObligation: z.literal(true),
  authority: z.literal(true),
  writtenAgreement: z.literal(true),
});
