const reportService = require('../services/reportService');
const llmService = require('../services/llmService');
const Message = require('../models/Message');

class ReportController {
  /**
   * Generates a detailed scraped report for a queried topic without using LLM/AI.
   * Finds the top 3-5 sources based on relevancy and reputation, then scrapes them.
   */
  async handleGenerateReport(req, res) {
    const startTime = Date.now();
    const query = req.query.q || req.query.query || req.params.query;
    const engine = (req.query.engine || 'duckduckgo').toLowerCase();
    
    // Parse limit parameter: must be between 3 and 5 (default: 3)
    let limit = 3;
    if (req.query.limit) {
      const parsedLimit = parseInt(req.query.limit, 10);
      if (!isNaN(parsedLimit)) {
        limit = Math.max(3, Math.min(5, parsedLimit));
      }
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" or "query" (or route parameter) is required.'
      });
    }

    try {
      const report = await reportService.generateReport(query, { engine, limit });
      const timeTakenMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        meta: {
          timeTakenMs,
          timestamp: new Date().toISOString()
        },
        report
      });
    } catch (error) {
      console.error('Report controller error:', error);
      const isRateLimit = error.message.includes('429') || error.message.includes('CAPTCHA');
      const statusCode = isRateLimit ? 429 : 500;

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generates a deep summary report for a specific message's search results.
   */
  async handleGenerateReportFromMessage(req, res) {
    const startTime = Date.now();
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "messageId" is required.'
      });
    }

    try {
      // 1. Fetch message from DB
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found.'
        });
      }

      // If report already generated, return it
      if (message.report) {
        return res.status(200).json({
          success: true,
          meta: {
            cached: true,
            timeTakenMs: Date.now() - startTime,
            timestamp: new Date().toISOString()
          },
          report: message.report
        });
      }

      const results = message.results;
      if (!results || results.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No search results associated with this message to scrape.'
        });
      }

      // 2. Scrape results' domains (limit to top 5)
      const sourcesToScrape = results.slice(0, 5);
      console.log(`[ReportController] Scraping ${sourcesToScrape.length} sources for message ${messageId}...`);
      
      const scrapedResults = await reportService.scrapeSources(sourcesToScrape);

      // 3. Generate summary report using LLM
      console.log(`[ReportController] Generating AI summary report for message ${messageId}...`);
      const report = await llmService.generateDeepReport(message.content, scrapedResults);

      // 4. Save report in DB
      message.report = report;
      await message.save();

      const timeTakenMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        meta: {
          cached: false,
          timeTakenMs,
          timestamp: new Date().toISOString()
        },
        report
      });
    } catch (error) {
      console.error('Report controller message error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate deep report: ' + error.message
      });
    }
  }
}

module.exports = new ReportController();
