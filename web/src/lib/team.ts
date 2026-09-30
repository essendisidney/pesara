export function teamMember(name: unknown, role: unknown): { name: string; role: string } | null {
  if (typeof name !== "string") return null;
  const cleanName = name.trim();
  const cleanRole = typeof role === "string" ? role.trim() : "";
  if (!cleanName || cleanName.length > 120 || cleanRole.length > 80) return null;
  return { name: cleanName, role: cleanRole };
}
