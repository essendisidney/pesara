import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { railsEventSchema, refusalFor, ventureIdOf } from "../src/lib/rails/intake";
import { MAX_SKEW_SECONDS, signatureHeader, signPayload, verifySignature } from "../src/lib/rails/signature";

const SECRET = "a".repeat(64);
const BODY = JSON.stringify({ venture_id: "11111111-1111-1111-1111-111111111111", source_event_id: "e1", gross_minor: 100 });
const NOW = 1_790_000_000;

function check(overrides: Partial<Parameters<typeof verifySignature>[0]> = {}) {
  const timestamp = String(NOW);
  return verifySignature({
    secret: SECRET,
    rawBody: BODY,
    signature: signatureHeader(SECRET, timestamp, BODY),
    timestamp,
    nowSeconds: NOW,
    ...overrides,
  });
}

describe("rails intake signature", () => {
  it("signs `${timestamp}.${body}` with HMAC-SHA256", () => {
    const expected = createHmac("sha256", SECRET).update(`${NOW}.${BODY}`).digest("hex");
    expect(signPayload(SECRET, String(NOW), BODY)).toBe(expected);
    expect(signatureHeader(SECRET, String(NOW), BODY)).toBe(`sha256=${expected}`);
  });

  it("accepts a fresh, correctly signed request", () => {
    expect(check()).toEqual({ ok: true });
    expect(check({ signature: signatureHeader(SECRET, String(NOW), BODY).toUpperCase().replace("SHA256=", "sha256=") })).toEqual({ ok: true });
  });

  it("refuses missing headers or secret", () => {
    expect(check({ signature: null })).toEqual({ ok: false, reason: "missing" });
    expect(check({ timestamp: null })).toEqual({ ok: false, reason: "missing" });
    expect(check({ secret: "" })).toEqual({ ok: false, reason: "missing" });
  });

  it("refuses malformed headers", () => {
    expect(check({ signature: "deadbeef" })).toEqual({ ok: false, reason: "malformed" });
    expect(check({ signature: "sha1=" + "0".repeat(64) })).toEqual({ ok: false, reason: "malformed" });
    expect(check({ timestamp: "12.5" })).toEqual({ ok: false, reason: "malformed" });
  });

  it("refuses a request older or newer than five minutes", () => {
    const old = String(NOW - MAX_SKEW_SECONDS - 1);
    expect(check({ timestamp: old, signature: signatureHeader(SECRET, old, BODY) })).toEqual({ ok: false, reason: "stale" });
    const future = String(NOW + MAX_SKEW_SECONDS + 1);
    expect(check({ timestamp: future, signature: signatureHeader(SECRET, future, BODY) })).toEqual({ ok: false, reason: "stale" });
    const edge = String(NOW - MAX_SKEW_SECONDS);
    expect(check({ timestamp: edge, signature: signatureHeader(SECRET, edge, BODY) })).toEqual({ ok: true });
  });

  it("refuses a tampered body, a moved timestamp, or the wrong secret", () => {
    expect(check({ rawBody: BODY.replace("100", "1000") })).toEqual({ ok: false, reason: "mismatch" });
    expect(check({ timestamp: String(NOW - 1) })).toEqual({ ok: false, reason: "mismatch" });
    expect(check({ secret: "b".repeat(64) })).toEqual({ ok: false, reason: "mismatch" });
  });
});

describe("rails intake body", () => {
  const event = {
    venture_id: "11111111-1111-4111-8111-111111111111",
    source_event_id: "pi_123",
    kind: "plan_purchase",
    gross_minor: 250_000,
    currency: "KES",
    occurred_at: "2026-10-01T09:30:00+03:00",
    reference: "PLAN-42",
  };

  it("accepts a revenue event and a full refund", () => {
    expect(railsEventSchema.safeParse(event).success).toBe(true);
    expect(railsEventSchema.safeParse({ ...event, source_event_id: "rf_1", gross_minor: -250_000, reverses: "pi_123" }).success).toBe(true);
  });

  it("refuses floats, zero, unknown fields, and refunds without an original", () => {
    expect(railsEventSchema.safeParse({ ...event, gross_minor: 2500.5 }).success).toBe(false);
    expect(railsEventSchema.safeParse({ ...event, gross_minor: 0 }).success).toBe(false);
    expect(railsEventSchema.safeParse({ ...event, gross_minor: -5 }).success).toBe(false);
    expect(railsEventSchema.safeParse({ ...event, reverses: "pi_0" }).success).toBe(false);
    expect(railsEventSchema.safeParse({ ...event, currency: "kes" }).success).toBe(false);
    expect(railsEventSchema.safeParse({ ...event, kind: "Plan Purchase" }).success).toBe(false);
    expect(railsEventSchema.safeParse({ ...event, occurred_at: "yesterday" }).success).toBe(false);
    expect(railsEventSchema.safeParse({ ...event, split: { pesara: 0 } }).success).toBe(false);
  });

  it("reads the venture id before the signature check", () => {
    expect(ventureIdOf(event)).toBe(event.venture_id);
    expect(ventureIdOf({ venture_id: "nope" })).toBeNull();
    expect(ventureIdOf([event])).toBeNull();
  });

  it("maps database refusals without leaking other errors", () => {
    expect(refusalFor("no active agreement")).toEqual({ status: 409, error: "no_active_agreement" });
    expect(refusalFor("kind is not in scope for this agreement")).toEqual({ status: 422, error: "kind_out_of_scope" });
    expect(refusalFor("relation does not exist")).toEqual({ status: 500, error: "not_recorded" });
    expect(refusalFor(undefined)).toEqual({ status: 500, error: "not_recorded" });
  });
});
