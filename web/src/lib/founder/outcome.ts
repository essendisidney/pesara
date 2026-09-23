export type FounderDecision = {
  decision: string;
  title: string;
  feedback: string;
  nextSteps: string;
  reviewDate: string | null;
  recordedAt: string | null;
};

export function formatReviewDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function titleFor(decision: string): string {
  switch (decision) {
    case "BUILD":
      return "Build";
    case "PILOT":
      return "Pilot";
    case "PIVOT":
      return "Pivot";
    case "PARK":
      return "Park";
    case "DECLINE":
      return "Decline";
    default:
      return "Recorded decision";
  }
}

export function presentFounderDecision(row: {
  decision?: unknown;
  founder_feedback?: unknown;
  next_steps?: unknown;
  review_date?: unknown;
  created_at?: unknown;
}): FounderDecision | null {
  if (typeof row.decision !== "string" || !row.decision.trim()) return null;
  const feedback = typeof row.founder_feedback === "string" ? row.founder_feedback.trim() : "";
  const nextSteps = typeof row.next_steps === "string" ? row.next_steps.trim() : "";
  const reviewDate = typeof row.review_date === "string" && row.review_date.trim() ? row.review_date.trim() : null;
  const recordedAt = typeof row.created_at === "string" ? row.created_at : null;
  return {
    decision: row.decision,
    title: titleFor(row.decision),
    feedback,
    nextSteps,
    reviewDate,
    recordedAt,
  };
}

export function latestFounderDecision(rows: unknown): FounderDecision | null {
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  const parsed = list.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const decision = presentFounderDecision(row as Record<string, unknown>);
    return decision ? [decision] : [];
  });
  parsed.sort((a, b) => (b.recordedAt ?? "").localeCompare(a.recordedAt ?? ""));
  return parsed[0] ?? null;
}
