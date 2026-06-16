const reportService = require('../services/reportService');

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
}

module.exports = new ReportController();
