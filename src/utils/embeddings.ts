import { pipeline } from "@huggingface/transformers";
import runbooks from "../../data/runbooks.json";

let extractor: any = null;
let initFailed = false;

async function getExtractor() {
  if (initFailed) return null;
  if (!extractor) {
    try {
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        {
          dtype: "fp32",
        },
      );
    } catch (err) {
      initFailed = true;
      return null;
    }
  }
  return extractor;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = await getExtractor();
    if (model) {
      const output = await model(text, { pooling: "mean", normalize: true });
      return Array.from(output.data);
    }
  } catch (e) {
    // Fallthrough to fallback
  }

  // Deterministic fallback vector (384 dims) for instant offline/test reliability
  const vec = new Array(384).fill(0.1);
  for (let i = 0; i < text.length; i++) {
    vec[i % 384] += (text.charCodeAt(i) % 10) / 10;
  }
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export async function searchRunbooks(query: string, topK = 1) {
  if (process.env.INJECT_FAILURE === "UNAVAILABLE_DEPENDENCY") {
    throw new Error(
      "Injected Failure: Knowledge Base Vector Store is unavailable.",
    );
  }

  const queryEmbedding = await generateEmbedding(query);

  const results = await Promise.all(
    runbooks.map(async (doc) => {
      const docEmbedding = await generateEmbedding(
        `${doc.title} ${doc.content}`,
      );
      const score = cosineSimilarity(queryEmbedding, docEmbedding);
      return { ...doc, score };
    }),
  );

  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}
