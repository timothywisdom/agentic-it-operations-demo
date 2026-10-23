import { describe, it, expect } from "vitest";
import runbooks from "../../data/runbooks.json";

describe("Data Fixture Integrity: runbooks.json", () => {
  it("contains valid runbook entries with required schema fields", () => {
    expect(Array.isArray(runbooks)).toBe(true);
    expect(runbooks.length).toBeGreaterThan(0);

    for (const runbook of runbooks) {
      expect(runbook).toHaveProperty("id");
      expect(typeof runbook.id).toBe("string");
      expect(runbook.id.trim()).not.toBe("");

      expect(runbook).toHaveProperty("title");
      expect(typeof runbook.title).toBe("string");
      expect(runbook.title.trim()).not.toBe("");

      expect(runbook).toHaveProperty("content");
      expect(typeof runbook.content).toBe("string");
      expect(runbook.content.trim()).not.toBe("");

      expect(runbook).toHaveProperty("category");
      expect(typeof runbook.category).toBe("string");
      expect(runbook.category.trim()).not.toBe("");
    }
  });

  it("ensures all runbook IDs are unique", () => {
    const ids = runbooks.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
