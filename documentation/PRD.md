# search-goat — Product Requirements Document (PRD)

## 1. Overview

**search-goat** is an autonomous, multi-agent research system that takes a user query, plans multiple independent research strategies, executes web research for each strategy in parallel, generates three distinct draft reports, fact-checks every claim in each report, has the drafts critique and "argue" with one another to surface disagreements and gaps, synthesizes a single comprehensive report from the debate, runs a final end-to-end fact-check pass, and delivers a polished report with a full bibliography of sources and references.

The product targets users who need deep, citation-heavy research on a topic (analysts, researchers, founders, students, journalists) and want a transparent pipeline showing *how* the conclusion was reached, not just the final answer.

## 2. Problem Statement

Single-pass LLM research tends to:
- Converge on one framing/approach and miss alternative angles.
- Hallucinate or misattribute facts.
- Provide weak or fabricated citations.
- Give no visibility into reasoning or disagreement between possible interpretations.

search-goat addresses this by structurally forcing **diversity of approach** (3 independent strategies), **verification** (two fact-check passes), and **adversarial synthesis** (the three reports debate before merging).

## 3. Goals

- Given a single research query, produce one final comprehensive Markdown report with inline citations and a "Resources & References" section.
- Ensure every approach is methodologically distinct (defined dynamically by a Planner agent, not hardcoded).
- Verify factual claims against live web sources using Playwright-driven browsing — not just the model's internal knowledge.
- Surface and resolve contradictions between the three reports through a structured debate/argumentation phase.
- Provide full pipeline transparency in the UI: plan -> 3 drafts -> fact-check results -> debate transcript -> synthesized report -> final fact-check -> final report.
- Be self-hostable: all LLM calls go to a local OpenAI-compatible gateway (`http://localhost:3001/v1`).

## 4. Non-Goals

- Not a general chatbot — single-purpose research pipeline per query (multi-turn refinement is a stretch goal, see §11).
- Not responsible for hosting/serving the LLM itself — only consumes the `/v1/chat/completions`, `/v1/responses`, and `/v1/embeddings` endpoints.
- No paid/SaaS search APIs required by default — Playwright drives a real browser against public search engines and pages (configurable to add API-based search providers later).
- No user accounts/auth in v1 — single-user local tool.

## 5. User Personas

| Persona | Need |
|---|---|
| Independent researcher / analyst | Deep multi-angle research with verifiable citations |
| Founder / PM | Market/competitive research with confidence scoring on claims |
| Student / journalist | A defensible, well-sourced report they can build on |
| Power user / tinkerer | Wants to inspect/edit the prompt & skill markdown files driving each agent |

## 6. High-Level Pipeline

```
User Query
   |
   v
[1] PLANNER AGENT
   - Decomposes query
   - Defines 3 distinct research APPROACHES (methodology, angle, source bias, etc.)
   - Produces a research brief per approach
   |
   |------------------+------------------+------------------+
   v                  v                  v                  |
[2] RESEARCH-A      RESEARCH-B         RESEARCH-C           |  (parallel)
 - Playwright web search/browse per approach
 - Drafts Report A / B / C with inline citations
   |                  |                  |
   v                  v                  v
[3] FACT-CHECK A    FACT-CHECK B       FACT-CHECK C
 - Extracts atomic claims
 - Re-searches and verifies each claim
 - Annotates confidence + corrections
   |                  |                  |
   +------------------+------------------+
                       v
[4] DEBATE / CROSS-EXAMINATION
 - 3 reports + fact-check annotations exchanged
 - Agents argue: contradictions, gaps, weak claims, conflicting sources
 - Structured debate transcript produced
                       v
[5] SYNTHESIS AGENT
 - Produces single COMPREHENSIVE REPORT
 - Merges strongest points, resolves conflicts, notes open disagreements
                       v
[6] FINAL FACT-CHECK
 - Full pass over synthesized report
 - Re-verifies all retained claims, flags any new/merged claims
                       v
[7] FINAL REPORT + RESOURCES
 - Polished report (Markdown)
 - Full deduplicated bibliography / reference list with URLs, access dates,
   and per-claim citation mapping
```

