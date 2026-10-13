import { describe, expect, it } from "vitest";
import { describeError, opsRow } from "../src/lib/ops";

describe("ops issue rows", () => {
  it("keeps valid fields and bounds long ones", () => {
    const row = opsRow("rails.intake", "x".repeat(900), "warn", { ventureId: "v1", note: "y".repeat(400) });
    expect(row.source).toBe("rails.intake");
    expect(row.level).toBe("warn");
    expect(row.message).toHaveLength(500);
    expect(String(row.context.note)).toHaveLength(300);
  });

  it("replaces an invalid source and an empty message", () => {
    const row = opsRow("Bad Source!", "   ", "error");
    expect(row.source).toBe("unknown");
    expect(row.message).toBe("no message");
  });

  it("describes errors of any shape", () => {
    expect(describeError(new Error("boom"))).toBe("boom");
    expect(describeError("plain")).toBe("plain");
    expect(describeError(42)).toBe("unknown error");
  });
});
