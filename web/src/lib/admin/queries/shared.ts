import { STAFF_ROLES } from "@/lib/permissions/roles";
import type { Line } from "@/lib/admin/present";
import { createClient } from "@/lib/supabase/server";

export type Db = Awaited<ReturnType<typeof createClient>>;

export type StaffOption = {
  id: string;
  name: string;
  role: string;
};

export function records(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Record<string, unknown> => {
    return item !== null && typeof item === "object" && !Array.isArray(item);
  });
}

export function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function whole(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export function amount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function metadata(value: unknown): Record<string, string | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry == null) out[key] = null;
    else if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

export function evidenceFields(value: unknown): Line[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const lines: Line[] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && entry.trim()) lines.push({ label: key, value: entry.trim() });
    else if (typeof entry === "number" && Number.isFinite(entry)) lines.push({ label: key, value: String(entry) });
    if (lines.length >= 12) break;
  }
  return lines;
}

export function uniqueTexts(rows: Record<string, unknown>[], key: string): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const value = text(row[key]);
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function founderName(profile: string | undefined, draftName: string): string {
  if (profile && profile !== "Unnamed") return profile;
  if (draftName.trim()) return draftName.trim();
  return profile ?? "Founder";
}

export async function namesFor(supabase: Db, ids: readonly string[]): Promise<Map<string, string> | null> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", unique);
  if (error) return null;
  for (const row of records(data)) {
    const id = text(row.id);
    if (!id) continue;
    map.set(id, text(row.full_name) ?? "Unnamed");
  }
  return map;
}

export async function loadStaff(supabase: Db): Promise<StaffOption[] | null> {
  const { data, error } = await supabase.from("user_roles").select("user_id, role").in("role", [...STAFF_ROLES]);
  if (error) return null;
  const roleRows = records(data);
  const names = await namesFor(
    supabase,
    roleRows.flatMap((row) => {
      const id = text(row.user_id);
      return id ? [id] : [];
    }),
  );
  if (!names) return null;
  const staff = roleRows.flatMap((row) => {
    const id = text(row.user_id);
    const role = text(row.role);
    if (!id || !role) return [];
    return [{ id, role, name: names.get(id) ?? "Unnamed" }];
  });
  staff.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  return staff;
}
