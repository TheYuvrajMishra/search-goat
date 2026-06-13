# search-goat — Design Document

This document covers system architecture, agent/pipeline design, data models, the prompt/skill registry convention, API contracts, and the frontend design system.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Vite + React + TS, inline Tailwind)                    │
│  - Query input, live pipeline view, report viewer, registry UI    │
└───────────────────────────────┬──────────────────────────────────┘
                                  │ WebSocket / SSE + REST
┌───────────────────────────────▼──────────────────────────────────┐
│  Backend (Node.js)                                                 │
│                                                                     │
│  ┌──────────────┐   ┌──────────────────┐   ┌───────────────────┐ │
│  │ Orchestrator  │──▶│ Agent Runner       │──▶│ LLM Client       │ │
│  │ (pipeline FSM)│   │ (per-stage agents) │   │ -> localhost:3001 │ │
│  └──────┬───────┘   └─────────┬────────┘   └───────────────────┘ │
│         │                     │                                   │
│         │             ┌───────▼─────────┐                         │
│         │             │ Playwright Pool   │  (browser automation) │
│         │             └───────┬─────────┘                         │
│         │                     │                                   │
│  ┌──────▼───────┐     ┌───────▼─────────┐   ┌───────────────────┐│
│  │ Prompt/Skill  │     │ Source Cache /   │   │ Run Store          ││
│  │ Registry (md) │     │ Evidence Store   │   │ (JSON / SQLite)   ││
│  └───────────────┘     └─────────────────┘   └───────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Key principles
- **Stateless agents, stateful orchestrator.** Each agent invocation is a pure function: `(context, prompt) -> structured output`. The orchestrator owns pipeline state, retries, and persistence.
- **Everything is an artifact.** Every stage writes a versioned JSON (and Markdown where applicable) artifact to the Run Store, which the frontend streams/reads from.
- **Schema-first.** Every inter-stage payload has a JSON Schema. LLM outputs are requested in JSON (via `/v1/chat/completions` with response-format / strict prompting) and validated; failures trigger a "repair" call.

---

## 2. Backend Module Layout

```
/server
  /orchestrator
    pipeline.ts          # FSM: stage sequencing, retries, budgets
    runStore.ts          # persistence of run artifacts
  /agents
    planner.ts
    researcher.ts         # parameterized by approach brief
    factChecker.ts
    debater.ts
    synthesizer.ts
    finalFactChecker.ts
  /llm
    client.ts            # wraps /v1/chat/completions, /v1/responses
    embeddings.ts         # wraps /v1/embeddings
    schema.ts             # zod/json-schema definitions + validators
  /browser
    playwrightPool.ts     # browser/context pool, page lifecycle
    search.ts             # search-engine query helpers
    extract.ts            # readable-content extraction (e.g. readability)
    sourceLog.ts          # per-run source/evidence ledger
  /registry
    loader.ts             # loads & hot-reloads /prompts/**/*.md
    inject.ts             # merges skill md into system/developer messages
  /api
    routes.ts             # REST endpoints
    ws.ts                 # SSE/WebSocket pipeline events
  index.ts

/prompts                   # markdown prompt/skill registry (see §6)
  /roles
    planner.md
    researcher.md
    fact-checker.md
    debater.md
    synthesizer.md
  /skills
    write-citation.md
    claim-extraction.md
    verdict-rubric.md
    debate-protocol.md
    report-formatting.md

/web                       # Vite + React + TS frontend
```

---

## 3. Pipeline State Machine

States: `planning -> researching -> fact_checking -> debating -> synthesizing -> final_fact_check -> finalizing -> done` (with `error`/`paused` as side states).

- Each state transition emits an event over WebSocket: `{runId, stage, status, progress, message, timestamp}`.
- `researching` and `fact_checking` fan out into 3 parallel sub-tasks (`A`, `B`, `C`); the orchestrator waits for all 3 (with per-task timeout) before advancing.
- Budgets (tokens, pages, time) are enforced per stage; exceeding a soft budget logs a warning and continues, exceeding a hard budget truncates the stage gracefully (agent is asked to "wrap up now with what you have").

