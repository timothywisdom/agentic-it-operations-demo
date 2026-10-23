import { LLMAdapter, StubLLMAdapter } from "./adapters";

export class LLMService {
  private adapters: LLMAdapter[];

  constructor(adapters: LLMAdapter[] = [new StubLLMAdapter()]) {
    this.adapters = adapters; // Ordered by priority (highest first)
  }

  async generateWithRetry(
    prompt: string,
    maxRetries = 2,
    initialDelayMs = 50,
  ): Promise<string> {
    let lastError: Error = new Error("No LLM adapters configured.");

    for (const adapter of this.adapters) {
      if (!adapter.isAvailable()) continue;

      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          return await adapter.generate(prompt);
        } catch (err: any) {
          lastError = err;
          attempt++;
          if (attempt <= maxRetries) {
            const delay = initialDelayMs * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    // Fallback response if all prioritized adapters and retries fail
    return `[LLM Fallback Warning: All prioritized adapters failed. Last error: ${lastError.message}] ${prompt}`;
  }
}

export const llmService = new LLMService();
