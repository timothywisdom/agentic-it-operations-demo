import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "../../src/utils/embeddings";

describe("Embeddings & Similarity Utils", () => {
  it("calculates correct cosine similarity for identical vectors", () => {
    const v = [1, 0, 0];
    const score = cosineSimilarity(v, v);
    expect(score).toBeCloseTo(1.0);
  });

  it("calculates orthogonal vector similarity as zero", () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    const score = cosineSimilarity(a, b);
    expect(score).toBeCloseTo(0.0);
  });
});
