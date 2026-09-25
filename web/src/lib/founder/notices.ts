import { noticeCopy } from "@/lib/notices";
import { isUuid } from "@/lib/admin/pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type FounderNotice = {
  id: string;
  kind: string;
  body: string;
  at: string;
  read: boolean;
};

export async function loadFounderNotices(userId: string): Promise<FounderNotice[] | null> {
  if (!isUuid(userId) || !supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, body, created_at, read_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return null;
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    const id = typeof row.id === "string" ? row.id : "";
    const kind = typeof row.kind === "string" ? row.kind : "";
    const body = noticeCopy(kind) ?? (typeof row.body === "string" ? row.body : "");
    const at = typeof row.created_at === "string" ? row.created_at : "";
    if (!id || !body || !at) return [];
    return [{ id, kind, body, at, read: typeof row.read_at === "string" }];
  });
}
