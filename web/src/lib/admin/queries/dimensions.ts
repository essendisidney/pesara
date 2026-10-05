import type { DimensionRow } from "@/lib/admin/viability";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";
import { amount, records, text } from "./shared";

export async function loadDimensionCatalog(): Promise<
  | { status: "offline" }
  | { status: "error" }
  | { status: "ready"; dimensions: DimensionRow[] }
> {
  if (!supabaseConfigured()) return { status: "offline" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("viability_dimensions").select("key, label, category, weight");
  if (error) return { status: "error" };
  return {
    status: "ready",
    dimensions: records(data).flatMap((row) => {
      const key = text(row.key);
      if (!key) return [];
      return [
        {
          key,
          label: text(row.label) ?? key,
          category: text(row.category) ?? "Assessment",
          weight: amount(row.weight) ?? 1,
        },
      ];
    }),
  };
}
