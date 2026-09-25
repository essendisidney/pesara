export function marketingChoice(value: unknown): boolean | null {
  if (value === null) return false;
  if (value === "on") return true;
  return null;
}