---

## 4. Agent Specifications

### 4.1 Planner
- **Input:** user query + constraints.
- **Skill files injected:** `roles/planner.md`.
- **Output schema:** `PlanOutput`
```json
{
  "query": "string",
  "approaches": [
    {
      "id": "A",
      "name": "string",
      "methodology": "string",
      "source_types": ["string"],
      "sub_questions": ["string"],
      "seed_queries": ["string"]
    }
  ] // exactly 3
}
```

### 4.2 Researcher (one instance per approach A/B/C)
- **Input:** approach brief + global query.
- **Tools:** Playwright (`search`, `openPage`, `extractContent`, `followLink`), Embeddings (dedupe sources).
- **Output schema:** `DraftReport`
```json
{
  "approach_id": "A",
  "title": "string",
  "markdown": "string",        // body with [n] citation markers
  "sources": [
    {
      "id": 1,
      "url": "string",
      "title": "string",
      "accessed_at": "ISO8601",
      "snippet": "string",
      "used_for_claims": ["claim_id"]
    }
  ],
  "claims": [
    { "id": "A1", "text": "string", "source_ids": [1], "location": "string" }
  ]
}
```

### 4.3 Fact-Checker (runs per draft A/B/C)
- **Input:** `DraftReport.claims` + `sources`.
- **Tools:** Playwright (independent verification searches), Embeddings (match claim <-> evidence).
- **Output schema:** `FactCheckReport`
```json
{
  "approach_id": "A",
  "results": [
    {
      "claim_id": "A1",
      "verdict": "Verified|Partially Verified|Unverified|Contradicted|Outdated",
      "confidence": 0.0,
      "evidence": [{ "url": "string", "note": "string", "stance": "supports|contradicts" }]
    }
  ]
}
```

### 4.4 Debater (3 agents, one per approach, cross-reviewing the other two)
- **Input:** all 3 `DraftReport` + `FactCheckReport` pairs.
- **Protocol:** `skills/debate-protocol.md` defines round structure (default 2 rounds).
- **Output schema:** `DebateTranscript`
```json
{
  "rounds": [
    {
      "round": 1,
      "critiques": [
        {
          "from": "A", "against": "B", "claim_id": "B3",
          "issue_type": "contradiction|gap|weak_source|overstatement|missing_context",
          "detail": "string", "counter_evidence": [{"url":"string","note":"string"}],
          "severity": "low|medium|high"
        }
      ],
      "rebuttals": [
        { "from": "B", "to_critique": "<critique-id>", "response": "string", "concession": true }
      ]
    }
  ],
  "unresolved": ["critique-id"]
}
```

### 4.5 Synthesizer
- **Input:** 3 `DraftReport`, 3 `FactCheckReport`, `DebateTranscript`.
- **Output schema:** `SynthesizedReport`
```json
{
  "markdown": "string",          // full report, [n] citations renumbered
  "sources": [ /* deduplicated, merged source list */ ],
  "open_questions": ["string"],
  "methodology_summary": "string"
}
```

### 4.6 Final Fact-Checker
- Same shape as 4.3 but operates on `SynthesizedReport.claims` (re-extracted from `markdown`); reuses cached evidence from the Source/Evidence Store where the claim is unchanged (matched via embeddings similarity threshold), else performs fresh Playwright verification.
- On any `Contradicted`/`Unverified` verdict, emits a `CorrectionRequest` back to the Synthesizer (bounded to 1 retry by default).

### 4.7 Report Finalizer
- Pure formatting/assembly step (no LLM call required, or a light formatting-only call): merges `SynthesizedReport.markdown`, final fact-check table, and the full bibliography into the final `.md` deliverable per FR-23.

---

## 5. Data Models — Run Store

```
/runs/{runId}/
  meta.json                 # query, constraints, timestamps, status
  plan.json
  drafts/{A,B,C}.json
  factchecks/{A,B,C}.json
  debate.json
  synthesis.json
  final_factcheck.json
  final_report.md
  evidence/                 # cached page extracts keyed by URL hash
    {urlHash}.json          # {url, title, fetchedAt, text, screenshot?}
```

