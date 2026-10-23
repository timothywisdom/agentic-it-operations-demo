import { describe, it, expect } from "vitest";
import { LLMService } from "../../src/services/llm/service";
import { LLMAdapter } from "../../src/services/llm/adapters";

class FlakyAdapter implements LLMAdapter {
  name = "flaky-adapter";
  private attempts = 0;

  isAvailable(): boolean {
    return true;
  }

  async generate(prompt: string): Promise<string> {
    this.attempts++;
    if (this.attempts < 2) {
      throw new Error("Temporary failure");
    }
    return `Success after retry: ${prompt}`;
  }
}

class ReliableAdapter implements LLMAdapter {
  name = "reliable-adapter";
  isAvailable(): boolean {
    return true;
  }
  async generate(prompt: string): Promise<string> {
    return `Reliable: ${prompt}`;
  }
}

describe("LLMService with Adapters and Backoff", () => {
  it("retries on failure and succeeds with a flaky adapter", async () => {
    const service = new LLMService([new FlakyAdapter()]);
    const result = await service.generateWithRetry("test prompt", 2, 10);
    expect(result).toContain("Success after retry: test prompt");
  });

  it("falls back to lower priority adapters if primary fails completely", async () => {
    class BrokenAdapter implements LLMAdapter {
      name = "broken";
      isAvailable() {
        return true;
      }
      async generate(_prompt: string): Promise<string> {
        throw new Error("Permanent failure");
      }
    }

    const service = new LLMService([
      new BrokenAdapter(),
      new ReliableAdapter(),
    ]);
    const result = await service.generateWithRetry("hello", 1, 10);
    expect(result).toContain("Reliable: hello");
  });
});
