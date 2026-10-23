export interface LLMAdapter {
  name: string;
  isAvailable(): boolean;
  generate(prompt: string): Promise<string>;
}

export class StubLLMAdapter implements LLMAdapter {
  name = "stub-llm";

  isAvailable(): boolean {
    return true; // Always available for local/offline execution
  }

  async generate(prompt: string): Promise<string> {
    // Injected simulated latency or failure check if needed
    if (process.env.INJECT_FAILURE === "LLM_TIMEOUT") {
      throw new Error("Simulated LLM Provider Timeout");
    }
    return prompt;
  }
}
