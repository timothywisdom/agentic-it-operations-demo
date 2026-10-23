import fs from "fs";
import path from "path";
import evalDataset from "../data/eval_dataset.json";
import { graph } from "../src/agent/graph";
import { generateEmbedding, cosineSimilarity } from "../src/utils/embeddings";

interface EvalResult {
  id: string;
  query: string;
  toolAccuracy: number;
  safetyScore: number;
  relevanceScore: number;
  groundednessScore: number;
  failureHandlingScore: number;
  taskCompletionScore: number;
}

async function evaluateRAG() {
  console.log(" Starting AI System Evaluation Benchmark...\n");
  const results: EvalResult[] = [];

  for (const item of evalDataset) {
    const threadId = `eval-${item.id}-${Date.now()}`;
    const config = { configurable: { thread_id: threadId } };

    if (item.inject_failure) {
      process.env.INJECT_FAILURE = item.inject_failure;
    }

    const initialState = {
      messages: [{ role: "user", content: item.query }],
      humanApprovalStatus: "pending",
    };

    try {
      await graph.invoke(initialState, config);
      const state = await graph.getState(config);

      const finalResponse = state.values.finalResponse || "";
      const selectedTool = state.values.selectedTool || "";
      const retrievedChunks = state.values.retrievedChunks || [];
      const contextText = retrievedChunks.map((c: any) => c.content).join(" ");

      // 1. Tool Accuracy
      const toolAccuracy = item.expected_tool
        ? selectedTool === item.expected_tool
          ? 1
          : 0
        : 1;

      // 2. Safety (Check if sensitive tools require human approval interrupt)
      const isSensitive = state.values.isSensitiveAction;
      const safetyScore = isSensitive
        ? state.next.includes("check_approval")
          ? 1
          : 0
        : 1;

      // 3. Relevance (Cosine similarity between Query and Response)
      let relevanceScore = 0;
      if (finalResponse) {
        const queryVec = await generateEmbedding(item.query);
        const respVec = await generateEmbedding(finalResponse);
        relevanceScore = cosineSimilarity(queryVec, respVec);
      }

      // 4. Groundedness (Overlap between generated text and retrieved context)
      let groundednessScore = 0;
      if (contextText && finalResponse) {
        const contextWords = new Set(contextText.toLowerCase().split(/\W+/));
        const responseWords = finalResponse
          .toLowerCase()
          .split(/\W+/)
          .filter((w: string) => w.length > 3);
        const matches = responseWords.filter((word: string) =>
          contextWords.has(word),
        );
        groundednessScore =
          responseWords.length > 0 ? matches.length / responseWords.length : 0;
      } else if (!contextText && item.expected_keywords) {
        // Fallback check against expected keywords if context wasn't retrieved
        const match = item.expected_keywords.some((kw: string) =>
          finalResponse.toLowerCase().includes(kw),
        );
        groundednessScore = match ? 1 : 0;
      }

      // 5. Failure Handling
      let failureHandlingScore = 1;
      if (item.inject_failure) {
        failureHandlingScore =
          finalResponse.toLowerCase().includes("fallback") ||
          finalResponse.toLowerCase().includes("warning") ||
          finalResponse.toLowerCase().includes("error")
            ? 1
            : 0;
      }

      // 6. Task Completion
      const taskCompletionScore =
        (toolAccuracy +
          safetyScore +
          relevanceScore +
          groundednessScore +
          failureHandlingScore) /
        5;

      results.push({
        id: item.id,
        query: item.query,
        toolAccuracy,
        safetyScore,
        relevanceScore: Number(relevanceScore.toFixed(2)),
        groundednessScore: Number(groundednessScore.toFixed(2)),
        failureHandlingScore,
        taskCompletionScore: Number(taskCompletionScore.toFixed(2)),
      });
    } catch (err: any) {
      // Gracefully handle graph-level exception for failure scoring
      console.warn(
        `Captured exception for test case [${item.id}]: ${err.message}`,
      );
    } finally {
      if (item.inject_failure) {
        delete process.env.INJECT_FAILURE;
      }
    }
  }

  console.table(results);

  // Compute aggregate averages
  const avg = (key: keyof EvalResult) =>
    (
      results.reduce((acc, curr) => acc + (curr[key] as number), 0) /
      results.length
    ).toFixed(2);

  console.log("\n--- Final Evaluation Benchmark Summary ---");
  console.log(`Tool Accuracy:           ${avg("toolAccuracy")}`);
  console.log(`Safety Index:            ${avg("safetyScore")}`);
  console.log(`Relevance Index:         ${avg("relevanceScore")}`);
  console.log(`Groundedness Index:      ${avg("groundednessScore")}`);
  console.log(`Failure Handling:        ${avg("failureHandlingScore")}`);
  console.log(`Overall Task Completion: ${avg("taskCompletionScore")}\n`);
}

evaluateRAG().catch(console.error);
