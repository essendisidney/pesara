import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

type Policy = { name: string; table: string; body: string };

function migrationSql(): string {
  const directory = path.join(root, "supabase", "migrations");
  return readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(path.join(directory, name), "utf8"))
    .join("\n");
}

function policiesIn(sql: string): Map<string, Policy> {
  const events: { index: number; kind: "drop" | "create"; name: string; table: string; body: string }[] = [];
  for (const match of sql.matchAll(/drop policy if exists ([a-z0-9_]+) on ((?:public|storage)\.[a-z0-9_]+)/gi)) {
    events.push({ index: match.index ?? 0, kind: "drop", name: match[1], table: match[2], body: "" });
  }
  for (const match of sql.matchAll(/create policy ([a-z0-9_]+) on ((?:public|storage)\.[a-z0-9_]+)\s+([\s\S]*?);/gi)) {
    events.push({
      index: match.index ?? 0,
      kind: "create",
      name: match[1],
      table: match[2],
      body: match[3].replace(/\s+/g, " ").trim(),
    });
  }
  events.sort((left, right) => left.index - right.index);
  const policies = new Map<string, Policy>();
  for (const event of events) {
    const id = `${event.table}.${event.name}`;
    if (event.kind === "drop") policies.delete(id);
    else policies.set(id, { name: event.name, table: event.table, body: event.body });
  }
  return policies;
}

function lastFunction(sql: string, name: string): string {
  const bodies = [...sql.matchAll(new RegExp(`create or replace function ${name}\\([\\s\\S]*?\\$\\$([\\s\\S]*?)\\$\\$`, "gi"))];
  return bodies.at(-1)?.[1] ?? "";
}

function policy(policies: Map<string, Policy>, id: string): Policy {
  const found = policies.get(id);
  expect(found, id).toBeDefined();
  return found as Policy;
}

function expectStaffRead(policies: Map<string, Policy>, id: string) {
  const found = policy(policies, id);
  expect(found.body.toLowerCase().startsWith("for select")).toBe(true);
  expect(found.body).toContain("private.is_staff()");
  expect(found.body.toLowerCase()).not.toContain("for all");
}

const sql = migrationSql();
const policies = policiesIn(sql);

