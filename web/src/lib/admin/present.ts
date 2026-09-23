import type { ApplicationDraft } from "@/lib/application";
import { stageLabel } from "@/lib/admin/pipeline";

export type Line = { label: string; value: string };

function line(label: string, value: string): Line {
  const trimmed = value.trim();
  return { label, value: trimmed || "—" };
}

function joined(values: readonly string[]): string {
  return values.length ? values.join(", ") : "";
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function applicationSections(draft: ApplicationDraft): { title: string; lines: Line[] }[] {
  return [
    {
      title: "About you",
      lines: [
        line("Name", draft.fullName),
        line("Email", draft.email),
        line("Phone", draft.phone),
        line("Country", draft.country),
        line("City", draft.city),
        line("LinkedIn", draft.linkedin),
        line("Occupation", draft.occupation),
        line("Applying as", draft.applyingAs),
      ],
    },
    {
      title: "The problem",
      lines: [
        line("Problem", draft.problem),
        line("Who has it", draft.whoHasIt),
        line("Severity", draft.problemSeverity),
        line("Frequency", draft.frequency),
        line("Current solution", draft.currentSolution),
        line("Why that falls short", draft.whyInadequate),
      ],
    },
    {
      title: "The idea",
      lines: [
        line("Idea", draft.ideaName),
        line("One line", draft.oneLiner),
        line("Proposed solution", draft.proposedSolution),
        line("What the customer does", draft.customerDoes),
        line("Why they would choose it", draft.whyChoose),
      ],
    },
    {
      title: "The market",
      lines: [
        line("Target customer", draft.targetCustomer),
        line("Customer kind", draft.customerKind),
        line("Location", draft.location),
        line("Market", draft.marketGeo),
        line("Competitors", draft.competitors),
        line("Opportunity size", draft.opportunitySize),
        line("How you reach them", draft.reachCustomers),
      ],
    },
    {
      title: "Business model",
      lines: [
        line("Who pays", draft.whoPays),
        line("Why they pay", draft.whyPay),
        line("How money is made", draft.howMoney),
        line("Pricing", draft.pricing),
        line("Pricing model", draft.pricingModel),
        line("Costs", draft.costs),
      ],
    },
    {
      title: "The founder / team",
      lines: [
        line("Why you", draft.whyYou),
        line("Experience", draft.experience),
        line("Industry knowledge", draft.industryKnowledge),
        line("Relationships", draft.relationships),
        line("Co-founders", draft.cofounders),
        line("Skills", draft.skills),
        line("Commitment", draft.commitment),
      ],
    },
    {
      title: "What you bring",
      lines: [
        line("Contributions", joined(draft.contributions)),
        line("Notes", draft.contributionNotes),
      ],
    },
    {
      title: "What you need",
      lines: [
        line("Needs", joined(draft.needs)),
        line("Success looks like", draft.successLooksLike),
      ],
    },
    {
      title: "Declarations",
      lines: [
        line("Accurate", yesNo(draft.accurate)),
        line("No partnership yet", yesNo(draft.noPartnership)),
        line("No obligation to proceed", yesNo(draft.noObligation)),
        line("Authority to submit", yesNo(draft.authority)),
        line("Written agreement required", yesNo(draft.writtenAgreement)),
      ],
    },
  ];
}

export function evidenceLines(draft: ApplicationDraft): Line[] {
  return [
    line("Evidence", joined(draft.evidenceKinds)),
    line("Spoken to customers", draft.spokenToCustomers),
    line("Interviews", draft.interviews),
    line("Has users", draft.hasUsers),
    line("User count", draft.userCount),
    line("Paying customers", draft.paying),
    line("Revenue", draft.revenue),
    line("Waitlist", draft.waitlistSize),
    line("Notes", draft.evidenceNotes),
  ];
}

export function roleLabel(role: string): string {
  const words = role.toLowerCase().replaceAll("_", " ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Staff";
}

export function formatBytes(size: number | null): string {
  if (size == null || size < 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "Document";
}

export function safeHttp(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function formatNairobi(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function person(id: string | null, names: ReadonlyMap<string, string>): string {
  if (!id) return "Unassigned";
  return names.get(id) ?? "Unknown";
}

export function activitySummary(
  action: string,
  metadata: Record<string, string | null>,
  names: ReadonlyMap<string, string>,
): string {
  switch (action) {
    case "APPLICATION_SUBMITTED":
      return metadata.reference ? `Application submitted as ${metadata.reference}` : "Application submitted";
    case "APPLICATION_WITHDRAWN":
      return "Application withdrawn";
    case "ANALYST_ASSIGNED":
      return `Analyst set to ${person(metadata.to_analyst ?? null, names)} from ${person(metadata.from_analyst ?? null, names)}`;
    case "STAGE_CHANGED":
      return `Stage set to ${stageLabel(metadata.to_stage ?? "")} from ${stageLabel(metadata.from_stage ?? "")}`;
    case "NOTE_ADDED":
      return "Internal note added";
    case "ASSESSMENT_RECORDED":
      return metadata.version ? `Opportunity assessment version ${metadata.version} recorded` : "Opportunity assessment recorded";
    case "EXPERIMENT_RECORDED":
      return "Validation experiment recorded";
    case "COMMITTEE_DECIDED":
      return `Committee recorded ${decisionLabel(metadata.decision ?? "")}`;
    case "VENTURE_CREATED":
      return "Venture created";
    default:
      return "Recorded activity";
  }
}

export function decisionLabel(decision: string): string {
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
