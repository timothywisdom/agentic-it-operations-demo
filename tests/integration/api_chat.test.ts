import { describe, it, expect } from "vitest";
import { POST as chatHandler } from "../../src/app/api/chat/route";
import { POST as resumeHandler } from "../../src/app/api/chat/resume/route";

describe("API Integration: Chat & HitL Workflow", () => {
  it("handles safe query requests and returns completed response", async () => {
    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "How do I check system logs?",
        thread_id: "api-test-safe-thread",
      }),
    });

    const res = await chatHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("completed");
    expect(data.final_response).toBeDefined();
  });

  it("pauses sensitive action requests for human approval", async () => {
    const threadId = "api-test-sensitive-thread";
    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Please restart the database cluster.",
        thread_id: threadId,
      }),
    });

    const res = await chatHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("paused_for_approval");
    expect(data.selected_tool).toBe("execute_restart_script");
    expect(data.thread_id).toBe(threadId);

    // Test the resume endpoint with approval
    const resumeReq = new Request("http://localhost:3000/api/chat/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: threadId,
        approved: true,
      }),
    });

    const resumeRes = await resumeHandler(resumeReq);
    const resumeData = await resumeRes.json();

    expect(resumeRes.status).toBe(200);
    expect(resumeData.status).toBe("completed");
    expect(resumeData.final_response.toLowerCase()).toContain(
      "successfully executed",
    );
  });
});