`runStore.ts` exposes simple read/write/append APIs; the WS layer streams diffs/events as files are written.

---

## 6. Prompt / Skill Registry Convention

All prompts live under `/prompts` as Markdown with YAML frontmatter:

```markdown
---
name: fact-checker-role
role: fact_checker
version: 1
applicable_stage: fact_checking
output_schema: FactCheckReport
---

# Fact-Checker Role

You are a rigorous fact-checking agent...

## Verdict Rubric
- Verified: ...
- Partially Verified: ...
...
```

- **Roles** (`/prompts/roles/*.md`) define the persona/system message for a stage.
- **Skills** (`/prompts/skills/*.md`) are composable instruction snippets (e.g. citation formatting, claim extraction method, debate protocol) referenced by `applicable_stage` and concatenated after the role prompt.
- `registry/loader.ts` watches the `/prompts` directory (chokidar or fs.watch) and reloads on change — no server restart needed.
- `registry/inject.ts` builds the final message array for a given stage: `[system: role.md + applicable skills..., developer: schema instructions, user: stage-specific payload]`.
- The frontend's registry panel (FR-36) reads/writes these files via a REST endpoint (`GET/PUT /api/prompts/:path`), so iteration doesn't require redeploys.

---

## 7. LLM & Embeddings Integration

- **Client** (`llm/client.ts`): thin wrapper over `fetch` to `http://localhost:3001/v1/chat/completions` and `/v1/responses`. Supports passing `response_format: { type: "json_schema", schema }` where the gateway supports it; falls back to "return only JSON" prompting + `schema.ts` (zod) validation + one repair retry otherwise.
- **Embeddings** (`llm/embeddings.ts`): wraps `/v1/embeddings` with `model: "auto"` default. Used for:
  - Source dedup across the 3 researchers (cosine similarity on title+URL+snippet embeddings).
  - Claim clustering in the debate stage (group near-duplicate claims from A/B/C before cross-critique).
  - Matching final-report claims back to already-verified claims (cache hit for final fact-check).

---

## 8. Playwright Browsing Layer

- **Pool**: a small pool of persistent browser contexts (default 3, one per concurrent researcher/fact-checker) to bound resource usage.
- **Search**: default to a privacy-friendly HTML search endpoint; abstracted behind `search(query) -> SearchResult[]` so the provider can be swapped (config-driven).
- **Extraction**: fetch page -> strip boilerplate (readability-style extraction) -> store in Evidence Store keyed by URL hash, with `fetchedAt` for freshness checks.
- **Link following**: capped depth (default 1) and capped pages-per-query (default 3-5), configurable per "depth" preset (Quick/Standard/Deep).
- **Failure handling**: per-page timeout (e.g. 15s); on failure, log and continue — agents are told which queries returned no usable results so they can adapt.

---

## 9. API Contracts (REST + WS)

### REST
- `POST /api/runs` — `{ query, constraints }` -> `{ runId }`
- `GET /api/runs` — list run history
- `GET /api/runs/:runId` — full run metadata + status
- `GET /api/runs/:runId/artifacts/:stage` — fetch a specific stage artifact (plan/drafts/factchecks/debate/synthesis/final_factcheck/final_report)
- `GET /api/runs/:runId/final_report.md` — raw final report
- `POST /api/runs/:runId/cancel`
- `GET /api/prompts` — list registry files
- `GET /api/prompts/:path` / `PUT /api/prompts/:path` — read/edit a prompt or skill md file

### WebSocket / SSE
- `GET /api/runs/:runId/events` — stream of `{ stage, status: 'pending'|'running'|'done'|'error', progress, message, timestamp }` events, plus token-level streaming of the active stage's LLM output for live "typing" effect in the UI.

---

## 10. Frontend Design System

