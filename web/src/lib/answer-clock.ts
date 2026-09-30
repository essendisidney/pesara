import { FIRST_ANSWER_WORKING_DAYS } from "@/config/promises";

/** Stages where the founder is still waiting for Pesara's first written answer. */
const WAITING = new Set(["submitted", "screening"]);

export type AnswerClock =
  | { state: "none" }
  | { state: "answered" }
  | { state: "due"; dueAt: Date; workingDaysLeft: number }
  | { state: "overdue"; dueAt: Date; workingDaysLate: number };

function isWeekend(date: Date): boolean {
  // Kenya is UTC+3 with no daylight saving; read the weekday in Nairobi time.
  const day = new Date(date.getTime() + 3 * 60 * 60 * 1000).getUTCDay();
  return day === 0 || day === 6;
}

/** Adds working days (Monday to Friday). Public holidays are not excluded. */
export function addWorkingDays(start: Date, days: number): Date {
  const result = new Date(start.getTime());
  let added = 0;
  while (added < days) {
    result.setTime(result.getTime() + 24 * 60 * 60 * 1000);
    if (!isWeekend(result)) added += 1;
  }
  return result;
}

/** Whole working days from `from` to `to`; negative when `to` is earlier. */
export function workingDaysBetween(from: Date, to: Date): number {
  const sign = to >= from ? 1 : -1;
  const [a, b] = sign === 1 ? [from, to] : [to, from];
  const cursor = new Date(a.getTime());
  let count = 0;
  while (true) {
    cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
    if (cursor > b) break;
    if (!isWeekend(cursor)) count += 1;
  }
  return count * sign;
}

export function answerClock(stage: string, submittedAt: string | null, now: Date = new Date()): AnswerClock {
  if (!submittedAt || stage === "draft" || stage === "withdrawn") return { state: "none" };
  if (!WAITING.has(stage)) return { state: "answered" };
  const submitted = new Date(submittedAt);
  if (Number.isNaN(submitted.getTime())) return { state: "none" };
  const dueAt = addWorkingDays(submitted, FIRST_ANSWER_WORKING_DAYS);
  if (now <= dueAt) {
    return { state: "due", dueAt, workingDaysLeft: Math.max(0, workingDaysBetween(now, dueAt)) };
  }
  return { state: "overdue", dueAt, workingDaysLate: Math.max(1, workingDaysBetween(dueAt, now)) };
}

export function formatDue(date: Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Nairobi",
  }).format(date);
}