## 7. Functional Requirements

### 7.1 Planner Layer
- FR-1: Accepts a free-text research query (and optional constraints: depth, time range, region, source-type preferences).
- FR-2: Produces exactly **3 distinct approach briefs**, each containing: approach name, methodology description, target source types (e.g. academic, news, primary docs, forums, financial filings), key sub-questions, and search seed queries.
- FR-3: Approaches must be *meaningfully different* (e.g. "quantitative/data-driven", "expert opinion & qualitative", "historical/contrarian/devil's-advocate") — enforced via a planning rubric prompt, not fixed templates, so the planner adapts to the query domain.
- FR-4: Planner output is structured JSON (validated against schema) consumed by the 3 research agents.

### 7.2 Research Agents (x3, parallel)
- FR-5: Each agent receives its approach brief and an isolated context.
- FR-6: Each agent uses Playwright to: perform search engine queries, open result pages, extract main content, and follow relevant links (configurable depth limit).
- FR-7: Each agent maintains a running source log (URL, title, accessed timestamp, extracted snippet/quote, relevance note).
- FR-8: Each agent produces a draft report (Markdown) with inline citation markers `[n]` mapped to its source log.
- FR-9: Agents respect a configurable browsing budget (max pages, max time, max tokens).

### 7.3 Fact-Check Layer (per draft)
- FR-10: Extracts an atomic claim list from each draft (claim text, source citation, location in report).
- FR-11: For each claim, performs an independent verification search (Playwright) — may use different sources than the original.
- FR-12: Assigns a verdict per claim: `Verified`, `Partially Verified`, `Unverified`, `Contradicted`, `Outdated`, with confidence score and supporting/contradicting evidence + URLs.
- FR-13: Produces a fact-check report per draft, structured JSON plus a human-readable summary.
- FR-14: Claims marked `Contradicted` or `Unverified` are flagged for the debate phase.

### 7.4 Debate / Cross-Examination
- FR-15: Each of the 3 (report + fact-check) pairs is shared with the other two agents.
- FR-16: Agents produce structured critique objects: `{claim, issue_type, counter_evidence, severity, suggested_resolution}` where `issue_type` is one of: contradiction, gap, weak_source, overstatement, missing_context.
- FR-17: A debate orchestrator runs N rounds (configurable, default 2) of critique -> rebuttal until convergence or round limit.
- FR-18: The full debate transcript is persisted and exposed in the UI.

### 7.5 Synthesis
- FR-19: Synthesis agent receives all 3 drafts, all fact-check results, and the full debate transcript.
- FR-20: Produces one comprehensive report that integrates the strongest verified claims across all 3 approaches, explicitly notes unresolved disagreements (with both sides + evidence), restructures into a coherent narrative/sections appropriate to the query domain, and maintains a unified, deduplicated, renumbered citation list.

### 7.6 Final Fact-Check
- FR-21: Re-runs claim extraction and verification on the synthesized report only (claims already verified in 7.3 can be confirmed via cached evidence plus a spot re-check; new or merged claims get full verification).
- FR-22: Any claim downgraded to `Contradicted`/`Unverified` triggers an automatic correction pass by the Synthesis agent (bounded retries, default 1).

### 7.7 Final Report & Resources
- FR-23: Output is a single Markdown document containing: an Executive Summary, the full report body with inline `[n]` citations, a "Disagreements & Open Questions" section, a "Methodology" section describing the 3 approaches used, a "Resources & References" section (full bibliography with URL, title, publisher, access date, and which section/claim used it), and a "Fact-Check Summary" table (claim, verdict, confidence, source).
- FR-24: Exportable as `.md` (v1) and `.pdf`/`.docx` (stretch — via existing skills).

### 7.8 Prompt / Skill Registry
- FR-25: All agent prompts, role definitions, rubrics, and "skills" (reusable instruction modules, e.g. "how to write a fact-check verdict", "how to debate a claim") are stored as Markdown files in a versioned `prompts/` registry.
- FR-26: Markdown skill files support frontmatter metadata (name, role, version, applicable_stage) and are injected into the relevant LLM call's system/developer message at runtime.
- FR-27: The registry is hot-reloadable (no restart) for iteration during development.