### 10.1 Theme summary
**Minimalist + neo-brutalist + dark professional.** Generous whitespace, strong visible structure (1px borders forming a grid), sharp corners (no rounded corners, or at most 2px), high-contrast text, restrained color palette with a single accent color used sparingly for status/emphasis. Monospace type for citations, source URLs, JSON/schema previews, and status badges to reinforce the "research tooling" feel.

### 10.2 Color tokens (Tailwind, defined as CSS variables + inline classes)

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0A0A0B` | App background |
| `--bg-panel` | `#111113` | Card/panel background |
| `--bg-elevated` | `#17171A` | Hover/active surfaces |
| `--border` | `#2A2A2E` | Default 1px borders/grid lines |
| `--border-strong` | `#3F3F46` | Emphasized dividers |
| `--text-primary` | `#F4F4F5` | Primary text |
| `--text-secondary` | `#A1A1AA` | Secondary/meta text |
| `--text-muted` | `#6B6B70` | Disabled/placeholder |
| `--accent` | `#7CFF6B` (or `#3DDC84`) | Primary accent — used for active state, links, "Verified" badges |
| `--accent-warn` | `#FFC857` | "Partially Verified" / warnings |
| `--accent-danger` | `#FF5C5C` | "Contradicted" / errors |
| `--accent-info` | `#5CC8FF` | Informational highlights, "Unverified" |

> Implementation note: since the project uses **inline Tailwind**, define these as CSS custom properties in a single `:root` block (e.g. in `index.css` or injected via a `<style>` in `index.html`), then reference via Tailwind's arbitrary value syntax, e.g. `bg-[var(--bg-panel)]`, `border-[var(--border)]`, `text-[var(--accent)]`.

### 10.3 Typography
- **UI/body**: a clean grotesque sans (e.g. `Inter`, system-ui fallback) — `text-sm`/`text-base`, `leading-relaxed` for readability in long reports.
- **Monospace accents**: `font-mono` (e.g. `JetBrains Mono` / `ui-monospace`) for: citation markers `[1]`, source URLs, claim IDs, JSON previews, status pills, timestamps.
- **Headings**: same sans family, bold weight, tight tracking, uppercase for section labels (`text-xs uppercase tracking-widest text-[var(--text-secondary)]`) to reinforce the brutalist "labeled section" feel.

### 10.4 Layout & spacing
- Base spacing unit `4px`; generous outer padding (`p-6`–`p-10`) on panels, but tight internal spacing for data-dense areas (source lists, fact-check tables).
- **Grid-based layout**: visible 1px borders (`border border-[var(--border)]`) separating major regions — sidebar / pipeline rail / main content — forming a literal grid (neo-brutalist hallmark).
- **No rounded corners** (`rounded-none`) or a very small radius (`rounded-[2px]`) used consistently if any.
- **No drop shadows**; use borders and subtle background-shade shifts (`--bg-panel` vs `--bg-elevated`) for depth/hierarchy instead.
- Dividers between list items: full-width 1px `--border` lines rather than card spacing/margins — reinforces the "lined" aesthetic.

### 10.5 Core layout structure

```
┌──────────────┬──────────────────────────────────────────┬──────────────┐
│  Pipeline     │  Main Content                              │  Inspector    │
│  Rail (left)  │  (query input / drafts / debate / report)  │  (right)      │
│  - 7 stage    │                                             │  - sources    │
│    steps,     │                                             │  - claims     │
│    status     │                                             │  - schema     │
│    dots       │                                             │  - registry   │
└──────────────┴──────────────────────────────────────────┴──────────────┘
```
- **Pipeline Rail**: vertical list of the 7 stages, each as a labeled row with a status indicator (empty square = pending, filled square = running with subtle pulse, accent-filled = done, danger-filled = error) — squares not circles, reinforcing the brutalist grid.
- **Main Content**: tabs for "Plan", "Drafts A/B/C", "Debate", "Synthesis", "Final Fact-Check", "Final Report" — tabs rendered as bordered rectangles, active tab gets `border-b-2 border-[var(--accent)]`.
- **Inspector (right rail, collapsible)**: contextual detail for whatever is selected — a source list with URLs/timestamps, a claim's fact-check evidence, or the raw JSON schema/registry file being used for the current stage.

