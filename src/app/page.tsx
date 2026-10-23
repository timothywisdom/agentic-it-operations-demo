"use client";

import React, { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string; chunks?: any[] }>
  >([]);
  const [input, setInput] = useState("");
  const [threadId] = useState(
    "thread-" + Math.random().toString(36).substring(7),
  );
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, thread_id: threadId }),
      });
      const data = await res.json();

      if (data.status === "paused_for_approval") {
        setPendingApproval(data);
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: `Review required before executing: ${data.selected_tool}`,
            chunks: data.retrieved_chunks,
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.final_response },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, approved }),
      });
      const data = await res.json();
      setPendingApproval(null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.final_response },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 font-sans min-h-screen flex flex-col justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-4">IT Operations Assistant</h1>
        <div className="space-y-4 mb-6">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${m.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100"}`}
            >
              <p className="font-semibold text-xs text-gray-500 mb-1">
                {m.role.toUpperCase()}
              </p>
              <p>{m.content}</p>
              {m.chunks &&
                m.chunks.map((c: any) => (
                  <div
                    key={c.id}
                    className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs text-left"
                  >
                    <span className="font-bold">Source [{c.id}]:</span>{" "}
                    {c.title}
                  </div>
                ))}
            </div>
          ))}
        </div>

        {pendingApproval && (
          <div className="p-4 border-2 border-amber-400 bg-amber-50 rounded-lg mb-4">
            <h3 className="font-bold text-amber-800 mb-2">
              Human Approval Required
            </h3>
            <p className="text-sm mb-3">
              The agent intends to execute:{" "}
              <strong>{pendingApproval.selected_tool}</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleApproval(true)}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700"
              >
                Approve Action
              </button>
              <button
                onClick={() => handleApproval(false)}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about runbooks or request an action..."
          className="flex-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
          disabled={loading || !!pendingApproval}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !!pendingApproval}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}
