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
  /** How money passes through the product. Optional so older drafts still read. */
  moneyFlow?: string;
};

export type Clarity = 0 | 1 | 2 | 3;

export type IdeaCategory = {
  key: "problem" | "customer" | "evidence" | "business" | "distribution" | "founder" | "money";
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

/** Signals that money actually changes hands: payment words, currencies or amounts. */
const MONEY = /\b(pay|pays|paid|paying|payment|payments|fee|fees|charge|charges|collect|collects|collection|m-?pesa|paybill|till|commission|subscription|subscribe|deposit|deposits|premium|premiums|repay|repays|repayment|repayments|instal+ment|instal+ments|savings|save|contribution|contributions|price|priced|kes|ksh|usd|shillings?|dollars?)\b|\d/i;

const NUMBER = /\d/;

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

function cap(level: Clarity, max: Clarity): Clarity {
  return Math.min(level, max) as Clarity;
}

function caption(level: Clarity): string {
  return CAPTIONS[level];
}

function distribution(answers: IdeaAnswers): Clarity {
  const fields = [
    answers.problem,
    answers.who,
    answers.today,
    answers.inadequate,
    answers.payer,
    answers.evidence,
    answers.position,
    answers.moneyFlow ?? "",
  ];
  const hit = fields.find((value) => words(value) >= 8 && CHANNEL.test(value));
  if (!hit) return 0;
  return words(hit) >= 24 ? 2 : 1;
}

function combine(left: Clarity, right: Clarity): Clarity {
  return Math.min(3, Math.round((left + right) / 2)) as Clarity;
}

/** Length alone is not evidence: a long answer without a single number stays at Partial. */
function evidenceLevel(value: string): Clarity {
  const level = depth(value);
  return NUMBER.test(value) ? level : cap(level, 2);
}

/** A payer without a price, an amount or a payment word stays at Partial. */
function businessLevel(value: string): Clarity {
  const level = depth(value);
  return MONEY.test(value) ? level : cap(level, 2);
}

/** Money flow only counts when the answer says how money moves. */
function moneyLevel(value: string): Clarity {
  const level = depth(value);
  if (level === 0) return 0;
  return MONEY.test(value) ? level : cap(level, 1);
}

export function diagnoseIdea(answers: IdeaAnswers): IdeaDiagnostic {
  const problem = combine(depth(answers.problem), depth(answers.inadequate));
  const customer = depth(answers.who);
  const evidence = evidenceLevel(answers.evidence);
  const business = businessLevel(answers.payer);
  const founder = depth(answers.position);
  const reach = distribution(answers);
  const money = moneyLevel(answers.moneyFlow ?? "");
  const categories: IdeaCategory[] = [
    { key: "problem", label: "Problem clarity", level: problem, caption: caption(problem) },
    { key: "customer", label: "Customer clarity", level: customer, caption: caption(customer) },
    { key: "evidence", label: "Evidence maturity", level: evidence, caption: caption(evidence) },
    { key: "business", label: "Business model clarity", level: business, caption: caption(business) },
    { key: "distribution", label: "Distribution readiness", level: reach, caption: caption(reach) },
    { key: "founder", label: "Founder advantage", level: founder, caption: caption(founder) },
    { key: "money", label: "Money flow", level: money, caption: caption(money) },
  ];
  const prompts: [boolean, string][] = [
    [evidence < 2, "What have you already seen, heard, or sold?"],
    [money < 2, "Does money pass through the product, and who pays whom?"],
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
const MONEY_KEY = "m";

const SHARE_ORDER = ["problem", "customer", "evidence", "business", "distribution", "founder"] as const;

const SHARE_LABELS = [
  "Problem clarity",
  "Customer clarity",
  "Evidence maturity",
  "Business model clarity",
  "Distribution readiness",
  "Founder advantage",
] as const;

function isLevel(value: string | undefined): value is "0" | "1" | "2" | "3" {
  return value === "0" || value === "1" || value === "2" || value === "3";
}

export function shareQuery(categories: readonly IdeaCategory[]): string {
  const base = SHARE_ORDER.map((key, index) => {
    const level = categories.find((item) => item.key === key)?.level ?? 0;
    return `${SHARE_KEYS[index]}=${level}`;
  });
  const money = categories.find((item) => item.key === "money");
  if (money) base.push(`${MONEY_KEY}=${money.level}`);
  return base.join("&");
}

/** Reads a share card. The money bar is optional so cards shared before it existed still open. */
export function parseShare(params: Record<string, string | string[] | undefined>): IdeaCategory[] | null {
  const read = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const categories: IdeaCategory[] = [];
  for (let index = 0; index < SHARE_KEYS.length; index += 1) {
    const value = read(SHARE_KEYS[index]);
    if (!isLevel(value)) return null;
    const level = Number(value) as Clarity;
    categories.push({ key: SHARE_ORDER[index], label: SHARE_LABELS[index], level, caption: caption(level) });
  }
  const money = read(MONEY_KEY);
  if (money !== undefined) {
    if (!isLevel(money)) return null;
    const level = Number(money) as Clarity;
    categories.push({ key: "money", label: "Money flow", level, caption: caption(level) });
  }
  return categories;
}

export function shareHidesAnswers(query: string, answers: IdeaAnswers): boolean {
  const blob = decodeURIComponent(query).toLowerCase();
  return Object.values(answers).every((value) => {
    const sample = (value ?? "").trim().toLowerCase();
    if (sample.length < 12) return true;
    return !blob.includes(sample.slice(0, 12));
  });
}