### 10.6 Components

- **Status badge**: `font-mono text-xs uppercase px-2 py-0.5 border border-[var(--border-strong)]`, color-coded text via accent tokens (Verified -> `--accent`, Contradicted -> `--accent-danger`, etc.), `rounded-none`.
- **Source card**: 1px bordered block, `bg-[var(--bg-panel)]`, monospace URL truncated with ellipsis, title in sans, small "accessed at" timestamp in `--text-muted`.
- **Claim row**: report text on the left, verdict badge + confidence (as a thin horizontal bar, not a circular gauge) on the right, expandable to show evidence list.
- **Debate thread**: each critique/rebuttal as a left-bordered block (`border-l-2`) colored by approach (A/B/C each get a subtle accent variant), threaded with indentation reflecting rounds.
- **Report viewer**: rendered Markdown with citation markers `[n]` as small superscript-style monospace buttons that scroll/highlight the corresponding bibliography entry on click.
- **Registry editor**: split view — file tree (monospace) on the left, raw Markdown editor (textarea or lightweight code editor) on the right, with frontmatter fields parsed/displayed separately.

### 10.7 Motion
- Minimal, purposeful motion only: pipeline status dots pulse while `running`; new debate entries fade/slide in; no decorative animation. Respect `prefers-reduced-motion`.

### 10.8 Accessibility & responsiveness
- Maintain WCAG AA contrast against the dark background for all text/accent combinations (verify `--accent` choices against `--bg-base`).
- Inspector rail collapses on narrow viewports; Pipeline Rail collapses to a horizontal stepper on mobile widths.
- All interactive elements (tabs, badges-as-filters, citation links) keyboard-navigable with visible focus rings (`focus:outline-2 focus:outline-[var(--accent)]`, square not rounded).

---

## 11. Frontend Module Layout

```
/web/src
  /components
    PipelineRail.tsx
    TabBar.tsx
    DraftReportView.tsx
    FactCheckTable.tsx
    DebateThread.tsx
    SynthesisView.tsx
    FinalReportView.tsx
    SourceCard.tsx
    StatusBadge.tsx
    InspectorPanel.tsx
    RegistryEditor.tsx
  /hooks
    useRunEvents.ts        # WS/SSE subscription
    useRun.ts              # fetch run + artifacts
  /lib
    api.ts                 # REST client
    markdown.ts            # citation-aware markdown renderer
  /styles
    theme.css              # :root CSS variables (color tokens, fonts)
  App.tsx
  main.tsx
```

---

## 12. Configuration

`config/default.json` (overridable via env):
```json
{
  "llm": {
    "baseUrl": "http://localhost:3001/v1",
    "chatModel": "auto",
    "embeddingModel": "auto"
  },
  "depthPresets": {
    "quick":    { "maxPagesPerQuery": 2, "maxLinkDepth": 0, "debateRounds": 1 },
    "standard": { "maxPagesPerQuery": 4, "maxLinkDepth": 1, "debateRounds": 2 },
    "deep":     { "maxPagesPerQuery": 8, "maxLinkDepth": 2, "debateRounds": 3 }
  },
  "playwright": {
    "browserPoolSize": 3,
    "pageTimeoutMs": 15000,
    "searchProvider": "duckduckgo-html"
  }
}
```

---

## 13. Open Implementation Notes
- Use `zod` for runtime schema validation of all LLM JSON outputs; pair each schema with a "repair prompt" that includes the validation errors verbatim.
- Consider SQLite (via `better-sqlite3`) for run metadata/history once flat-file run directories become hard to query, while keeping large artifacts (markdown, evidence text) as files referenced by path.
- The 3 approaches from the Planner should be passed through embeddings similarity check against each other's `methodology` text to enforce FR-3 (meaningful diversity) — if two approaches are too similar (above a threshold), ask the Planner to revise before proceeding.