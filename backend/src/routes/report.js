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

module.exports = router;
