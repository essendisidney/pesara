import { publishedPortfolioCards, type PortfolioCard } from "@/lib/admin/venture";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

function records(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item));
}

export async function loadPublishedPortfolio(): Promise<PortfolioCard[]> {
  if (!supabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("published_portfolio");
  if (error) return [];
  return publishedPortfolioCards(records(data));
}
