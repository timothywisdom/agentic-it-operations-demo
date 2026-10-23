import { NextResponse } from "next/server";
import { graph } from "@/agent/graph";

export async function POST(req: Request) {
  try {
    const { message, thread_id = "default-thread" } = await req.json();

    const config = { configurable: { thread_id } };
    const initialState = {
      messages: [{ role: "user", content: message }],
      humanApprovalStatus: "pending",
    };

    await graph.invoke(initialState, config);
    const state = await graph.getState(config);

    // Check if graph is interrupted at check_approval
    if (state.next && state.next.includes("check_approval")) {
      return NextResponse.json({
        status: "paused_for_approval",
        thread_id,
        selected_tool: state.values.selectedTool,
        retrieved_chunks: state.values.retrievedChunks,
      });
    }

    return NextResponse.json({
      status: "completed",
      thread_id,
      final_response: state.values.finalResponse,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Agent Error" },
      { status: 500 },
    );
  }
}
