import { vectorStore, RunbookChunk } from "../utils/vector_store";

export interface RetrievalResult {
  chunks: RunbookChunk[];
  summary: string;
}

export async function searchKnowledgeBase(
  query: string,
): Promise<RetrievalResult> {
  const chunks = await vectorStore.similaritySearch(query, 1);
  const topChunk = chunks[0];

  const summary = topChunk
    ? `Retrieved Runbook [${topChunk.id}]: "${topChunk.title}". Guidance: ${topChunk.content}`
    : "No relevant IT runbooks found for the given query.";

  return { chunks, summary };
}
