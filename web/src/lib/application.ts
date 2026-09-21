export const APPLYING_AS = [
  "Individual",
  "Existing company",
  "Team",
  "Organisation",
  "Other",
] as const;

export const BUSINESS_TYPES = [
  "B2C",
  "B2B",
  "B2B2C",
  "Government",
  "Marketplace",
  "Other",
] as const;

export const COMMITMENT = ["Full-time", "Part-time", "Exploring"] as const;

export type ApplicationDraft = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  linkedin: string;
  occupation: string;
  applyingAs: string;
  ideaName: string;
  oneLiner: string;
  problem: string;
  whoHasIt: string;
  currentSolution: string;
  whyInadequate: string;
  proposedSolution: string;
  targetCustomer: string;
  location: string;
  businessType: string;
  frequency: string;
  opportunitySize: string;
  competitors: string;
  whyChoose: string;
  spokenToCustomers: string;
  interviews: string;
  hasUsers: string;
  userCount: string;
  paying: string;
  revenue: string;
  evidence: string;
  whoPays: string;
  howMoney: string;
  pricing: string;
  costs: string;
  defensibility: string;
  whyYou: string;
  experience: string;
  commitment: string;
  cofounders: string;
  skills: string;
  needs: string;
  contribution: string;
  accurate: boolean;
  noPartnership: boolean;
  noObligation: boolean;
  authority: boolean;
  writtenAgreement: boolean;
  step: number;
  updatedAt: string;
  submitted: boolean;
  reference: string | null;
};

export const EMPTY_DRAFT: ApplicationDraft = {
  fullName: "",
  email: "",
  phone: "",
  country: "Kenya",
  city: "",
  linkedin: "",
  occupation: "",
  applyingAs: "Individual",
  ideaName: "",
  oneLiner: "",
  problem: "",
  whoHasIt: "",
  currentSolution: "",
  whyInadequate: "",
  proposedSolution: "",
  targetCustomer: "",
  location: "",
  businessType: "B2C",
  frequency: "",
  opportunitySize: "",
  competitors: "",
  whyChoose: "",
  spokenToCustomers: "",
  interviews: "",
  hasUsers: "",
  userCount: "",
  paying: "",
  revenue: "",
  evidence: "",
  whoPays: "",
  howMoney: "",
  pricing: "",
  costs: "",
  defensibility: "",
  whyYou: "",
  experience: "",
  commitment: "Exploring",
  cofounders: "",
  skills: "",
  needs: "",
  contribution: "",
  accurate: false,
  noPartnership: false,
  noObligation: false,
  authority: false,
  writtenAgreement: false,
  step: 1,
  updatedAt: "",
  submitted: false,
  reference: null,
};

export const emptyDraft = (): ApplicationDraft => ({ ...EMPTY_DRAFT });

export function mergeDraft(raw: unknown): ApplicationDraft {
  if (!raw || typeof raw !== "object") return emptyDraft();
  return { ...emptyDraft(), ...(raw as Partial<ApplicationDraft>) };
}

export const STORAGE_KEY = "pesara.application.draft.v1";

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
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedDraft;
  cachedRaw = raw;
  cachedDraft = raw ? mergeDraft(JSON.parse(raw)) : EMPTY_DRAFT;
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

export function makeReference(now = new Date(), tokenSource = () => crypto.randomUUID()): string {
  const year = now.getFullYear();
  const token = tokenSource().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `PSR-${year}-${token}`;
}

export function makeReferralCode(name: string, token = "X7K9"): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16) || "FOUNDER";
  return `PESARA-${slug}-${token}`;
}
