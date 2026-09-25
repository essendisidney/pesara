import { attachedDocument, documentDisplayName, documentKindLabel, unreadFor } from "@/lib/documents";
import { isUuid } from "@/lib/admin/pipeline";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/validation/env";

export type FounderDocument = {
  id: string;
  name: string;
  kind: string;
  at: string;
  application: string;
};

export type FounderThread = {
  id: string;
  subject: string;
  reference: string;
  unread: number;
};

export async function loadFounderDocuments(userId: string): Promise<FounderDocument[] | null> {
  if (!userId || !supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application_documents")
    .select("id, title, path, kind, created_at, application_id, idea_applications(reference, payload)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return null;
  return (data ?? []).flatMap((row) => {
    const id = typeof row.id === "string" ? row.id : "";
    if (!id) return [];
    const joined = row.idea_applications as { reference?: string | null; payload?: { ideaName?: string } } | { reference?: string | null; payload?: { ideaName?: string } }[] | null;
    const application = Array.isArray(joined) ? joined[0] : joined;
    const name = documentDisplayName(typeof row.title === "string" ? row.title : null, typeof row.path === "string" ? row.path : "");
    return [
      {
        id,
        name,
        kind: documentKindLabel(typeof row.kind === "string" ? row.kind : null),
        at: typeof row.created_at === "string" ? row.created_at : "",
        application: application?.payload?.ideaName || application?.reference || "Idea",
      },
    ];
  });
}

export async function loadFounderThreads(userId: string): Promise<FounderThread[] | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_threads")
    .select("id, subject, application_id, idea_applications(reference), messages(sender, read_at)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return null;
  return (data ?? []).flatMap((row) => {
    const id = typeof row.id === "string" ? row.id : "";
    const subject = typeof row.subject === "string" ? row.subject : "";
    if (!id || !subject) return [];
    const joined = row.idea_applications as { reference?: string | null } | { reference?: string | null }[] | null;
    const application = Array.isArray(joined) ? joined[0] : joined;
    const messages = Array.isArray(row.messages) ? row.messages : [];
    return [
      {
        id,
        subject,
        reference: application?.reference || "Draft",
        unread: unreadFor(
          messages.map((message) => ({
            sender: typeof message.sender === "string" ? message.sender : null,
            readAt: typeof message.read_at === "string" ? message.read_at : null,
          })),
          userId,
        ),
      },
    ];
  });
}

export async function markApplicationThreadsRead(applicationId: string): Promise<void> {
  if (!isUuid(applicationId) || !supabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase.from("message_threads").select("id").eq("application_id", applicationId);
  for (const row of data ?? []) {
    if (typeof row.id === "string") await supabase.rpc("mark_thread_read", { p_thread: row.id });
  }
}

export async function loadThread(id: string, readerId: string): Promise<{
  id: string;
  subject: string;
  reference: string;
  documents: { id: string; name: string }[];
  messages: { id: string; body: string; at: string; mine: boolean; read: boolean; attachment: { id: string; name: string } | null }[];
} | null> {
  if (!isUuid(id) || !supabaseConfigured()) return null;
  const supabase = await createClient();
  await supabase.rpc("mark_thread_read", { p_thread: id });
  const { data, error } = await supabase
    .from("message_threads")
    .select("id, subject, application_id, idea_applications(reference), messages(id, body, sender, created_at, read_at, document_id)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data || typeof data.id !== "string" || typeof data.subject !== "string") return null;
  const applicationId = typeof data.application_id === "string" ? data.application_id : "";
  const documents = applicationId
    ? await supabase.from("application_documents").select("id, title, path").eq("application_id", applicationId).order("created_at", { ascending: false }).limit(50)
    : { data: [], error: null };
  if (documents.error) return null;
  const names = new Map<string, string>();
  const choices = (documents.data ?? []).flatMap((row) => {
    const documentId = typeof row.id === "string" ? row.id : "";
    const path = typeof row.path === "string" ? row.path : "";
    if (!documentId || !path) return [];
    const name = documentDisplayName(typeof row.title === "string" ? row.title : null, path);
    names.set(documentId, name);
    return [{ id: documentId, name }];
  });
  const joined = data.idea_applications as { reference?: string | null } | { reference?: string | null }[] | null;
  const application = Array.isArray(joined) ? joined[0] : joined;
  const messages = Array.isArray(data.messages) ? data.messages : [];
  return {
    id: data.id,
    subject: data.subject,
    reference: application?.reference || "Draft",
    documents: choices,
    messages: messages
      .flatMap((message) => {
      const messageId = typeof message.id === "string" ? message.id : "";
      const body = typeof message.body === "string" ? message.body : "";
      if (!messageId || !body) return [];
      const documentId = typeof message.document_id === "string" ? message.document_id : null;
      return [
        {
          id: messageId,
          body,
          at: typeof message.created_at === "string" ? message.created_at : "",
          mine: message.sender === readerId,
          read: typeof message.read_at === "string",
          attachment: attachedDocument(documentId, names),
        },
      ];
    })
      .sort((a, b) => a.at.localeCompare(b.at)),
  };
}