### 7.9 LLM & Embeddings Gateway
- FR-28: All LLM calls (planning, research, fact-checking, debate, synthesis) go through `http://localhost:3001/v1/chat/completions` (or `/v1/responses`), OpenAI-compatible.
- FR-29: `/v1/embeddings` is used for: deduplicating sources, clustering similar claims across the 3 reports, and semantic matching of claims to evidence during fact-check.
- FR-30: Embedding model selection: `"auto"` by default, overridable per task.

### 7.10 Frontend (Vite + React + TS)
- FR-31: Query input screen with optional advanced constraints (depth, region, time range, source-type weighting).
- FR-32: Live pipeline view — a vertical/stepper visualization of the 7 stages with real-time status (pending/running/done/error) via WebSocket or SSE.
- FR-33: Tabbed view of the 3 draft reports plus their fact-check annotations (inline highlighting of claim verdicts).
- FR-34: Debate transcript viewer (threaded, per-claim).
- FR-35: Final report viewer with collapsible "Resources & References" and "Fact-Check Summary" sections, plus copy/export buttons.
- FR-36: Prompt/Skill registry browser and editor (view/edit the Markdown files driving each stage) — a power-user panel.
- FR-37: Run history (past queries and reports), stored locally.

## 8. Non-Functional Requirements

- NFR-1: **Transparency** — every intermediate artifact (plan, 3 drafts, fact-checks, debate, synthesis, final fact-check) is persisted and viewable.
- NFR-2: **Resilience** — Playwright failures (timeouts, blocked pages, CAPTCHAs) degrade gracefully; the agent continues with available sources and notes coverage gaps in the report.
- NFR-3: **Structural determinism** — all inter-agent payloads are JSON-schema validated; malformed LLM output triggers a bounded retry/repair step.
- NFR-4: **Performance** — end-to-end run time configurable via "depth" presets (Quick / Standard / Deep), with Standard targeting roughly 5-10 minutes for a moderately complex query.
- NFR-5: **Cost/token control** — per-stage token and browsing budgets are configurable; running totals are shown in the UI.
- NFR-6: **Local-first** — no external paid APIs required besides whatever the local LLM gateway proxies to; Playwright uses a real/headless browser against the public web.
- NFR-7: **Extensibility** — new pipeline stages, additional "approaches" beyond 3, or alternate fact-check strategies should be pluggable without core rewrites.

## 9. Design Theme (summary — see Design.md for detail)

Dark-themed, professional, **minimalist with generous whitespace**, **neo-brutalist linework** (visible borders/grids, sharp corners, monospace accents for data/citations), built with Vite + React + TS and **inline Tailwind CSS** (no external CSS files, no UI component libraries beyond Tailwind utilities).

## 10. Success Metrics

- Percentage of final-report claims marked `Verified`/`Partially Verified` after the final fact-check (target >= 90%).
- Number of unresolved disagreements surfaced per report (a transparency signal, not necessarily minimized).
- User-perceived report quality (manual review during development).
- Pipeline completion rate without manual intervention.
- Average sources cited per final report (depth signal; target 15-40 depending on the depth setting).

## 11. Future / Stretch

- Multi-turn refinement: user can ask follow-ups against the synthesized report and source corpus without re-running the whole pipeline.
- More than 3 approaches for very broad queries (planner-decided fan-out).
- Source-type weighting presets (e.g. "academic-only", "news-only").
- PDF/DOCX export via the existing `docx`/`pdf` skills.
- Caching layer for repeated/overlapping queries (embedding-based similarity).
- Multi-language research support.

## 12. Open Questions

- Default search engine(s) for Playwright (DuckDuckGo HTML, Bing, etc.) — needs to be robust against scraping blocks.
- How aggressively to bound the debate phase to avoid infinite loops/cost blowups.
- Whether fact-check re-verification should reuse cached page content or always re-fetch (freshness vs. cost).
- Storage: flat JSON files vs. a lightweight DB (e.g. SQLite) for run history.