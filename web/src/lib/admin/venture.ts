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
  kpi: "KPI recorded.",
  note: "Internal note saved.",
};
