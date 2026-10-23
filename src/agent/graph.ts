import {
  StateGraph,
  END,
  START,
  MemorySaver,
  interrupt,
} from "@langchain/langgraph";
import { AgentState } from "./state";
import { classifyAndRoute, retrieveChunksNode } from "./nodes";
import { executeRestartScript, toggleVpnGateway } from "../tools/actions";
import { llmService } from "../services/llm/service";

const checkpointer = new MemorySaver();

const builder = new StateGraph(AgentState)
  .addNode("classify", classifyAndRoute)
  .addNode("retrieve", retrieveChunksNode)
  .addNode("check_approval", async (state) => {
    if (state.isSensitiveAction && state.humanApprovalStatus === "pending") {
      const resumeValue = (interrupt({
        message: `Approval required for action: ${state.selectedTool}`,
        tool: state.selectedTool,
      }) || {}) as { approved?: boolean };

      const status = resumeValue.approved ? "approved" : "rejected";
      return { humanApprovalStatus: status };
    }
    return {};
  })
  .addNode("execute_action", async (state) => {
    if (state.humanApprovalStatus === "rejected") {
      return {
        finalResponse: `Action '${state.selectedTool}' was cancelled by the user.`,
      };
    }

    let actionResult;
    if (state.selectedTool === "toggle_vpn_gateway") {
      actionResult = await toggleVpnGateway();
    } else {
      actionResult = await executeRestartScript();
    }

    const chunkId = state.retrievedChunks?.[0]?.id || "runbook-101";
    return {
      finalResponse: `Action '${state.selectedTool}' approved and executed. Result: ${actionResult.message} (Reference Runbook #${chunkId})`,
    };
  })
  .addNode("stub_generation", async (state) => {
    const chunk = state.retrievedChunks[0] || {
      id: "101",
      title: "Default",
      content: "Standard runbook guidance.",
    };

    const rawPrompt = `Retrieved Runbook [${chunk.id}]: "${chunk.title}". Guidance: ${chunk.content}`;

    // Routes through our prioritized LLM adapter with backoff-and-retry
    const finalResponse = await llmService.generateWithRetry(rawPrompt);

    return { finalResponse };
  });

builder.addEdge(START, "classify");
builder.addEdge("classify", "retrieve");

builder.addConditionalEdges("retrieve", (state) => {
  return state.isSensitiveAction ? "check_approval" : "stub_generation";
});

builder.addEdge("check_approval", "execute_action");
builder.addEdge("execute_action", END);
builder.addEdge("stub_generation", END);

export const graph = builder.compile({ checkpointer });
