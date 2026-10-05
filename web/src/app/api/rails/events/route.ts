import { MAX_BODY_BYTES, railsEventSchema, refusalFor, ventureIdOf } from "@/lib/rails/intake";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifySignature } from "@/lib/rails/signature";
import { createServiceClient, serviceRoleConfigured } from "@/lib/supabase/service";

/**
 * Pesara Rails v0 revenue event intake.
 * A venture's backend posts one in-scope revenue event (or a full refund of one),
 * signed with that venture's secret. See docs/PESARA_RAILS_V0.md.
 */

function reply(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!serviceRoleConfigured()) return reply(503, { error: "not_configured" });

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return reply(413, { error: "too_large" });
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return reply(413, { error: "too_large" });

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return reply(400, { error: "invalid_json" });
  }
  const ventureId = ventureIdOf(json);
  if (!ventureId) return reply(400, { error: "invalid_event" });

  const supabase = createServiceClient();
  const { data: secretRow, error: secretError } = await supabase
    .from("rails_venture_secrets")
    .select("secret")
    .eq("venture_id", ventureId)
    .maybeSingle();
  if (secretError) return reply(500, { error: "not_recorded" });

  const check = verifySignature({
    secret: typeof secretRow?.secret === "string" ? secretRow.secret : "",
    rawBody,
    signature: request.headers.get(SIGNATURE_HEADER),
    timestamp: request.headers.get(TIMESTAMP_HEADER),
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  // An unknown venture and a bad signature look the same to the caller.
  if (!check.ok) return reply(401, { error: check.reason === "stale" ? "stale_timestamp" : "invalid_signature" });

  const parsed = railsEventSchema.safeParse(json);
  if (!parsed.success) {
    return reply(400, { error: "invalid_event", fields: parsed.error.issues.map((issue) => issue.path.join(".")) });
  }
  const event = parsed.data;

  const { data, error } = await supabase.rpc("rails_record_event", {
    p_venture: event.venture_id,
    p_source_event_id: event.source_event_id,
    p_kind: event.kind,
    p_gross_minor: event.gross_minor,
    p_currency: event.currency,
    p_occurred_at: event.occurred_at,
    p_reference: event.reference ?? null,
    p_reverses: event.reverses ?? null,
  });
  if (error) {
    const refusal = refusalFor(error.message);
    return reply(refusal.status, { error: refusal.error });
  }
  const result = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const duplicate = result.duplicate === true;
  return reply(duplicate ? 200 : 201, { event_id: result.event_id ?? null, duplicate });
}
