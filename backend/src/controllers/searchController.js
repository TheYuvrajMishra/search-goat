const googleService = require('../services/googleService');
const duckduckgoService = require('../services/duckduckgoService');
const llmService = require('../services/llmService');
const keywordService = require('../services/keywordService');
const similarSearchService = require('../services/similarSearchService');
const rankingService = require('../services/rankingService');
const Session = require('../models/Session');
const Message = require('../models/Message');

class SearchController {
  /**
   * Dedicated handler for top 10 best and most relevant search results.
   * Uses similar search for a wide pool and then LLM-based ranking/filtering.
   */
  async handleTopResults(req, res) {
    const startTime = Date.now();
    const query = req.query.q || req.query.query || req.params.query;
    const engine = (req.query.engine || 'duckduckgo').toLowerCase();

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" or "query" (or route parameter) is required.'
      });
    }

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        console.log(`[SearchController] Client disconnected. Aborting top results search for: "${query}"`);
        abortController.abort();
      }
    });
    const signal = abortController.signal;

    try {
      // 1. Fetch a broad set of results using Similar Search
      console.log(`Fetching broad result pool for ranking: "${query}"...`);
      const { similarQueries, results } = await similarSearchService.searchSimilar(query, engine, { signal });

      // 2. Rank and filter results using the LLM Ranking Service
      const rankedResults = await rankingService.rankResults(query, results, { signal });

      // 3. Extract domains and map ranks for the final top 10
      const formattedResults = rankedResults.map((item, index) => {
        let domain = '';
        try {
          domain = new URL(item.url).hostname;
        } catch (e) {
          // Ignore invalid URL formatting
        }

        return {
          relevanceRank: index + 1,
          title: item.title,
          url: item.url,
          domain: domain,
          favicon: domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : '',
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
          poolSize: results.length,
          similarQueriesUsed: similarQueries,
          totalResults: formattedResults.length,
          timeTakenMs,
          timestamp: new Date().toISOString()
        },
        results: formattedResults
      });
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log(`[SearchController] Top results search aborted for query: "${query}"`);
        if (!res.writableEnded) {
          return res.status(499).json({
            success: false,
            error: 'Request aborted by user'
          });
        }
        return;
      }
      console.error('Top results controller error:', error);
      const isRateLimit = error.message.includes('429') || error.message.includes('CAPTCHA');
      const statusCode = isRateLimit ? 429 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Main handler for searches. Defaulting to a comprehensive "Similar Search" 
   * which executes 5 parallel queries. Also defaults to generating keywords 
   * and an AI summary.
   */
  async handleSearch(req, res) {
    const startTime = Date.now();
    
    // Support query in param, q, or query query-string parameters
    const query = req.query.q || req.query.query || req.params.query;
    const sessionId = req.query.sessionId || req.query.session_id || req.body?.sessionId;
    
    // Default engine is 'duckduckgo' (primary)
    const engine = (req.query.engine || 'duckduckgo').toLowerCase();

    // AI summary, Keywords, Similar Search, and Ranking are now active by default, 
    // unless explicitly set to 'false' in the query string.
    const summarize = req.query.summarize !== 'false';
    const includeKeywords = req.query.keywords !== 'false';
    const useSimilar = req.query.similar !== 'false';
    const useRanking = req.query.rank !== 'false';

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" or "query" (or route parameter) is required.'
      });
    }

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        console.log(`[SearchController] Client disconnected. Aborting search for: "${query}"`);
        abortController.abort();
      }
    });
    const signal = abortController.signal;

    // Load or initialize MongoDB session
    let session = null;
    if (sessionId) {
      try {
        session = await Session.findById(sessionId);
        if (!session) {
          session = new Session({ _id: sessionId });
          await session.save();
        }
      } catch (e) {
        // Fallback for custom or invalid ObjectId strings
        session = new Session();
        await session.save();
      }
    }

    try {
      if (signal?.aborted) throw new Error('Search aborted by user');

      // Persist user query message
      if (session) {
        const userMsg = new Message({
          sessionId: session._id,
          role: 'user',
          content: query
        });
        await userMsg.save();
      }

      // Run keywords generation concurrently if requested
      const keywordsPromise = includeKeywords 
        ? keywordService.generateKeywords(query, { signal }) 
        : Promise.resolve(null);

      let results = [];
      let similarQueries = null;

      if (useSimilar) {
        console.log(`Executing default Similar Search for: "${query}" using ${engine}...`);
        const similarData = await similarSearchService.searchSimilar(query, engine, { signal });
        results = similarData.results;
        similarQueries = similarData.similarQueries;
      } else {
        if (engine === 'google') {
          results = await googleService.search(query, { signal });
        } else if (engine === 'duckduckgo' || engine === 'ddg') {
          results = await duckduckgoService.search(query, { signal });
        } else {
          return res.status(400).json({
            success: false,
            error: `Unsupported search engine: "${engine}". Use "duckduckgo" or "google".`
          });
        }
      }

      if (signal?.aborted) throw new Error('Search aborted by user');

      // Apply LLM ranking and filtering if enabled (default)
      if (useRanking && results.length > 0) {
        results = await rankingService.rankResults(query, results, { signal });
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
          relevanceScore: useRanking ? 'Top Result' : undefined,
          title: item.title,
          url: item.url,
          domain: domain,
          favicon: domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : '',
          snippet: item.snippet,
          matchedQuery: item.matchedQuery || undefined, // Only present in similar search
          source: engine === 'ddg' ? 'duckduckgo' : engine
        };
      });

      if (signal?.aborted) throw new Error('Search aborted by user');

      // Fetch keywords and generate LLM summary concurrently if possible
      const [keywords, summary] = await Promise.all([
        keywordsPromise,
        (summarize && formattedResults.length > 0) 
          ? llmService.generateSummary(query, formattedResults, { signal }) 
          : Promise.resolve(null)
      ]);

      if (signal?.aborted) throw new Error('Search aborted by user');

      // Persist assistant message and perform LLM title generation
      if (session) {
        const assistantMsg = new Message({
          sessionId: session._id,
          role: 'assistant',
          content: summary || "Synthesis successfully integrated. Review the structural pillars below.",
          results: formattedResults,
          keywords: keywords || []
        });
        await assistantMsg.save();

        // If this is the first exchange (user + assistant = 2 messages), generate session title using LLM
        const messageCount = await Message.countDocuments({ sessionId: session._id });
        if (messageCount <= 2) {
          try {
            const generatedTitle = await llmService.generateTitle(query, { signal });
            session.title = generatedTitle;
          } catch (err) {
            console.error('LLM Title generation failed:', err);
          }
        }
        
        // Touch updatedAt timestamp
        session.updatedAt = Date.now();
        await session.save();
      }

      const timeTakenMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        meta: {
          query,
          engine: engine === 'ddg' ? 'duckduckgo' : engine,
          similarQueries: similarQueries || undefined,
          totalResults: formattedResults.length,
          timeTakenMs,
          timestamp: new Date().toISOString(),
          keywords: keywords || undefined,
          sessionId: session ? session._id : undefined,
          sessionTitle: session ? session.title : undefined
        },
        summary: summary, // Always returned (either the summary string or null)
        results: formattedResults
      });
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log(`[SearchController] Search aborted for query: "${query}"`);
        if (!res.writableEnded) {
          return res.status(499).json({
            success: false,
            error: 'Request aborted by user'
          });
        }
        return;
      }
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

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        console.log(`[SearchController] Client disconnected. Aborting similar search for: "${query}"`);
        abortController.abort();
      }
    });
    const signal = abortController.signal;

    try {
      const { similarQueries, results } = await similarSearchService.searchSimilar(query, engine, { signal });

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
          domain: domain,
          favicon: domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : '',
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
      if (signal?.aborted || error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log(`[SearchController] Similar search aborted for query: "${query}"`);
        if (!res.writableEnded) {
          return res.status(499).json({
            success: false,
            error: 'Request aborted by user'
          });
        }
        return;
      }
      console.error('Similar search controller error:', error);
      const isRateLimit = error.message.includes('429') || error.message.includes('CAPTCHA');
      const statusCode = isRateLimit ? 429 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handler for Google Maps scraping and lead extraction.
   * POST /api/search/maps
   */
  async handleMapsSearch(req, res) {
    const startTime = Date.now();
    const { query, minLat, minLng, maxLat, maxLng, limit, sessionId } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "query" is required.'
      });
    }
    if (minLat === undefined || minLng === undefined || maxLat === undefined || maxLng === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Bounding box coordinates (minLat, minLng, maxLat, maxLng) are required.'
      });
    }

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        console.log(`[SearchController] Client disconnected. Aborting maps search for: "${query}"`);
        abortController.abort();
      }
    });
    const signal = abortController.signal;

    const scrapeLimit = parseInt(limit) || 15;

    // Load or initialize MongoDB session
    let session = null;
    if (sessionId) {
      const Session = require('../models/Session');
      try {
        session = await Session.findById(sessionId);
        if (!session) {
          session = new Session({ _id: sessionId });
          await session.save();
        }
      } catch (e) {
        session = new Session();
        await session.save();
      }
    }

    try {
      if (signal?.aborted) throw new Error('Maps scraping aborted by user');

      const Message = require('../models/Message');
      
      // 1. Persist user query message
      if (session) {
        const userMsg = new Message({
          sessionId: session._id,
          role: 'user',
          content: `Maps scrape for "${query}" inside selected area.`
        });
        await userMsg.save();
      }

      // 2. Perform maps scraping
      console.log(`[MapsController] Starting scrape for query: "${query}" in bbox: [${minLat}, ${minLng}, ${maxLat}, ${maxLng}]`);
      const mapsScraperService = require('../services/mapsScraperService');
      const results = await mapsScraperService.scrapeMaps(query, minLat, minLng, maxLat, maxLng, scrapeLimit, { signal });

      if (signal?.aborted) throw new Error('Maps scraping aborted by user');

      // 3. Format message content response
      let summaryText = `I have successfully identified ${results.length} business listings matching "${query}" in the specified area. The contact details, ratings, and websites are compiled in the table below.`;
      
      if (results.length === 0) {
        summaryText = `No business listings matching "${query}" were found in the selected map area. Please try expanding the search boundary or modifying the search terms.`;
      }

      // 4. Persist assistant message in database
      if (session) {
        const assistantMsg = new Message({
          sessionId: session._id,
          role: 'assistant',
          content: summaryText,
          results: results,
          keywords: [query, 'google-maps', 'leads']
        });
        await assistantMsg.save();

        // Generate session title if first exchange
        const messageCount = await Message.countDocuments({ sessionId: session._id });
        if (messageCount <= 2) {
          session.title = `Maps: ${query}`;
        }
        session.updatedAt = Date.now();
        await session.save();
      }

      const timeTakenMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        meta: {
          query,
          bbox: { minLat, minLng, maxLat, maxLng },
          totalResults: results.length,
          timeTakenMs,
          timestamp: new Date().toISOString(),
          sessionId: session ? session._id : undefined,
          sessionTitle: session ? session.title : undefined
        },
        summary: summaryText,
        results: results
      });

    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log(`[SearchController] Maps search aborted for query: "${query}"`);
        if (!res.writableEnded) {
          return res.status(499).json({
            success: false,
            error: 'Request aborted by user'
          });
        }
        return;
      }
      console.error('Maps search controller error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SearchController();