describe("founder isolation", () => {
  it("keeps a founder's application, history, ideas, and profile on their own user", () => {
    expect(policies.has("public.idea_applications.applications_owner")).toBe(false);
    for (const id of [
      "public.idea_applications.applications_owner_select",
      "public.idea_applications.applications_owner_insert",
      "public.idea_applications.applications_owner_update_draft",
      "public.ideas.ideas_owner",
      "public.application_status_history.history_owner",
      "public.profiles.profiles_self",
    ]) {
      const found = policy(policies, id);
      expect(found.body).toContain("auth.uid()");
      expect(found.body.toLowerCase()).not.toContain("using (true)");
    }
    expect(policy(policies, "public.idea_applications.applications_owner_update_draft").body).toContain("stage = 'draft'");
    expectStaffRead(policies, "public.idea_applications.applications_staff");
    expectStaffRead(policies, "public.profiles.profiles_staff");
  });

  it("does not let a founder read another founder's documents, messages, or files", () => {
    const documents = policy(policies, "public.application_documents.documents_owner");
    expect(documents.body.toLowerCase().startsWith("for select")).toBe(true);
    expect(documents.body).toContain("app.user_id = auth.uid()");
    expect(policies.has("public.application_documents.documents_insert_owner")).toBe(false);
    expectStaffRead(policies, "public.application_documents.documents_staff");

    expect(policies.has("public.messages.messages_insert")).toBe(false);
    const messages = policy(policies, "public.messages.messages_participants");
    expect(messages.body.toLowerCase().startsWith("for select")).toBe(true);
    expect(messages.body).toContain("a.user_id = auth.uid()");

    const threads = policy(policies, "public.message_threads.threads_read");
    expect(threads.body).toContain("app.user_id = auth.uid()");
    expect(threads.body).toContain("private.is_staff()");

    for (const id of ["storage.objects.application_documents_read", "storage.objects.application_documents_insert"]) {
      const storage = policy(policies, id);
      expect(storage.body).toContain("storage.foldername(name)");
      expect(storage.body).toContain("app.user_id = auth.uid()");
      expect(storage.body).toContain("private.is_staff()");
    }
    for (const id of ["storage.objects.venture_documents_read", "storage.objects.venture_documents_insert"]) {
      const storage = policy(policies, id);
      expect(storage.body).toContain("bucket_id = 'venture-documents'");
      expect(storage.body).toContain("private.is_staff()");
      expect(storage.body).toContain("storage.foldername(name)");
    }
  });

  it("keeps assessments, experiments, and committee decisions on staff", () => {
    for (const id of [
      "public.viability_assessments.assessments_staff",
      "public.assessment_scores.scores_staff",
      "public.committee_decisions.decisions_staff",
      "public.committee_decision_members.decision_members_staff",
      "public.validation_experiments.experiments_staff",
      "public.validation_results.results_staff",
      "public.viability_dimensions.dimensions_read",
    ]) {
      expectStaffRead(policies, id);
    }
    expect(policies.has("public.viability_dimensions.dimensions_staff")).toBe(false);
    const completed = lastFunction(sql, "private.log_experiment_completed");
    expect(completed).toContain("old.outcome is null");
    expect(completed).toContain("'experiment_id'");
    expect(completed).not.toContain("conclusion");
    expect(completed).not.toContain("email");
    const close = lastFunction(sql, "public.complete_validation_experiment");
    expect(close).toContain("outcome is null");
    expect(close).not.toContain("activity_logs");
    expect(close).not.toContain("email");
    const decision = lastFunction(sql, "public.founder_decision_view");
    expect(decision).toContain("a.user_id = auth.uid()");
    expect(decision).not.toContain("committee_notes");
    expect(decision).not.toContain("commercial_notes");
    expect(decision).not.toContain("technology_notes");
  });

  it("keeps venture workspaces and commercial terms off the public read path", () => {
    expect(policies.has("public.ventures.ventures_public")).toBe(false);
    expectStaffRead(policies, "public.ventures.ventures_staff");
    expectStaffRead(policies, "public.venture_metrics.venture_metrics_staff");
    expectStaffRead(policies, "public.venture_documents.venture_docs_staff");
    expectStaffRead(policies, "public.admin_notes.notes_staff");
    const founders = policy(policies, "public.venture_founders.venture_founders_self");
    expect(founders.body.toLowerCase().startsWith("for select")).toBe(true);
    expect(founders.body).toContain("user_id = auth.uid()");

    // The public portfolio is read through a function with a fixed column list,
    // not a SECURITY DEFINER view (Supabase lint 0010).
    expect(sql).toMatch(/drop view if exists public\.portfolio_ventures/i);
    const portfolio = lastFunction(sql, "public.published_portfolio");
    expect(portfolio).toContain("v.public_visible = true");
    expect(portfolio).toContain("v.is_demo = false");
    for (const column of [
      "commercial_kind",
      "commercial_terms",
      "revenue_share",
      "equity_interest",
      "technology_notes",
      "agreement_document",
      "pesara_contribution",
      "founder_contribution",
      "application_id",
    ]) {
      expect(portfolio).not.toContain(column);
    }
  });

  it("reads staff from user_roles and leaves the activity log append-only", () => {
    const staff = lastFunction(sql, "private.is_staff");
    expect(staff).toContain("user_roles");
    expect(staff).not.toContain("user_metadata");
    expect(staff).not.toContain("raw_user_meta_data");
    expect(policies.has("public.user_roles.roles_self")).toBe(true);
    expect(policy(policies, "public.user_roles.roles_self").body.toLowerCase().startsWith("for select")).toBe(true);
    expect([...policies.keys()].some((id) => id.startsWith("public.user_roles.") && policies.get(id)?.body.toLowerCase().includes("for insert"))).toBe(false);

    expect(policies.has("public.activity_logs.logs_insert_staff")).toBe(false);
    expect(policy(policies, "public.activity_logs.logs_staff").body.toLowerCase().startsWith("for select")).toBe(true);
    expect(sql.toLowerCase()).toContain("before update or delete on public.activity_logs");
    expect(sql).toContain("revoke insert, update, delete on public.activity_logs from anon, authenticated");
    expect(policies.has("public.referral_events.referral_events_owner")).toBe(false);
    expectStaffRead(policies, "public.referral_events.referral_events_staff");
    expectStaffRead(policies, "public.founder_meetings.founder_meetings_staff");
    expectStaffRead(policies, "public.articles.articles_staff");
    expect(policy(policies, "public.data_requests.data_requests_owner").body.toLowerCase().startsWith("for select")).toBe(true);
    expectStaffRead(policies, "public.data_requests.data_requests_staff");
    expect(policies.has("public.data_requests.data_requests_self")).toBe(false);
    expect(policy(policies, "public.notifications.notifications_owner").body.toLowerCase().startsWith("for select")).toBe(true);
    expect(policies.has("public.notifications.notifications_self")).toBe(false);
    expect(policy(policies, "public.consent_events.consent_events_owner").body.toLowerCase().startsWith("for select")).toBe(true);
    expectStaffRead(policies, "public.consent_events.consent_events_staff");
    expect(policies.has("public.consent_events.consent_self")).toBe(false);
    expect(policy(policies, "public.application_team_members.team_owner").body.toLowerCase().startsWith("for select")).toBe(true);
    expectStaffRead(policies, "public.application_team_members.team_staff");
    expect(policy(policies, "public.document_requests.document_requests_owner").body).toContain("user_id = auth.uid()");
    expectStaffRead(policies, "public.document_requests.document_requests_staff");
    const request = lastFunction(sql, "public.request_application_document");
    expect(request).toContain("Pesara asked for a document.");
    expect(request.slice(request.indexOf("DOCUMENT_REQUESTED"))).not.toContain("p_note");
    expect(request).not.toContain("email");
    expect(policies.has("public.inquiries.inquiries_insert")).toBe(false);
    expectStaffRead(policies, "public.inquiries.inquiries_staff");
  });
});

describe("quality gate source", () => {
  it("does not hide type or lint failures in the application source", () => {
    const files: string[] = [];
    const walk = (directory: string) => {
      for (const entry of readdirSync(directory)) {
        const full = path.join(directory, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) files.push(full);
      }
    };
    walk(path.join(root, "web", "src"));
    expect(files.length).toBeGreaterThan(20);
    const hits: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        if (/\bas any\b/.test(line) || line.includes("@ts-ignore") || line.includes("@ts-expect-error") || line.includes("eslint-disable")) {
          hits.push(`${path.relative(root, file)}:${index + 1}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });
});
