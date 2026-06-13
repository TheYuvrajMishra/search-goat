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
- [ ] **B2.1: LLM Client & Prompt Registry**
  - [ ] Implement `llm/client.ts` with Zod schema validation and auto-repair logic.
  - [ ] Build `registry/loader.ts` to hot-reload Markdown prompts/skills from `/prompts`.
- [ ] **B2.2: Planner Agent**
  - [ ] Implement `planner.ts` to generate 3 distinct approach briefs (JSON).
  - [ ] Add diversity check using embeddings to ensure approaches are methodologically distinct.
- [ ] **B2.3: Playwright Browsing Layer**
  - [ ] Implement `PlaywrightPool.ts` for browser context management.
  - [ ] Build `search.ts` and `extract.ts` for search engine scraping and content cleaning.
- [ ] **B2.4: Researcher Agent**
  - [ ] Implement parallel Research agents (A, B, and C).
  - [ ] Generate `DraftReport` (Markdown) with structured source mapping and `[n]` citations.
- [ ] **F2.1: Research UI**
  - [ ] Build Query Input screen with "depth" presets (Quick, Standard, Deep).
  - [ ] Implement views for "Plan" and "Draft Reports" A/B/C.

### Phase 2 Observations & Rework
*(To be filled after each task or phase testing)*
- **Observation:** [Pending]
- **Rework Needed:** [None]

---

## Phase 3: Fact-Checking & Debate
**Goal:** Implement factual verification of claims and adversarial critique between research strategies.

### Checklist
- [ ] **B3.1: Fact-Checker Agent**
  - [ ] Implement atomic claim extraction from drafts.
  - [ ] Build independent verification logic using Playwright to check extracted claims.
  - [ ] Assign verdicts (Verified, Contradicted, etc.) and confidence scores.
- [ ] **B3.2: Embeddings Integration**
  - [ ] Implement source deduplication and claim clustering across the 3 approaches.
- [ ] **B3.3: Debater Agent**
  - [ ] Implement the debate protocol: cross-critique and rebuttal rounds.
  - [ ] Generate a structured `DebateTranscript` highlighting contradictions and gaps.
- [ ] **F3.1: Verification UI**
  - [ ] Build `FactCheckTable` with interactive verdict badges.
  - [ ] Implement the `DebateThread` viewer for visualizing agent arguments.

### Phase 3 Observations & Rework
*(To be filled after each task or phase testing)*
- **Observation:** [Pending]
- **Rework Needed:** [None]

---

## Phase 4: Synthesis & Finalization
**Goal:** Consolidate all findings into a high-fidelity final report and polish the user experience.

### Checklist
- [ ] **B4.1: Synthesizer Agent**
  - [ ] Implement logic to merge 3 drafts, resolving conflicts identified in the debate.
  - [ ] Ensure "Disagreements & Open Questions" are explicitly preserved if unresolved.
- [ ] **B4.2: Final Fact-Checker**
  - [ ] Run a final end-to-end verification pass on the synthesized report.
- [ ] **B4.3: Report Finalizer**
  - [ ] Assembly of the final Markdown deliverable with renumbered citations and full bibliography.
- [ ] **F4.1: Final Report & Registry Editor**
  - [ ] Build the high-fidelity `FinalReportView`.
  - [ ] Implement the `RegistryEditor` (FR-36) for live prompt/skill management.
- [ ] **E2E: Full System Integration Test**
  - [ ] Conduct end-to-end research runs with complex queries to verify pipeline stability and output quality.

### Phase 4 Observations & Rework
*(To be filled after each task or phase testing)*
- **Observation:** [Pending]
- **Rework Needed:** [None]
