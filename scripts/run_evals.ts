import { searchRunbooks } from "../src/utils/embeddings";
import evalDataset from "../data/eval_dataset.json";

async function runEvals() {
  console.log("--- RUNNING AGENT EVALUATION HARNESS ---\n");
  let passed = 0;

  for (const testCase of evalDataset) {
    try {
      const results = await searchRunbooks(testCase.query, 1);
      const topMatch = results[0];

      const matchPass = topMatch.id === testCase.expected_chunk_id;
      if (matchPass) passed++;

      console.log(
        `[${matchPass ? "PASS" : "FAIL"}] Query: "${testCase.query}"`,
      );
      console.log(
        `  Expected: ${testCase.expected_chunk_id} | Got: ${topMatch.id} (Score: ${topMatch.score.toFixed(3)})\n`,
      );
    } catch (err: any) {
      console.log(
        `[FAIL] Query: "${testCase.query}" - Error: ${err.message}\n`,
      );
    }
  }

  console.log(`Summary: ${passed}/${evalDataset.length} passed.`);
}

runEvals();
