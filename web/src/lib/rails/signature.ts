import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pesara Rails intake signatures.
 *
 * The sender signs `${timestamp}.${rawBody}` with the venture's secret using
 * HMAC-SHA256 and sends:
 *   x-pesara-timestamp: <unix seconds>
 *   x-pesara-signature: sha256=<lowercase hex>
 * A request older (or further in the future) than five minutes is refused so a
 * captured request cannot be replayed later. Idempotency on source_event_id
 * covers replays inside the window.
 */

export const SIGNATURE_HEADER = "x-pesara-signature";
export const TIMESTAMP_HEADER = "x-pesara-timestamp";
export const MAX_SKEW_SECONDS = 5 * 60;

export type SignatureCheck =
  | { ok: true }
  | { ok: false; reason: "missing" | "malformed" | "stale" | "mismatch" };

export function signPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
}

export function signatureHeader(secret: string, timestamp: string, rawBody: string): string {
  return `sha256=${signPayload(secret, timestamp, rawBody)}`;
}

export function verifySignature({
  secret,
  rawBody,
  signature,
  timestamp,
  nowSeconds,
}: {
  secret: string;
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  nowSeconds: number;
}): SignatureCheck {
  if (!signature || !timestamp || !secret) return { ok: false, reason: "missing" };
  if (!/^\d{1,12}$/.test(timestamp)) return { ok: false, reason: "malformed" };
  const match = /^sha256=([0-9a-f]{64})$/i.exec(signature.trim());
  if (!match) return { ok: false, reason: "malformed" };
  const sent = Number(timestamp);
  if (Math.abs(nowSeconds - sent) > MAX_SKEW_SECONDS) return { ok: false, reason: "stale" };
  const expected = Buffer.from(signPayload(secret, timestamp, rawBody), "hex");
  const received = Buffer.from(match[1].toLowerCase(), "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true };
}
