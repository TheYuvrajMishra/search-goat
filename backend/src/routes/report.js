const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

/**
   * Route: GET /api/report
   * Description: Returns detailed report using Google/DuckDuckGo search and Puppeteer scraping.
   */
router.get('/', reportController.handleGenerateReport);

/**
   * Route: GET /api/report/:query
   * Description: Path parameter report generation route.
   */
router.get('/:query', reportController.handleGenerateReport);

/**
   * Route: POST /api/report/generate
   * Description: Generates a deep summary report for a specific message's search results using Puppeteer and LLM synthesis.
   */
router.post('/generate', reportController.handleGenerateReportFromMessage);

module.exports = router;
