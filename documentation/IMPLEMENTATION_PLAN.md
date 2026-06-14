# search-goat — Implementation Plan

This document tracks the progress of the search-goat implementation, divided into 4 parallel-testable phases. Each phase includes a checklist of tasks and a section for observations or necessary reworks based on testing.

---

## Phase 1: Foundation & Orchestration
**Goal:** Establish the core FSM (Finite State Machine), persistence layer, and real-time backend-frontend synchronization.

### Checklist
- [x] **B1.1: Backend Initialization**
  - [x] Initialize Node.js/TypeScript project in `/backend`.
  - [x] Setup Express server with basic error handling and logging.
  - [x] Define core folder structure (orchestrator, agents, llm, browser, registry, api).
- [x] **B1.2: Run Store (Persistence)**
  - [x] Implement `runStore.ts` for file-based JSON storage in `/runs/{runId}/...`.
  - [x] Create APIs for creating, reading, and updating run artifacts.
- [x] **B1.3: Orchestrator (Pipeline FSM)**
  - [x] Implement `pipeline.ts` with states: `planning -> researching -> fact_checking -> debating -> synthesizing -> final_fact_check -> finalizing -> done`.
  - [x] Implement state transition logic and event emission.
- [x] **B1.4: Real-time Communication (SSE/WS)**
  - [x] Implement SSE or WebSocket endpoint in `/api/ws.ts` for streaming run events to the frontend.
- [x] **F1.1: Frontend Core Layout**
  - [x] Setup neo-brutalist theme, CSS variables, and Tailwind configuration.
  - [x] Build the main layout grid: `PipelineRail` (left), `MainContent` (center), and `InspectorPanel` (right).
- [x] **F1.2: Live State Hook**
  - [x] Implement `useRunEvents.ts` to sync frontend state with backend events in real-time.

### Phase 1 Observations & Rework
*(To be filled after each task or phase testing)*
- **Observation:** Phase 1 complete. Core FSM, Run Store, and SSE streaming are functional in the backend. Frontend has its neo-brutalist shell and real-time state synchronization via `useRunEvents`. The system can now "walk" through the research stages and reflect them in the UI.
- **Rework Needed:** [None]

---

## Phase 2: Planning & Research
**Goal:** Enable the system to decompose queries into strategies and browse the web for evidence.

### Checklist
- [x] **B2.1: LLM Client & Prompt Registry**
  - [x] Implement `llm/client.ts` with Zod schema validation and auto-repair logic.
  - [x] Build `registry/loader.ts` to hot-reload Markdown prompts/skills from `/prompts`.
- [x] **B2.2: Planner Agent**
  - [x] Implement `planner.ts` to generate 3 distinct approach briefs (JSON).
  - [ ] Add diversity check using embeddings to ensure approaches are methodologically distinct.
- [x] **B2.3: Playwright Browsing Layer**
  - [x] Implement `PlaywrightPool.ts` for browser context management.
  - [x] Build `search.ts` and `extract.ts` for search engine scraping and content cleaning.
- [x] **B2.4: Researcher Agent**
  - [x] Implement parallel Research agents (A, B, and C).
  - [x] Generate `DraftReport` (Markdown) with structured source mapping and `[n]` citations.
- [x] **F2.1: Research UI**
  - [x] Build Query Input screen with "depth" presets (Quick, Standard, Deep).
  - [x] Implement views for "Plan" and "Draft Reports" A/B/C.

### Phase 2 Observations & Rework
*(To be filled after each task or phase testing)*
- **Observation:** Phase 2 complete. The system can now decompose queries into diverse approaches and execute parallel research tasks. The UI renders the `Plan` (approaches A/B/C) and the `DraftReports` with full Markdown support and source logs. Backend exposes artifacts via static file serving for easy frontend access.
- **Rework Needed:** [None]

---

## Phase 3: Fact-Checking & Debate
**Goal:** Implement factual verification of claims and adversarial critique between research strategies.

### Checklist
- [x] **B3.1: Fact-Checker Agent**
  - [x] Implement atomic claim extraction from drafts (handled by Researcher).
  - [x] Build independent verification logic using Playwright to check extracted claims.
  - [x] Assign verdicts (Verified, Contradicted, etc.) and confidence scores.
- [x] **B3.2: Embeddings Integration**
  - [x] Implement source deduplication and claim clustering across the 3 approaches.
- [x] **B3.3: Debater Agent**
  - [x] Implement the debate protocol: cross-critique and rebuttal rounds.
  - [x] Generate a structured `DebateTranscript` highlighting contradictions and gaps.
- [x] **F3.1: Verification UI**
  - [x] Build `FactCheckTable` with interactive verdict badges.
  - [x] Implement the `DebateThread` viewer for visualizing agent arguments.

### Phase 3 Observations & Rework
*(To be filled after each task or phase testing)*
- **Observation:** Phase 3 complete. Fact-checker now verifies claims in parallel. Debater facilitates cross-approach critique. Frontend components for fact-check results and debate transcripts are implemented.
- **Rework Needed:** [None]

---

## Phase 4: Synthesis & Finalization
**Goal:** Consolidate all findings into a high-fidelity final report and polish the user experience.

### Checklist
- [x] **B4.1: Synthesizer Agent**
  - [x] Implement logic to merge 3 drafts, resolving conflicts identified in the debate.
  - [x] Ensure "Disagreements & Open Questions" are explicitly preserved if unresolved.
- [x] **B4.2: Final Fact-Checker**
  - [x] Run a final end-to-end verification pass on the synthesized report.
- [x] **B4.3: Report Finalizer**
  - [x] Assembly of the final Markdown deliverable with renumbered citations and full bibliography.
- [x] **F4.1: Final Report & Registry Editor**
  - [x] Build the high-fidelity `FinalReportView`.
  - [x] Implement the `RegistryEditor` (FR-36) for live prompt/skill management.
- [x] **E2E: Full System Integration Test**
  - [x] Conduct end-to-end research runs with complex queries to verify pipeline stability and output quality.

### Phase 4 Observations & Rework
*(To be filled after each task or phase testing)*
- **Observation:** Phase 4 implementation complete. The synthesis engine now merges drafts and incorporates debate resolutions. Final fact-check and report assembly are functional.
- **Rework Needed:** [None]
