export const IDEA_CHECK_DISCLAIMER =
  "This is a preliminary reading of what you wrote. It is not investment advice and it does not predict whether a venture will succeed.";

export type IdeaAnswers = {
  problem: string;
  who: string;
  today: string;
  inadequate: string;
  payer: string;
  evidence: string;
  position: string;
};

export type Clarity = 0 | 1 | 2 | 3;

export type IdeaCategory = {
  key: "problem" | "customer" | "evidence" | "business" | "distribution" | "founder";
  label: string;
  level: Clarity;
  caption: string;
};

export type IdeaDiagnostic = {
  disclaimer: string;
  categories: IdeaCategory[];
  questions: string[];
};

const CAPTIONS = ["Not described", "Early", "Partial", "Described"] as const;

const CHANNEL = /\b(whatsapp|instagram|facebook|tiktok|agent|agents|shop|shops|market|branch|church|mosque|school|sacco|referral|advertise|advert|sms|visit|door|stall|route|distributor)\b/i;

function words(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function depth(value: string): Clarity {
  const count = words(value);
  if (count === 0) return 0;
  if (count < 8) return 1;
  if (count < 24) return 2;
  return 3;
}

function caption(level: Clarity): string {
  return CAPTIONS[level];
}

function distribution(answers: IdeaAnswers): Clarity {
  const fields = Object.values(answers);
  const hit = fields.find((value) => words(value) >= 8 && CHANNEL.test(value));
  if (!hit) return 0;
  return words(hit) >= 24 ? 2 : 1;
}

function combine(left: Clarity, right: Clarity): Clarity {
  return Math.min(3, Math.round((left + right) / 2)) as Clarity;
}

export function diagnoseIdea(answers: IdeaAnswers): IdeaDiagnostic {
  const problem = combine(depth(answers.problem), depth(answers.inadequate));
  const customer = depth(answers.who);
  const evidence = depth(answers.evidence);
  const business = depth(answers.payer);
  const founder = depth(answers.position);
  const reach = distribution(answers);
  const categories: IdeaCategory[] = [
    { key: "problem", label: "Problem clarity", level: problem, caption: caption(problem) },
    { key: "customer", label: "Customer clarity", level: customer, caption: caption(customer) },
    { key: "evidence", label: "Evidence maturity", level: evidence, caption: caption(evidence) },
    { key: "business", label: "Business model clarity", level: business, caption: caption(business) },
    { key: "distribution", label: "Distribution readiness", level: reach, caption: caption(reach) },
    { key: "founder", label: "Founder advantage", level: founder, caption: caption(founder) },
  ];
  const prompts: [boolean, string][] = [
    [evidence < 2, "What have you already seen, heard, or sold?"],
    [business < 2, "Who would pay, and for what?"],
    [customer < 2, "Who feels this often enough to look for a change?"],
    [reach < 2, "How would the first customers find this?"],
    [depth(answers.problem) < 2, "Which specific situation makes this problem painful?"],
    [depth(answers.today) < 2, "What do people do today when this problem shows up?"],
    [depth(answers.inadequate) < 2, "Why is the current way not good enough?"],
    [founder < 2, "What do you know or control that others do not?"],
  ];
  const questions = prompts.flatMap(([open, prompt]) => (open ? [prompt] : [])).slice(0, 5);
  while (questions.length < 3) {
    const extra = [
      "What would you need to see before spending a year on this?",
      "What would prove the people with this problem will not pay?",
      "What has to be true in the next 90 days?",
    ][questions.length];
    if (!extra || questions.includes(extra)) break;
    questions.push(extra);
  }
  return { disclaimer: IDEA_CHECK_DISCLAIMER, categories, questions };
}

const SHARE_KEYS = ["p", "c", "e", "b", "d", "f"] as const;

export function shareQuery(categories: readonly IdeaCategory[]): string {
  const order = ["problem", "customer", "evidence", "business", "distribution", "founder"] as const;
  return order
    .map((key, index) => {
      const level = categories.find((item) => item.key === key)?.level ?? 0;
      return `${SHARE_KEYS[index]}=${level}`;
    })
    .join("&");
}

export function parseShare(params: Record<string, string | string[] | undefined>): IdeaCategory[] | null {
  const labels = [
    "Problem clarity",
    "Customer clarity",
    "Evidence maturity",
    "Business model clarity",
    "Distribution readiness",
    "Founder advantage",
  ] as const;
  const keys = ["problem", "customer", "evidence", "business", "distribution", "founder"] as const;
  const categories: IdeaCategory[] = [];
  for (let index = 0; index < SHARE_KEYS.length; index += 1) {
    const raw = params[SHARE_KEYS[index]];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value !== "0" && value !== "1" && value !== "2" && value !== "3") return null;
    const level = Number(value) as Clarity;
    const key = keys[index];
    const label = labels[index];
    if (!key || !label) return null;
    categories.push({ key, label, level, caption: caption(level) });
  }
  return categories;
}

export function shareHidesAnswers(query: string, answers: IdeaAnswers): boolean {
  const blob = decodeURIComponent(query).toLowerCase();
  return Object.values(answers).every((value) => {
    const sample = value.trim().toLowerCase();
    if (sample.length < 12) return true;
    return !blob.includes(sample.slice(0, 12));
  });
}
