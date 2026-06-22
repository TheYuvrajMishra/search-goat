const emailService = require('../services/emailService');

class EmailController {
  /**
   * Retrieves the current cold email context contents.
   * GET /api/email/context
   */
  async handleGetContext(req, res) {
    try {
      const content = await emailService.readContext();
      return res.status(200).json({
        success: true,
        content
      });
    } catch (error) {
      console.error('[EmailController] Error getting context:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve email context: ' + error.message
      });
    }
  }

  /**
   * Updates the cold email context file.
   * POST /api/email/context
   */
  async handleSaveContext(req, res) {
    const { content } = req.body;
    if (content === undefined || content === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing body parameter "content".'
      });
    }

    try {
      await emailService.writeContext(content);
      return res.status(200).json({
        success: true,
        message: 'Email context updated successfully.'
      });
    } catch (error) {
      console.error('[EmailController] Error saving context:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save email context: ' + error.message
      });
    }
  }

  /**
   * Generates cold emails for a single company or multiple companies in bulk.
   * POST /api/email/generate
   */
  async handleGenerateEmails(req, res) {
    const startTime = Date.now();
    let { companies, engine } = req.body;

    if (!companies) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameter "companies". Must be a company name or an array of company names.'
      });
    }

    // Standardize input into an array of names
    if (!Array.isArray(companies)) {
      if (typeof companies === 'string') {
        companies = [companies];
      } else {
        return res.status(400).json({
          success: false,
          error: 'Parameter "companies" must be a string or an array of strings.'
        });
      }
    }

    // Clean names
    const targetCompanies = companies
      .map(c => typeof c === 'string' ? c.trim() : '')
      .filter(c => c.length > 0);

    if (targetCompanies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid company names provided.'
      });
    }

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        console.log(`[EmailController] Client disconnected. Aborting cold email synthesis.`);
        abortController.abort();
      }
    });
    const signal = abortController.signal;
    const searchEngine = (engine || 'duckduckgo').toLowerCase();

    try {
      console.log(`[EmailController] Generating cold emails for ${targetCompanies.length} companies...`);
      const results = await emailService.generateBulkEmails(targetCompanies, { signal, engine: searchEngine });
      const timeTakenMs = Date.now() - startTime;

      if (signal?.aborted) throw new Error('Email generation aborted by user');

      return res.status(200).json({
        success: true,
        meta: {
          companiesCount: targetCompanies.length,
          timeTakenMs,
          timestamp: new Date().toISOString()
        },
        results
      });
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log(`[EmailController] Email synthesis request aborted.`);
        if (!res.writableEnded) {
          return res.status(499).json({
            success: false,
            error: 'Request aborted by user'
          });
        }
        return;
      }

      console.error('[EmailController] Error generating emails:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate cold emails: ' + error.message
      });
    }
  }
}

module.exports = new EmailController();
