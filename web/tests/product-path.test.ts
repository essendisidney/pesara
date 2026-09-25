import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function migrations(): string {
  const directory = path.join(root, "supabase", "migrations");
  return readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(path.join(directory, name), "utf8"))
    .join("\n");
}

describe("launch path", () => {
  it("invites an idea without a rank, a prize, or a success prediction", () => {
    const page = readFileSync(path.join(root, "web/src/app/whats-your-idea/page.tsx"), "utf8");
    expect(page).toContain("You don't need to know how to code.");
    expect(page).toContain("You don't need a 50-page business plan.");
    expect(page).toContain("You need to understand a problem worth solving.");
    expect(page).toContain("Pesara 100");
    expect(page.toLowerCase()).not.toContain("leaderboard");
    expect(page.toLowerCase()).not.toContain("chance");
    expect(page.toLowerCase()).not.toContain("investor");
  });
});

describe("product path", () => {
  it("keeps the public steps a stranger uses", () => {
    for (const page of [
      "web/src/app/page.tsx",
      "web/src/app/idea-check/page.tsx",
      "web/src/app/whats-your-idea/page.tsx",
      "web/src/app/register/page.tsx",
      "web/src/app/login/page.tsx",
      "web/src/app/submit/page.tsx",
      "web/src/app/dashboard/ideas/[id]/page.tsx",
    ]) {
      expect(existsSync(path.join(root, page)), page).toBe(true);
    }
  });

  it("keeps the operating steps from reference to public pipeline", () => {
    const sql = migrations();
    for (const fn of [
      "public.submit_application",
      "private.next_application_reference",
      "public.assign_application_analyst",
      "public.save_viability_assessment",
      "public.set_application_stage",
      "public.record_committee_decision",
      "public.founder_decision_view",
      "public.create_venture_from_application",
      "public.update_venture_workspace",
      "public.public_pipeline",
      "public.submit_inquiry",
      "public.request_account_action",
      "public.record_account_request",
      "public.join_waitlist",
      "public.leave_waitlist",
      "public.mark_notification_read",
      "public.set_marketing_consent",
      "public.update_founder_profile",
    ]) {
      expect(sql, fn).toContain(`function ${fn}`);
    }
    expect(sql).toContain("'PSR-'");
    expect(sql).toContain("'VALIDATION_STARTED'");
    expect(existsSync(path.join(root, "web/src/app/admin/applications/[id]/page.tsx"))).toBe(true);
    expect(existsSync(path.join(root, "web/src/app/admin/ventures/[id]/page.tsx"))).toBe(true);
  });
});
