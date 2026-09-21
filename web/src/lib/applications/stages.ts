export const FOUNDER_TRACK = [
  { key: "submitted", label: "Submitted" },
  { key: "screening", label: "Initial screening" },
  { key: "interview", label: "Founder interview" },
  { key: "validation", label: "Validation" },
  { key: "committee", label: "Committee review" },
  { key: "structuring", label: "Venture structuring" },
  { key: "building", label: "Build" },
  { key: "live", label: "Launch" },
] as const;

export type FounderTrackKey = (typeof FOUNDER_TRACK)[number]["key"];

export function trackIndex(stage: string): number {
  if (stage === "draft") return -1;
  if (stage === "withdrawn" || stage === "parked" || stage === "declined") return -1;
  const index = FOUNDER_TRACK.findIndex((item) => item.key === stage);
  return index;
}

export function nextFounderAction(stage: string): string {
  switch (stage) {
    case "draft":
      return "Continue your application";
    case "submitted":
    case "screening":
      return "Pesara is performing an initial opportunity screen";
    case "interview":
      return "Prepare for a founder conversation";
    case "validation":
      return "Help gather evidence if Pesara asks";
    case "committee":
      return "Wait for a written Pesara decision";
    case "structuring":
      return "Review the proposed partnership structure";
    case "building":
      return "Work with Pesara on the product";
    case "live":
      return "Measure the live product";
    case "withdrawn":
      return "This application was withdrawn";
    case "declined":
      return "Read Pesara's written outcome";
    case "parked":
      return "This idea is parked for now";
    default:
      return "Open the application";
  }
}
