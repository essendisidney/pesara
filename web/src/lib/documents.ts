export const DOCUMENT_KINDS = [
  "PITCH_DECK",
  "RESEARCH",
  "FINANCIAL_MODEL",
  "PROTOTYPE",
  "LOI",
  "CONTRACT",
  "MARKET_RESEARCH",
  "COMPANY",
  "OTHER",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.document",
] as const;

export const DOCUMENT_BYTE_LIMIT = 20 * 1024 * 1024;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function documentKindLabel(kind: string | null): string {
  switch (kind) {
    case "PITCH_DECK":
      return "Pitch deck";
    case "RESEARCH":
      return "Research";
    case "FINANCIAL_MODEL":
      return "Financial model";
    case "PROTOTYPE":
      return "Prototype screenshots";
    case "LOI":
      return "LOI";
    case "CONTRACT":
      return "Contract";
    case "MARKET_RESEARCH":
      return "Market research";
    case "COMPANY":
      return "Company document";
    case "OTHER":
      return "Other";
    default:
      return "Document";
  }
}

export function isDocumentKind(value: string): value is DocumentKind {
  return (DOCUMENT_KINDS as readonly string[]).includes(value);
}

export function isDocumentMime(value: string): boolean {
  return (DOCUMENT_MIME as readonly string[]).includes(value);
}

export function safeFileName(name: string): string | null {
  const base = name.split(/[/\\]/).pop()?.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^\.+/, "") ?? "";
  if (!base || base === "-" || base.length > 80) return null;
  return base;
}

export function ventureDocumentPath(ventureId: string, fileName: string, token: string): string | null {
  return applicationDocumentPath(ventureId, fileName, token);
}

export function applicationDocumentPath(applicationId: string, fileName: string, token: string): string | null {
  if (!UUID.test(applicationId) || !UUID.test(token)) return null;
  const safe = safeFileName(fileName);
  if (!safe) return null;
  return `${applicationId.toLowerCase()}/${token.toLowerCase()}-${safe}`;
}

export function documentDisplayName(title: string | null, path: string): string {
  const named = title?.trim();
  if (named) return named;
  const base = path.split(/[/\\]/).pop() ?? "";
  return base.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-/i, "") || "Document";
}

export function attachedDocument(
  documentId: string | null,
  names: ReadonlyMap<string, string>,
): { id: string; name: string } | null {
  if (!documentId || !UUID.test(documentId)) return null;
  const name = names.get(documentId);
  if (!name) return null;
  return { id: documentId, name };
}

export function unreadFor(messages: readonly { sender: string | null; readAt: string | null }[], readerId: string): number {
  return messages.filter((message) => message.sender !== readerId && !message.readAt).length;
}
