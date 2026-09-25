import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NOTICE_COPY, noticeCopy } from "../src/lib/notices";

describe("founder notices", () => {
  it("uses a fixed sentence and does not copy the message body", () => {
    expect(noticeCopy("new_message")).toBe("A new message is on your idea.");
    expect(noticeCopy("document_requested")).toBeNull();
    const sql = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations/20260924160000_pesara_os_notices.sql"),
      "utf8",
    );
    for (const sentence of Object.values(NOTICE_COPY)) {
      expect(sql).toContain(sentence);
    }
    const message = sql.slice(sql.indexOf("function private.notify_new_message"), sql.indexOf("function private.notify_committee_decision"));
    expect(message).not.toContain("new.body");
  });
});
