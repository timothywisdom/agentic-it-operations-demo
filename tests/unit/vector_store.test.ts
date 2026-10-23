import { describe, it, expect } from "vitest";
import { VectorStore } from "../../src/utils/vector_store";

describe("VectorStore", () => {
  const store = new VectorStore();

  it("retrieves relevant runbooks based on query similarity", async () => {
    const results = await store.similaritySearch("database high CPU usage", 1);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("runbook-101");
    expect(results[0].score).toBeDefined();
  });

  it("throws an error when dependency failure is injected", async () => {
    process.env.INJECT_FAILURE = "UNAVAILABLE_DEPENDENCY";
    await expect(store.similaritySearch("test query")).rejects.toThrow(
      "Injected Failure: Knowledge Base Vector Store is unavailable.",
    );
    delete process.env.INJECT_FAILURE;
  });
});
