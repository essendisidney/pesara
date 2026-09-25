import { isUuid } from "@/lib/admin/pipeline";
import type { FounderContact } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function loadOwnContact(userId: string): Promise<FounderContact | null> {
  if (!isUuid(userId) || !supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, country, city, occupation, linkedin_url")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    fullName: text(data.full_name),
    phone: text(data.phone),
    country: text(data.country),
    city: text(data.city),
    occupation: text(data.occupation),
    linkedin: text(data.linkedin_url),
  };
}
