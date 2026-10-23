# AI Operations Assistant

A focused, end-to-end AI-powered IT runbook assistant built with TypeScript, Next.js, and LangGraph.js.

## Architecture & Design Decisions

- **Local Embeddings:** Uses `@huggingface/transformers` running `Xenova/all-MiniLM-L6-v2` locally in Node.js for zero-cost semantic search and intent classification.
- **Human-in-the-Loop (HitL):** Leverages LangGraph persistence and state interrupts to gate sensitive write/action tools (`execute_restart_script`, `toggle_vpn_gateway`) behind explicit operator approval.
- **Test & Evaluation Strategy:** Includes unit tests (Vitest), API/integration tests, and an offline AI evaluation harness (`npm run eval`).

## Setup & Running

1. Install dependencies:
   ```bash
   npm install
   ```
