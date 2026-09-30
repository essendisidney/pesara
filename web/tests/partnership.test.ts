import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EXAMPLE, SHARES, TERMS, illustrate, kes, splitPayment } from "../src/config/partnership";
import { nav } from "../src/config/site";
import { emptyDraft } from "../src/lib/application";
import { diagnoseIdea, parseShare, shareQuery } from "../src/lib/idea-check";
import { freshPrefill } from "../src/lib/idea-check-draft";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("co-build partnership", () => {
  it("publishes three shares with sane ranges and a founder majority", () => {
    expect(SHARES.map((share) => share.key)).toEqual(["equity", "revenue", "platform"]);
    expect(TERMS.equity.max).toBeLessThan(50);
    expect(TERMS.revenueShareTail.max).toBeLessThanOrEqual(TERMS.revenueShare.min);
    expect(TERMS.platformFee.max).toBeLessThan(TERMS.revenueShare.min);
  });

  it("works the example out from the terms, not by hand", () => {
    const x = illustrate();
    expect(x.share).toBe(160_000);
    expect(x.platform).toBe(20_000);
    expect(x.tail).toBe(40_000);
    expect(x.cap).toBe(7_500_000);
    expect(x.monthsToCap).toBe(47);
    expect(x.ventureKeepsEarly).toBe(1_820_000);
    expect(x.ventureKeepsLater).toBe(1_940_000);
    expect(Math.round(x.keepsEarlyPercent)).toBe(91);
    expect(EXAMPLE.equity).toBeGreaterThanOrEqual(TERMS.equity.min);
    expect(EXAMPLE.equity).toBeLessThanOrEqual(TERMS.equity.max);
    expect(kes(2_000_000)).toMatch(/^KES 2.000.000$/);
  });

  it("splits one payment so the parts add back to the whole", () => {
    const lines = splitPayment(2_000);
    expect(lines.map((line) => line.amount)).toEqual([1_820, 160, 20]);
    expect(lines.reduce((sum, line) => sum + line.amount, 0)).toBe(2_000);
    expect(lines.reduce((sum, line) => sum + line.percent, 0)).toBe(100);
    const home = readFileSync(path.join(root, "web/src/app/page.tsx"), "utf8");
    expect(home).toContain("<SettlementVisual />");
  });

  it("links the partnership page and keeps the honest Rails note", () => {
    expect(nav.some((item) => item.href === "/partnership")).toBe(true);
    const page = readFileSync(path.join(root, "web/src/app/partnership/page.tsx"), "utf8");
    expect(page).toContain("Illustrative only");
    expect(page).toContain("Pesara Rails is in development");
    const home = readFileSync(path.join(root, "web/src/app/page.tsx"), "utf8");
    expect(home).toContain("We get paid when you get paid.");
    expect(home).toContain("<KeepCalculator />");
    expect(home).toContain("PROMISES.map");
    expect(existsSync(path.join(root, "supabase/migrations/20260930110000_pesara_os_rails_fit.sql"))).toBe(true);
  });
});

describe("money flow screening", () => {
  const base = {
    problem: "Chama treasurers lose track of contributions and members stop trusting the books.",
    who: "Treasurers of women's savings groups in Kisumu",
    today: "Paper books and WhatsApp screenshots",
    inadequate: "Nobody can check a balance without asking the treasurer",
    payer: "The group pays KES 200 a month from its fund",
    evidence: "I run two groups with 28 members and six other treasurers asked to use my sheet",
    position: "I have been a treasurer for five years",
  };

  it("reads money flow only when the answer says how money moves", () => {
    const vague = diagnoseIdea({ ...base, moneyFlow: "It will be a very useful and popular app for many people in town" });
    expect(vague.categories.find((item) => item.key === "money")?.level).toBe(1);
    const clear = diagnoseIdea({
      ...base,
      moneyFlow: "Each member sends a weekly contribution by M-Pesa paybill into the group account and the treasurer pays out the rotation every month",
    });
    expect(clear.categories.find((item) => item.key === "money")?.level).toBeGreaterThanOrEqual(2);
    const missing = diagnoseIdea(base);
    expect(missing.categories.find((item) => item.key === "money")?.level).toBe(0);
    expect(missing.questions).toContain("Does money pass through the product, and who pays whom?");
  });

  it("does not reward a long evidence answer with no numbers", () => {
    const reading = diagnoseIdea({
      ...base,
      evidence:
        "I have talked with a lot of people in many different places and they all told me that they really like the idea and would definitely use it when it is ready for them",
    });
    expect(reading.categories.find((item) => item.key === "evidence")?.level).toBe(2);
  });

  it("shares the money bar and still opens older cards", () => {
    const reading = diagnoseIdea({ ...base, moneyFlow: "Members pay KES 500 weekly by M-Pesa" });
    const query = shareQuery(reading.categories);
    expect(query).toContain("m=");
    const params = Object.fromEntries(new URLSearchParams(query));
    expect(parseShare(params)).toHaveLength(7);
    expect(parseShare({ p: "1", c: "1", e: "1", b: "1", d: "1", f: "1" })).toHaveLength(6);
    expect(parseShare({ p: "1", c: "1", e: "1", b: "1", d: "1", f: "1", m: "7" })).toBeNull();
  });

  it("carries money flow into the application", () => {
    expect(emptyDraft().moneyFlow).toBe("");
    const draft = freshPrefill({ ...base, moneyFlow: "Members pay weekly by M-Pesa" });
    expect(draft.moneyFlow).toBe("Members pay weekly by M-Pesa");
  });
});
