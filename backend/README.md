# Search Scraper Service - Backend

A powerful search result aggregator and AI-powered summary engine. This service scrapes search results from Google and DuckDuckGo using Puppeteer and provides intelligent summaries and keyword optimizations via an LLM.

## Features

- **Multi-Engine Search**: Scrape organic results from Google and DuckDuckGo.
- **AI-Powered Summaries**: Synthesize search results into concise answers using a local or remote LLM (OpenAI-compatible API).
- **Keyword Optimization**: Convert conversational queries into optimized search keywords.
- **Similar Search**: Execute parallel searches for related queries to provide comprehensive coverage.
- **Stealth Scraping**: Uses `puppeteer-extra-plugin-stealth` and realistic user agents to minimize bot detection.
- **Graceful Shutdown**: Properly closes browser instances and server connections on termination.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Scraping**: Puppeteer, Puppeteer Extra (Stealth)
- **AI Integration**: Fetch API (connecting to OpenAI-compatible LLM endpoints)
- **Environment**: Dotenv for configuration

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `backend` directory (refer to `.env.example` if available, or use the keys below):
   ```env
   PORT=3000
   FREE_LLM_API_BASE=http://localhost:3001/v1
   FREE_LLM_API_KEY=your_api_key_here
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

The service supports both `/api/search` and `/search` prefixes.

### 1. Standard Search
`GET /search/q?query=<term>&engine=<engine>&summarize=<bool>&keywords=<bool>&similar=<bool>&rank=<bool>`
`GET /search/q/:query`

- **Parameters**:
  - `q` or `query`: The search term (required).
  - `engine`: `duckduckgo` (default) or `google`.
  - `summarize`: `true` (default) or `false`. Includes an AI summary of results.
  - `keywords`: `true` (default) or `false`. Includes optimized keywords in metadata.
  - `similar`: `true` (default) or `false`. Executes a comprehensive parallel search with 5 similar queries.
  - `rank`: `true` (default) or `false`. Uses an LLM to rank results and filter out irrelevant items, returning the top 10.

### 2. AI Summary
`GET /search/summary?query=<term>`
Short-hand for search with summarization, keywords, similar search, and AI ranking enabled (all default).

### 3. Keywords Generation
`GET /search/keywords?q=<term>`
`GET /search/keywords/:query`
Returns 5 optimized search keywords for the given query.

### 4. Similar Search
`GET /search/similar?query=<term>`
`GET /search/similar/:query`
Generates 5 similar queries and performs parallel searches, returning interleaved and deduplicated results.

### 5. Top Relevant Results
`GET /search/top?query=<term>`
`GET /search/top/:query`
Performs a comprehensive search using multiple similar queries, then uses an LLM to rank and filter the results, returning only the top 10 most relevant, high-quality items.

### 6. Engine-Specific Routes
- `GET /search/google?q=<term>`
- `GET /search/duckduckgo?q=<term>`
- `GET /search/google/summary?q=<term>`
- `GET /search/duckduckgo/summary?q=<term>`

### 6. Health Check
`GET /status`
Returns the server status and browser initialization state.

## Project Structure

```text
backend/
├── index.js                # Entry point & server configuration
├── src/
│   ├── controllers/
│   │   └── searchController.js # Request handlers & orchestration
│   ├── routes/
│   │   └── search.js          # Route definitions
│   └── services/
│       ├── browserService.js  # Puppeteer management
│       ├── duckduckgoService.js # DDG scraping logic
│       ├── googleService.js    # Google scraping logic
│       ├── keywordService.js   # LLM keyword generation
│       ├── llmService.js       # LLM summary integration
│       └── similarSearchService.js # Parallel search orchestration
```

## Technical Details

### Anti-Detection Measures
- **Stealth Plugin**: Utilizes `puppeteer-extra-plugin-stealth` to bypass common bot detection scripts.
- **Randomized Headers**: Sets realistic viewports and User-Agents.
- **Staggered Parallelism**: Multi-query searches are staggered (default 400ms) to avoid simultaneous requests that trigger rate limits.
- **HTML Fallback**: DuckDuckGo service prefers the lightweight HTML version for speed and reliability.

### Error Handling
- **429 Rate Limits**: Specifically detects and reports Google rate limits and CAPTCHAs.
- **Graceful Fallbacks**: If LLM services fail, search results are still returned without summaries. If the browser disconnects, it is automatically re-launched on the next request.
