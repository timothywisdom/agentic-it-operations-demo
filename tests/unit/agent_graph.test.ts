import { describe, it, expect } from "vitest";
import { graph } from "../../src/agent/graph";

describe("Agent Graph Routing Integration", () => {
  it("routes read-only queries to knowledge base search", async () => {
    const config = { configurable: { thread_id: "test-thread-safe" } };
    const initialState = {
      messages: [{ role: "user", content: "How do I check system logs?" }],
      humanApprovalStatus: "pending",
    };

    await graph.invoke(initialState, config);
    const state = await graph.getState(config);

    expect(state.values.isSensitiveAction).toBe(false);
    expect(state.values.selectedTool).toBe("search_knowledge_base");
    expect(state.values.finalResponse).toBeDefined();
  });

  it("pauses at check_approval node for sensitive action queries", async () => {
    const config = { configurable: { thread_id: "test-thread-sensitive" } };
    const initialState = {
      messages: [
        { role: "user", content: "Please restart the database cluster." },
      ],
      humanApprovalStatus: "pending",
    };

    await graph.invoke(initialState, config);
    const state = await graph.getState(config);

    expect(state.values.isSensitiveAction).toBe(true);
    expect(state.values.selectedTool).toBe("execute_restart_script");
    expect(state.next).toContain("check_approval");
  });
});
