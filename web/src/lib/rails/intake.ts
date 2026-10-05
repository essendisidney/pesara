import { z } from "zod";
import { MAX_EVENT_MINOR } from "@/lib/rails/split";

/** Largest request body the intake reads. One event is a few hundred bytes. */
export const MAX_BODY_BYTES = 16 * 1024;

export const railsEventSchema = z
  .object({
    venture_id: z.uuid(),
    source_event_id: z.string().trim().min(1).max(200),
    kind: z.string().regex(/^[a-z0-9_.-]{1,64}$/),
    gross_minor: z
      .number()
      .int()
      .refine((value) => value !== 0 && Math.abs(value) <= MAX_EVENT_MINOR, "gross_minor must be non-zero and within range"),
    currency: z.string().regex(/^[A-Z]{3}$/),
    occurred_at: z.iso.datetime({ offset: true }),
    reference: z.string().trim().max(200).nullish(),
    reverses: z.string().trim().min(1).max(200).nullish(),
  })
  .strict()
  .refine((event) => (event.gross_minor < 0) === Boolean(event.reverses), {
    message: "a refund has a negative gross and names the event it reverses",
    path: ["reverses"],
  });

export type RailsEventBody = z.infer<typeof railsEventSchema>;

/** Reads just the venture id, before the signature is checked, to find the secret. */
export function ventureIdOf(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const parsed = z.uuid().safeParse((value as Record<string, unknown>).venture_id);
  return parsed.success ? parsed.data : null;
}

/**
 * Database refusals the sender can act on. Anything else is reported as a
 * server error without the database message.
 */
const REFUSALS: { match: string; status: number; error: string }[] = [
  { match: "no active agreement", status: 409, error: "no_active_agreement" },
  { match: "source_event_id reused", status: 409, error: "source_event_conflict" },
  { match: "event already refunded", status: 409, error: "already_refunded" },
  { match: "kind is not in scope", status: 422, error: "kind_out_of_scope" },
  { match: "currency does not match", status: 422, error: "currency_mismatch" },
  { match: "refund must reverse", status: 422, error: "unknown_original" },
  { match: "full refunds only", status: 422, error: "partial_refund" },
  { match: "invalid occurred_at", status: 422, error: "invalid_occurred_at" },
];

export function refusalFor(message: string | undefined): { status: number; error: string } {
  const found = REFUSALS.find((refusal) => message?.includes(refusal.match));
  return found ? { status: found.status, error: found.error } : { status: 500, error: "not_recorded" };
}
