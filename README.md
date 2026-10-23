# AI Operations Assistant

A focused, end-to-end AI-powered IT runbook assistant built with TypeScript, Next.js, and LangGraph.js, emphasizing system reliability, Human-in-the-Loop (HitL) safety, and production-grade observability.

---

## Architecture & System Workflow

The system is engineered around a deterministic state machine using **LangGraph.js**, separating stochastic AI interactions from application logic:

1. **Intent Classification & Routing:**
   - User inputs are analyzed to determine whether the request is a read-only informational query (requiring knowledge base lookup) or a sensitive system action (requiring operational script execution).
2. **RAG & Knowledge Retrieval:**
   - Queries are embedded locally and matched against local IT runbooks (`data/runbooks.json`) using cosine similarity to supply exact technical context to the response generator.
3. **Human-in-the-Loop (HitL) Safety:**
   - Sensitive write/action tools (`execute_restart_script`, `toggle_vpn_gateway`) trigger state interrupts via LangGraph's `MemorySaver`, pausing execution until explicit operator approval is granted.
4. **Resilient LLM Adapters:**
   - Uses an Adapter Pattern with prioritized failover to handle provider timeouts, rate limits, or unexpected model outages seamlessly.

---

## Technical Stack

- **Framework:** Next.js 14 (App Router & API Routes)
- **Agent Orchestration:** LangGraph.js (`MemorySaver` checkpointer)
- **Local AI & Embeddings:** `@huggingface/transformers` running `Xenova/all-MiniLM-L6-v2` locally in Node.js for zero-cost vector search.
- **Testing & E2E:** Vitest (unit/integration) and Playwright (browser verification).

---

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. **Execute testing suites:**
   ```bash
   npm test          # Run unit, integration, and data validation tests
   npm run test:e2e  # Run Playwright browser verification
   npm run eval      # Run offline AI quality benchmark harness
   ```

## Quality Assurance & CI/CD Strategy

To ensure system reliability, safety, and AI output quality, our verification pipeline is divided into three distinct cycles:

**1. Pull Request (PR) Checks**
**Scope**: Fast, 100% deterministic unit, integration, and data validation tests.

**Commands**: npm test (Vitest suite)

**Purpose**: Blocks code-level regressions, validates vector store schemas, verifies API route handlers, and ensures routing mechanics work correctly before merging code.

**2. Deployment Gates**
**Scope**: End-to-end (E2E) browser verification and production build checks.

**Tools**: Playwright (npm run test:e2e), Next.js production build (npm run build).

**Purpose**: Runs prior to releasing to staging or production to confirm that the full UI client, chat flows, human-in-the-loop (HitL) approval interrupts, and backend integrations operate seamlessly in a live environment.

**3. Scheduled Regression Cycles**
**Scope**: Stochastic AI prompt evaluations, groundedness checks, and failure recovery benchmarks.

**Command**: npm run eval (scripts/run_evals.ts)

**Purpose**: Run periodically (e.g., nightly or when tweaking prompt templates and embedding thresholds) to measure model-level performance across Tool Accuracy, Relevance, Groundedness, Safety, and Failure Handling without blocking immediate PR velocity.
