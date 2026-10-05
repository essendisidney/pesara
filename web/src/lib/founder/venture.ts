import { isUuid } from "@/lib/admin/pipeline";
import { safeHttp } from "@/lib/admin/present";
import { relationshipLabel, ventureStatusLabel } from "@/lib/admin/venture";

export type FounderVenture = {
  /** Present once the database returns it; used to link to the venture's Rails books. */
  id: string | null;
  name: string;
  description: string;
  stage: string;
  status: string;
  relationship: string | null;
  website: string | null;
  milestones: { title: string; dueOn: string | null; completedAt: string | null }[];
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function presentFounderVenture(value: unknown): FounderVenture | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const name = text(row.name);
  if (!name) return null;
  const relationship = text(row.relationship);
  const milestones = Array.isArray(row.milestones)
    ? row.milestones.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const milestone = item as Record<string, unknown>;
        const title = text(milestone.title);
        if (!title) return [];
        return [{
          title,
          dueOn: text(milestone.due_on) || null,
          completedAt: text(milestone.completed_at) || null,
        }];
      })
    : [];
  const id = text(row.id);
  return {
    id: isUuid(id) ? id : null,
    name,
    description: text(row.description),
    stage: text(row.stage),
    status: ventureStatusLabel(text(row.status)),
    relationship: relationship && relationship !== "none" ? relationshipLabel(relationship) : null,
    website: safeHttp(text(row.website) || null),
    milestones,
  };
}
