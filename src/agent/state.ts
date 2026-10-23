import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  selectedTool: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
  isSensitiveAction: Annotation<boolean>({
    reducer: (_, y) => y,
    default: () => false,
  }),
  retrievedChunks: Annotation<Array<any>>({
    reducer: (_, y) => y,
    default: () => [],
  }),
  pendingActionPayload: Annotation<any>({
    reducer: (_, y) => y,
    default: () => null,
  }),
  humanApprovalStatus: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
  finalResponse: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
});
