import { assessmentSummary, scoreLabel } from "@/lib/admin/viability";
import { formatMean } from "@/lib/admin/pipeline";
import { decisionLabel } from "@/lib/admin/present";

export type ReportLine = { label: string; value: string };

export type ReportSection = {
  title: string;
  body: string;
  lines: ReportLine[];
};

export type ReportSource = {
  idea: string;
  oneLiner: string;
  founder: string;
  country: string;
  sector: string;
  reference: string | null;
  scores: { category: string; label: string; score: number; weight: number; note: string | null }[];
  experiments: { title: string; lines: ReportLine[] }[];
  decision: {
    code: string;
    feedback: string | null;
    nextSteps: string | null;
    commercial: string | null;
    rationale: string | null;
  } | null;
};

const CATEGORIES = [
  "Problem",
  "Customer",
  "Market",
  "Competition",
  "Business model",
  "Distribution",
  "Founder",
  "Technology",
  "Regulation",
  "Evidence",
  "Defensibility",
  "Pesara fit",
] as const;

export function buildOpportunityReport(source: ReportSource): { disclaimer: string; sections: ReportSection[] } {
  const summary = assessmentSummary(source.scores);
  const risks = source.scores.filter((score) => score.score <= 2);
  const sections: ReportSection[] = [
    {
      title: "Executive summary",
      body: source.oneLiner,
      lines: [
        { label: "Idea", value: source.idea },
        { label: "Reference", value: source.reference ?? "No reference yet" },
        { label: "Founder", value: source.founder },
        { label: "Country", value: source.country || "—" },
        { label: "Sector", value: source.sector || "—" },
        { label: "Overall assessment", value: summary.overall == null ? "Not scored" : formatMean(summary.overall) },
        { label: "Pesara decision", value: source.decision ? decisionLabel(source.decision.code) : "No decision recorded" },
      ],
    },
  ];

  for (const category of CATEGORIES) {
    const categoryScore = summary.categories.find((item) => item.category === category);
    const items = source.scores.filter((score) => score.category === category);
    sections.push({
      title: category,
      body: categoryScore?.mean == null ? "Not scored" : formatMean(categoryScore.mean),
      lines: items.map((item) => ({
        label: item.label,
        value: [scoreCaption(item.score), item.note].filter(Boolean).join(" — "),
      })),
    });
  }

  sections.push({
    title: "Key risks",
    body: risks.length ? "Dimensions scored weak or limited." : "No dimension is scored weak or limited.",
    lines: risks.map((item) => ({
      label: `${item.category} · ${item.label}`,
      value: [scoreCaption(item.score), item.note].filter(Boolean).join(" — "),
    })),
  });

  sections.push({
    title: "Validation results",
    body: source.experiments.length ? `${source.experiments.length} experiment${source.experiments.length === 1 ? "" : "s"} recorded.` : "No validation experiments have been recorded.",
    lines: source.experiments.flatMap((experiment) => [
      { label: experiment.title, value: experiment.lines.map((line) => `${line.label}: ${line.value}`).join(" · ") || "Recorded" },
    ]),
  });

  sections.push({
    title: "Recommended MVP",
    body: "No MVP recommendation has been written.",
    lines: [],
  });

  sections.push({
    title: "Commercial considerations",
    body: "Visible to Pesara staff.",
    lines: source.decision?.commercial ? [{ label: "Commercial considerations", value: source.decision.commercial }] : [],
  });

  sections.push({
    title: "Pesara decision",
    body: source.decision ? decisionLabel(source.decision.code) : "No committee decision has been recorded.",
    lines: [
      ...(source.decision?.feedback ? [{ label: "Founder feedback", value: source.decision.feedback }] : []),
      ...(source.decision?.rationale ? [{ label: "Internal rationale", value: source.decision.rationale }] : []),
    ],
  });

  sections.push({
    title: "Next steps",
    body: source.decision?.nextSteps || "No next step has been written.",
    lines: [],
  });

  return {
    disclaimer: "Scores support human commercial judgement and do not predict venture success.",
    sections,
  };
}

export function reportFromFile(file: {
  idea: string;
  oneLiner: string;
  founder: string;
  country: string;
  sector: string;
  reference: string | null;
  assessments: { scores: ReportSource["scores"] }[];
  experiments: { title: string; lines: ReportLine[] }[];
  decisions: { code: string; shared: ReportLine[]; internal: ReportLine[] }[];
}): ReportSource {
  const latest = file.decisions[0] ?? null;
  const valueOf = (lines: ReportLine[], label: string) => lines.find((line) => line.label === label)?.value ?? null;
  return {
    idea: file.idea,
    oneLiner: file.oneLiner,
    founder: file.founder,
    country: file.country,
    sector: file.sector,
    reference: file.reference,
    scores: file.assessments[0]?.scores ?? [],
    experiments: file.experiments.map((experiment) => ({ title: experiment.title, lines: experiment.lines })),
    decision: latest
      ? {
          code: latest.code,
          feedback: valueOf(latest.shared, "Founder feedback"),
          nextSteps: valueOf(latest.shared, "Next steps"),
          commercial: valueOf(latest.internal, "Commercial considerations"),
          rationale: valueOf(latest.internal, "Rationale"),
        }
      : null,
  };
}

function scoreCaption(score: number): string {
  return `${score} / 5 · ${scoreLabel(score)}`;
}
