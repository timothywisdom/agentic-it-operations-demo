# Product Specification & Architecture Blueprint: AI-Powered IT Runbook & Operations Assistant

## 1. Overview & Objective

Build a focused, end-to-end AI agent workflow in TypeScript that serves as an **Internal IT Runbook & Operations Assistant**. The system ingests user requests, retrieves documentation, selects and proposes actions (read vs. write), enforces human approval before executing sensitive operations, and handles errors cleanly.

The focus is on **engineering quality, clear architecture, state management, safety boundaries, and comprehensive automated testing/evaluation** rather than external API expenditure.

---

## 2. Core Architecture & Tech Stack

### Tech Stack

- **Language/Runtime:** TypeScript / Node.js (v20+)
- **Agent Framework:** LangGraph.js & LangChain
- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Local Embeddings:** `@huggingface/transformers` running `Xenova/all-MiniLM-L6-v2` (ONNX model local in Node.js CPU context)
- **State Persistence:** LangGraph `InMemorySaver` (or local file/SQLite checkpointer)
- **Testing:** Vitest / Jest (Unit, Integration, API, Data), Playwright (E2E Browser)

### Monorepo / Directory Structure

```text
├── data/
│   ├── runbooks/             # Markdown / JSON IT runbooks (fixtures)
│   └── eval_dataset.json     # AI Evaluation dataset
├── src/
│   ├── app/                  # Next.js app, pages, and API routes
│   │   └── api/
│   │       ├── chat/         # POST /api/chat (Initial query)
│   │       └── chat/resume/  # POST /api/chat/resume (HitL approval/rejection)
│   ├── components/           # React Chat UI & Approval Cards
│   ├── agent/
│   │   ├── graph.ts          # LangGraph state graph definition
│   │   ├── state.ts          # Agent state interface definition
│   │   └── nodes.ts          # Graph nodes (classify, retrieve, action, stub_gen)
│   ├── tools/
│   │   ├── retrieval.ts      # search_knowledge_base tool
│   │   └── actions.ts        # execute_restart_script, toggle_vpn_gateway tools
│   └── utils/
│       ├── embeddings.ts     # Local transformers.js vector encoder
│       └── vector_store.ts   # In-memory vector similarity retriever
├── tests/
│   ├── unit/                 # Tool & component unit tests
│   ├── integration/          # LangGraph state transition & interrupt tests
│   ├── api/                  # API route success, auth, and error tests
│   ├── data/                 # Fixture parsing and schema validation tests
│   └── e2e/                  # Playwright browser automation tests
├── scripts/
│   └── run_evals.ts          # Executable AI evaluation harness
├── SPEC.md
└── package.json
```
