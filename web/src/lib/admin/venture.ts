import { safeHttp } from "@/lib/admin/present";

export const VENTURE_STATUSES = ["VALIDATING", "BUILDING", "LIVE", "SCALING", "EXITED", "PAUSED"] as const;

export type VentureStatus = (typeof VENTURE_STATUSES)[number];

export const PUBLIC_RELATIONSHIPS = [
  "none",
  "built_by_pesara",
  "pesara_company",
  "technology_by_pesara",
] as const;

export type PublicRelationship = (typeof PUBLIC_RELATIONSHIPS)[number];

export const COMMERCIAL_KINDS = [
  "CLIENT_BUILD",
  "BUILD_GROW",
  "VENTURE_BUILD",
  "JOINT_VENTURE",
  "PESARA_LABS",
] as const;

export type CommercialKind = (typeof COMMERCIAL_KINDS)[number];

export function ventureStatusLabel(status: string): string {
  switch (status) {
    case "VALIDATING":
      return "Validating";
    case "BUILDING":
      return "Building";
    case "LIVE":
      return "Live";
    case "SCALING":
      return "Scaling";
    case "EXITED":
      return "Exited";
    case "PAUSED":
      return "Paused";
    default:
      return "Recorded status";
  }
}

export function relationshipLabel(relationship: string | null): string {
  switch (relationship) {
    case "built_by_pesara":
      return "Built by Pesara";
    case "pesara_company":
      return "A Pesara Company";
    case "technology_by_pesara":
      return "Technology by Pesara";
    case "none":
    case null:
    case "":
      return "Not set";
    default:
      return "Not set";
  }
}

export function commercialKindLabel(kind: string | null): string {
  switch (kind) {
    case "CLIENT_BUILD":
      return "Client build";
    case "BUILD_GROW":
      return "Build + grow";
    case "VENTURE_BUILD":
      return "Venture build";
    case "JOINT_VENTURE":
      return "Joint venture";
    case "PESARA_LABS":
      return "Pesara Labs";
    default:
      return "Not set";
  }
}

export function isVentureStatus(value: string): value is VentureStatus {
  return (VENTURE_STATUSES as readonly string[]).includes(value);
}

export function isPublicRelationship(value: string): value is PublicRelationship {
  return (PUBLIC_RELATIONSHIPS as readonly string[]).includes(value);
}

export function isCommercialKind(value: string): value is CommercialKind {
  return (COMMERCIAL_KINDS as readonly string[]).includes(value);
}

const NAMED_RELATIONSHIPS = ["built_by_pesara", "pesara_company", "technology_by_pesara"] as const;

const RESERVED_PORTFOLIO = ["marit", "jameiyah", "little scientist", "mukuna & co. advocates", "athi gardens"];

export type PortfolioCard = {
  name: string;
  place: string;
  relationship: string;
  body: string;
  domain: string;
  href: string;
};

function textValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function publishedPortfolioCards(rows: readonly Record<string, unknown>[]): PortfolioCard[] {
  const reserved = new Set(RESERVED_PORTFOLIO);
  const cards: PortfolioCard[] = [];
  for (const row of rows) {
    const name = textValue(row.name);
    const body = textValue(row.description);
    const relationship = textValue(row.pesara_relationship);
    const href = safeHttp(textValue(row.website));
    if (!name || name.length > 200 || !body || body.length > 600 || !href) continue;
    if (!relationship || !(NAMED_RELATIONSHIPS as readonly string[]).includes(relationship)) continue;
    if (reserved.has(name.toLowerCase())) continue;
    const place = textValue(row.country) ?? textValue(row.industry) ?? "";
    cards.push({
      name,
      place,
      relationship: relationshipLabel(relationship),
      body,
      domain: href.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href,
    });
  }
  return cards;
}

export function publicVentureCard(venture: {
  name: string;
  website: string | null;
  relationship: string | null;
}): { name: string; relationship: string; website: string | null } {
  return {
    name: venture.name,
    relationship: relationshipLabel(venture.relationship),
    website: venture.website,
  };
}

export const VENTURE_NOTICES: Record<string, string> = {
  saved: "Venture workspace saved.",
  milestone: "Milestone added.",
  completed: "Milestone marked complete.",
  kpi: "KPI recorded.",
  snapshot: "KPI reading recorded.",
  note: "Internal note saved.",
  document: "Document stored.",
  published: "This venture is on the public portfolio.",
  unpublished: "This venture is off the public portfolio.",
};
