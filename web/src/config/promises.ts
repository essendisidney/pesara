/**
 * Founder promises. Each one is something Pesara commits to publicly and the
 * product helps staff keep. Change a number here and every page follows.
 */

export const FIRST_ANSWER_WORKING_DAYS = 10;

export const PROMISES = [
  {
    key: "terms",
    title: "Know the deal before you apply",
    body: "Our terms are published, with a calculator. Most studios only tell you what they take after you've signed.",
  },
  {
    key: "answer",
    title: `A written answer in ${FIRST_ANSWER_WORKING_DAYS} working days`,
    body: "Every idea gets a written first answer. If it's a no, you get the reason and the next thing worth testing.",
  },
  {
    key: "yours",
    title: "Your idea stays yours",
    body: "Only the review team reads it, and you get a fingerprint of exactly what you submitted and when. We never build a submitted idea without you.",
  },
  {
    key: "invoice",
    title: "No invoice for a co-build",
    body: "We carry the cost of the build and are paid from what the business earns. If it doesn't earn, neither do we.",
  },
] as const;
