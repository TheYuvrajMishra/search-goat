const googleService = require('../services/googleService');
const duckduckgoService = require('../services/duckduckgoService');

class SearchController {
  /**
   * Main handler for searches. Defaulting to DuckDuckGo as the primary engine,
   * but allowing Google if specified.
   */
  async handleSearch(req, res) {
    const startTime = Date.now();
    
    // Support query in param, q, or query query-string parameters
    const query = req.query.q || req.query.query || req.params.query;
    
    // Default engine is 'duckduckgo' (primary)
    const engine = (req.query.engine || 'duckduckgo').toLowerCase();

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" or "query" (or route parameter) is required.'
      });
    }

    try {
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

      const timeTakenMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        meta: {
          query,
          engine: engine === 'ddg' ? 'duckduckgo' : engine,
          totalResults: formattedResults.length,
          timeTakenMs,
          timestamp: new Date().toISOString()
        },
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
}

module.exports = new SearchController();
