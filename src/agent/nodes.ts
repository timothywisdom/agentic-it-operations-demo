import { generateEmbedding, cosineSimilarity } from "../utils/embeddings";
import { searchKnowledgeBase } from "../tools/retrieval";
import { AgentState } from "./state";

const TOOLS = [
  {
    name: "search_knowledge_base",
    isSensitive: false,
    desc: "search docs look up general knowledge",
  },
  {
    name: "execute_restart_script",
    isSensitive: true,
    desc: "restart server database staging prod cluster reboot",
  },
  {
    name: "toggle_vpn_gateway",
    isSensitive: true,
    desc: "reset restart toggle vpn gateway connection ipsec",
  },
];

export async function classifyAndRoute(state: typeof AgentState.State) {
  const userMsgRaw = state.messages[state.messages.length - 1].content;
  const userMsg = userMsgRaw.toLowerCase();

  // Action intents take priority over phrasing prefixes
  if (
    userMsg.includes("vpn") ||
    userMsg.includes("gateway") ||
    userMsg.includes("tunnel")
  ) {
    if (
      userMsg.includes("reset") ||
      userMsg.includes("toggle") ||
      userMsg.includes("fix")
    ) {
      return { selectedTool: "toggle_vpn_gateway", isSensitiveAction: true };
    }
  }

  if (
    userMsg.includes("restart") ||
    userMsg.includes("reboot") ||
    userMsg.includes("reset cluster")
  ) {
    return { selectedTool: "execute_restart_script", isSensitiveAction: true };
  }

  // Pure informational queries
  if (
    userMsg.includes("what is") ||
    userMsg.includes("logs") ||
    userMsg.includes("documentation") ||
    userMsg.startsWith("how do i fix database")
  ) {
    return { selectedTool: "search_knowledge_base", isSensitiveAction: false };
  }

  // Semantic fallback
  const userVector = await generateEmbedding(userMsgRaw);
  let bestTool = TOOLS[0];
  let maxScore = -1;

  for (const tool of TOOLS) {
    const toolVector = await generateEmbedding(tool.desc);
    const score = cosineSimilarity(userVector, toolVector);
    if (score > maxScore) {
      maxScore = score;
      bestTool = tool;
    }
  }

  const selectedTool =
    maxScore > 0.45 ? bestTool.name : "search_knowledge_base";
  const isSensitive =
    TOOLS.find((t) => t.name === selectedTool)?.isSensitive || false;

  return { selectedTool, isSensitiveAction: isSensitive };
}

export async function retrieveChunksNode(state: typeof AgentState.State) {
  const userMsg = state.messages[state.messages.length - 1].content;
  try {
    const result = await searchKnowledgeBase(userMsg);
    return { retrievedChunks: result.chunks };
  } catch (err: any) {
    return {
      retrievedChunks: [],
      finalResponse: `Fallback Warning: Service dependency unavailable. ${err.message || "System error standard recovery engaged."}`,
    };
  }
}
