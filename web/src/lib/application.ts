export const APPLYING_AS = [
  "Individual",
  "Team",
  "Existing company",
  "Organisation",
  "Other",
] as const;

export const MARKET_GEOS = ["Kenya", "East Africa", "Africa", "Global", "Other"] as const;

export const CUSTOMER_KINDS = [
  "Individual",
  "Business",
  "Government",
  "Marketplace",
  "Other",
] as const;

export const COMMITMENT = ["Exploring", "Part-time", "Full-time"] as const;

export const PRICING_MODELS = [
  "One-time",
  "Subscription",
  "Transaction",
  "Commission",
  "Marketplace",
  "Advertising",
  "Licensing",
  "Other",
] as const;

export const EVIDENCE_KINDS = [
  "Spoken to potential customers",
  "Existing users",
  "Paying customers",
  "Revenue",
  "Waitlist",
  "Prototype",
  "Website",
  "LOIs",
  "Pilot customers",
  "Pre-orders",
  "Research",
  "Existing business",
  "None yet",
] as const;

export const CONTRIBUTION_KINDS = [
  "Domain expertise",
  "Customers",
  "Distribution",
  "Capital",
  "Existing technology",
  "Team",
  "Licences",
  "Partnerships",
  "Intellectual property",
  "Research",
  "Brand",
  "Community",
  "Nothing yet",
] as const;

export const NEED_KINDS = [
  "Idea validation",
  "Business model",
  "Product strategy",
  "UX/UI",
  "Software development",
  "Mobile app",
  "Web platform",
  "AI",
  "Payments",
  "Cloud",
  "Data",
  "Market launch",
  "Growth",
  "Partnerships",
  "Funding readiness",
  "Everything",
] as const;

export const STEP_TITLES = [
  "About you",
  "The problem",
  "The idea",
  "The market",
  "Evidence",
  "Business model",
  "The founder / team",
  "What you bring",
  "What you need",
  "Review & submit",
] as const;

export type ApplicationDraft = {
  applicationId: string | null;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  linkedin: string;
  occupation: string;
  applyingAs: string;
  problem: string;
  whoHasIt: string;
  problemSeverity: string;
  frequency: string;
  currentSolution: string;
  whyInadequate: string;
  ideaName: string;
  oneLiner: string;
  proposedSolution: string;
  customerDoes: string;
  whyChoose: string;
  targetCustomer: string;
  customerKind: string;
  location: string;
  marketGeo: string;
  competitors: string;
  opportunitySize: string;
  reachCustomers: string;
  evidenceKinds: string[];
  spokenToCustomers: string;
  interviews: string;
  hasUsers: string;
  userCount: string;
  paying: string;
  revenue: string;
  waitlistSize: string;
  evidenceNotes: string;
  whoPays: string;
  whyPay: string;
  howMoney: string;
  pricing: string;
  pricingModel: string;
  costs: string;
  whyYou: string;
  experience: string;
  industryKnowledge: string;
  relationships: string;
  cofounders: string;
  skills: string;
  commitment: string;
  contributions: string[];
  contributionNotes: string;
  needs: string[];
  successLooksLike: string;
  accurate: boolean;
  noPartnership: boolean;
  noObligation: boolean;
  authority: boolean;
  writtenAgreement: boolean;
  step: number;
  updatedAt: string;
  submitted: boolean;
  reference: string | null;
  stage: string;
};

export const EMPTY_DRAFT: ApplicationDraft = {
  applicationId: null,
  fullName: "",
  email: "",
  phone: "",
  country: "Kenya",
  city: "",
  linkedin: "",
  occupation: "",
  applyingAs: "Individual",
  problem: "",
  whoHasIt: "",
  problemSeverity: "",
  frequency: "",
  currentSolution: "",
  whyInadequate: "",
  ideaName: "",
  oneLiner: "",
  proposedSolution: "",
  customerDoes: "",
  whyChoose: "",
  targetCustomer: "",
  customerKind: "Individual",
  location: "",
  marketGeo: "Kenya",
  competitors: "",
  opportunitySize: "",
  reachCustomers: "",
  evidenceKinds: [],
  spokenToCustomers: "",
  interviews: "",
  hasUsers: "",
  userCount: "",
  paying: "",
  revenue: "",
  waitlistSize: "",
  evidenceNotes: "",
  whoPays: "",
  whyPay: "",
  howMoney: "",
  pricing: "",
  pricingModel: "Subscription",
  costs: "",
  whyYou: "",
  experience: "",
  industryKnowledge: "",
  relationships: "",
  cofounders: "",
  skills: "",
  commitment: "Exploring",
  contributions: [],
  contributionNotes: "",
  needs: [],
  successLooksLike: "",
  accurate: false,
  noPartnership: false,
  noObligation: false,
  authority: false,
  writtenAgreement: false,
  step: 1,
  updatedAt: "",
  submitted: false,
  reference: null,
  stage: "draft",
};

export const emptyDraft = (): ApplicationDraft => ({
  ...EMPTY_DRAFT,
  evidenceKinds: [],
  contributions: [],
  needs: [],
});

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function mergeDraft(raw: unknown): ApplicationDraft {
  if (!raw || typeof raw !== "object") return emptyDraft();
  const input = raw as Partial<ApplicationDraft> & { evidence?: string; contribution?: string };
  const next = { ...emptyDraft(), ...input };
  next.evidenceKinds = asStringArray(input.evidenceKinds ?? input.evidence);
  next.contributions = asStringArray(input.contributions ?? input.contribution);
  next.needs = asStringArray(input.needs);
  return next;
}

export const STORAGE_KEY = "pesara.application.draft.v2";

const draftListeners = new Set<() => void>();

export function subscribeDraft(listener: () => void) {
  draftListeners.add(listener);
  return () => {
    draftListeners.delete(listener);
  };
}

function emitDraft() {
  draftListeners.forEach((listener) => listener());
}

let cachedRaw: string | null = null;
let cachedDraft: ApplicationDraft = EMPTY_DRAFT;

export function getDraftSnapshot(): ApplicationDraft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("pesara.application.draft.v1");
  if (raw === cachedRaw) return cachedDraft;
  cachedRaw = raw;
  cachedDraft = raw ? mergeDraft(JSON.parse(raw) as unknown) : emptyDraft();
  return cachedDraft;
}

export function loadDraft(): ApplicationDraft {
  return getDraftSnapshot();
}

export function saveDraft(draft: ApplicationDraft): ApplicationDraft {
  const next = { ...draft, updatedAt: new Date().toISOString() };
  const serialized = JSON.stringify(next);
  localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedDraft = next;
  emitDraft();
  return next;
}

export function formatReference(year: number, token: string): string {
  const clean = token.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
  return `PSR-${year}-${clean}`;
}

export function makeReference(now = new Date(), tokenSource = () => crypto.randomUUID()): string {
  return formatReference(now.getFullYear(), tokenSource().replaceAll("-", "").slice(0, 6));
}

export function makeReferralCode(name: string, token = "X7K9"): string {
  const slug =
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 16) || "FOUNDER";
  return `PESARA-${slug}-${token}`;
}

export function greetingForNairobi(now = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Africa/Nairobi",
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
