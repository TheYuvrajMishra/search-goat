const googleService = require('../services/googleService');
const duckduckgoService = require('../services/duckduckgoService');
const llmService = require('../services/llmService');
const keywordService = require('../services/keywordService');
const similarSearchService = require('../services/similarSearchService');

class SearchController {
  /**
   * Main handler for searches. Defaulting to DuckDuckGo as the primary engine,
   * but allowing Google if specified. Supports AI summaries by default and optimized keywords.
   */
  async handleSearch(req, res) {
    const startTime = Date.now();
    
    // Support query in param, q, or query query-string parameters
    const query = req.query.q || req.query.query || req.params.query;
    
    // Default engine is 'duckduckgo' (primary)
    const engine = (req.query.engine || 'duckduckgo').toLowerCase();

    // AI summary is now active by default, unless explicitly set to 'false'
    const summarize = req.query.summarize !== 'false';
    const includeKeywords = req.query.keywords === 'true';

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" or "query" (or route parameter) is required.'
      });
    }

    try {
      // Run keywords generation concurrently with search to optimize latency if requested
      const keywordsPromise = includeKeywords 
        ? keywordService.generateKeywords(query) 
        : Promise.resolve(null);

      let results = [];
      if (engine === 'google') {
        results = await googleService.search(query);
      } else if (engine === 'duckduckgo' || engine === 'ddg') {
        results = await duckduckgoService.search(query);
      } else {
        return res.status(400).json({
          success: false,
          error: `Unsupported search engine: "${engine}". Use "duckduckgo" or "google".`
        });
      }

      // Format search items and extract metadata
      const formattedResults = results.map((item, index) => {
        let domain = '';
        try {
          domain = new URL(item.url).hostname;
        } catch (e) {
          // Ignore invalid URL formatting
        }

        return {
          rank: index + 1,
          title: item.title,
          url: item.url,
          domain: domain,
          snippet: item.snippet,
          source: engine === 'ddg' ? 'duckduckgo' : engine
        };
      });

      // Fetch keywords and generate LLM summary concurrently if possible
      const [keywords, summary] = await Promise.all([
        keywordsPromise,
        (summarize && formattedResults.length > 0) 
          ? llmService.generateSummary(query, formattedResults) 
          : Promise.resolve(null)
      ]);

      const timeTakenMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        meta: {
          query,
          engine: engine === 'ddg' ? 'duckduckgo' : engine,
          totalResults: formattedResults.length,
          timeTakenMs,
          timestamp: new Date().toISOString(),
          keywords: keywords || undefined
        },
        summary: summary, // Always returned (either the summary string or null)
        results: formattedResults
      });
    } catch (error) {
      console.error('Search controller error:', error);
      const isRateLimit = error.message.includes('429') || error.message.includes('CAPTCHA');
      const statusCode = isRateLimit ? 429 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Dedicated handler for generating 5 search keywords from a conversational query.
   */
  async handleKeywords(req, res) {
    const query = req.query.q || req.query.query || req.params.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" or "query" (or route parameter) is required.'
      });
    }

    try {
      const keywords = await keywordService.generateKeywords(query);
      return res.status(200).json({
        success: true,
        query,
        keywords
      });
    } catch (error) {
      console.error('Keywords handler error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handler for parallel searches with 5 similar queries.
   */
  async handleSimilarSearch(req, res) {
    const startTime = Date.now();
    const query = req.query.q || req.query.query || req.params.query;
    const engine = (req.query.engine || 'duckduckgo').toLowerCase();

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" or "query" (or route parameter) is required.'
      });
    }

    try {
      const { similarQueries, results } = await similarSearchService.searchSimilar(query, engine);

      // Extract domains and map ranks
      const formattedResults = results.map((item, index) => {
        let domain = '';
        try {
          domain = new URL(item.url).hostname;
        } catch (e) {
          // Ignore invalid URL formatting
        }

        return {
          rank: index + 1,
          title: item.title,
          url: item.url,
          domain,
          snippet: item.snippet,
          matchedQuery: item.matchedQuery,
          source: engine === 'ddg' ? 'duckduckgo' : engine
        };
      });

      const timeTakenMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        meta: {
          query,
          engine: engine === 'ddg' ? 'duckduckgo' : engine,
          similarQueries,
          totalResults: formattedResults.length,
          timeTakenMs,
          timestamp: new Date().toISOString()
        },
        results: formattedResults
      });
    } catch (error) {
      console.error('Similar search controller error:', error);
      const isRateLimit = error.message.includes('429') || error.message.includes('CAPTCHA');
      const statusCode = isRateLimit ? 429 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SearchController();
