const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

/**
 * Route: GET /api/search
 * Description: Standard search endpoint (defaults to DuckDuckGo primary)
 * Query parameters: 
 *   - q or query (required): The search terms
 *   - engine (optional): "duckduckgo" or "google" (default: "duckduckgo")
 */
router.get('/', searchController.handleSearch);

/**
 * Route: GET /api/search/q
 * Description: Query-string search route (defaults to DuckDuckGo primary)
 * Query parameters:
 *   - query or q (required): The search terms
 *   - engine (optional): "duckduckgo" or "google" (default: "duckduckgo")
 */
router.get('/q', searchController.handleSearch);

/**
 * Route: GET /api/search/q/:query
 * Description: Path-parameter search route (defaults to DuckDuckGo primary)
 */
router.get('/q/:query', searchController.handleSearch);

/**
 * Route: GET /api/search/google
 * Description: Search endpoint forcing Google
 */
router.get('/google', (req, res, next) => {
  req.query.engine = 'google';
  next();
}, searchController.handleSearch);

/**
 * Route: GET /api/search/duckduckgo
 * Description: Search endpoint forcing DuckDuckGo
 */
router.get('/duckduckgo', (req, res, next) => {
  req.query.engine = 'duckduckgo';
  next();
}, searchController.handleSearch);

module.exports = router;
