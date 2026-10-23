import { NextResponse } from "next/server";
import { graph } from "@/agent/graph";
import { Command } from "@langchain/langgraph";

export async function POST(req: Request) {
  try {
    const { thread_id, approved } = await req.json();
    const config = { configurable: { thread_id } };

    await graph.invoke(
      new Command({
        resume: { approved },
      }),
      config,
    );

    const state = await graph.getState(config);
    const responseText =
      state.values.finalResponse ||
      (approved
        ? "Action was approved and successfully executed."
        : "Action was cancelled by the user.");

    return NextResponse.json({
      status: "completed",
      thread_id,
      final_response: responseText,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to resume agent graph" },
      { status: 500 },
    );
  }
}
