import { createServiceClient, serviceRoleConfigured } from "@/lib/supabase/service";

export type OpsLevel = "warn" | "error";

export type OpsContext = Record<string, string | number | boolean | null>;

const SOURCE = /^[a-z0-9_.:-]{1,64}$/;

/** Trims an issue to what the ops_events table accepts. Pure, so it is tested directly. */
export function opsRow(source: string, message: string, level: OpsLevel, context: OpsContext = {}) {
  const cleanSource = SOURCE.test(source) ? source : "unknown";
  const cleanMessage = (message.trim() || "no message").slice(0, 500);
  const cleanContext = Object.fromEntries(
    Object.entries(context)
      .slice(0, 20)
      .map(([key, value]) => [key.slice(0, 64), typeof value === "string" ? value.slice(0, 300) : value]),
  );
  return { source: cleanSource, level, message: cleanMessage, context: cleanContext };
}

/**
 * Records an operational issue so staff see it in /admin/system, and prints it to
 * the function log either way. Never throws and never records personal data:
 * pass ids and codes in context, not emails, names or message text.
 */
export async function reportIssue(
  source: string,
  message: string,
  context: OpsContext = {},
  level: OpsLevel = "error",
): Promise<void> {
  const row = opsRow(source, message, level, context);
  const log = level === "warn" ? console.warn : console.error;
  log(`[pesara:${row.source}]`, row.message, row.context);
  if (!serviceRoleConfigured()) return;
  try {
    const { error } = await createServiceClient().from("ops_events").insert(row);
    if (error) console.error("[pesara:ops] not recorded", error.message);
  } catch (error) {
    console.error("[pesara:ops] not recorded", error);
  }
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "unknown error";
}
