import { generateEmbedding, cosineSimilarity } from "./embeddings";
import runbooks from "../../data/runbooks.json";

export interface RunbookChunk {
  id: string;
  title: string;
  content: string;
  category: string;
  score?: number;
}

export class VectorStore {
  private documents: RunbookChunk[] = runbooks as RunbookChunk[];

  async similaritySearch(query: string, k = 1): Promise<RunbookChunk[]> {
    if (process.env.INJECT_FAILURE === "UNAVAILABLE_DEPENDENCY") {
      throw new Error(
        "Injected Failure: Knowledge Base Vector Store is unavailable.",
      );
    }

    const queryEmbedding = await generateEmbedding(query);

    const scored = await Promise.all(
      this.documents.map(async (doc) => {
        // Encoded into vectors on the fly for every search request. In a production app, these should be pre-computed and stored in a database.
        const docEmbedding = await generateEmbedding(
          `${doc.title} ${doc.content}`,
        );
        const score = cosineSimilarity(queryEmbedding, docEmbedding);
        return { ...doc, score };
      }),
    );

    return scored.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, k);
  }
}

export const vectorStore = new VectorStore();
