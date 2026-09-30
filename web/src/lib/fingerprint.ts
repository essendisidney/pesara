import { createHash } from "node:crypto";
import type { ApplicationDraft } from "@/lib/application";

/**
 * A SHA-256 fingerprint of the core of a submitted idea. Anyone holding the same
 * text can recompute it and show it matches what Pesara received and when.
 * It is a record, not a legal instrument.
 */
export const FINGERPRINT_FIELDS = [
  "ideaName",
  "oneLiner",
  "problem",
  "whoHasIt",
  "proposedSolution",
  "moneyFlow",
] as const;

export function fingerprintSource(
  payload: Pick<ApplicationDraft, (typeof FINGERPRINT_FIELDS)[number]>,
  reference: string,
  submittedAt: string,
): string {
  const core: Record<string, string> = { reference, submittedAt };
  for (const field of FINGERPRINT_FIELDS) {
    core[field] = (payload[field] ?? "").trim();
  }
  const sorted = Object.keys(core)
    .sort()
    .map((key) => [key, core[key]]);
  return JSON.stringify(sorted);
}

export function ideaFingerprint(
  payload: Pick<ApplicationDraft, (typeof FINGERPRINT_FIELDS)[number]>,
  reference: string,
  submittedAt: string,
): string {
  return createHash("sha256").update(fingerprintSource(payload, reference, submittedAt), "utf8").digest("hex");
}

/** Groups a hex digest for reading aloud or comparing by eye. */
export function groupFingerprint(hex: string, groups = 4): string {
  return (hex.slice(0, groups * 4).match(/.{4}/g) ?? []).join(" ");
}
