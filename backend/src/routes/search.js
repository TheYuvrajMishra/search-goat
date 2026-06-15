const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

/**
 * Route: GET /api/search
 * Description: Standard search endpoint (defaults to DuckDuckGo primary)
 */
router.get('/', searchController.handleSearch);

/**
 * Route: GET /api/search/q
 * Description: Query-string search route
 */
router.get('/q', searchController.handleSearch);

/**
 * Route: GET /api/search/q/:query
 * Description: Path-parameter search route
 */
router.get('/q/:query', searchController.handleSearch);

/**
 * Route: GET /api/search/summary
 * Description: Search + AI synthesis summary endpoint (defaults to DDG)
 */
router.get('/summary', searchController.handleSearch);

/**
 * Route: GET /api/search/keywords
 * Description: Dedicated route to generate 5 optimized search keywords from query string
 */
router.get('/keywords', searchController.handleKeywords);

/**
 * Route: GET /api/search/keywords/:query
 * Description: Dedicated route to generate 5 optimized search keywords from path param
 */
router.get('/keywords/:query', searchController.handleKeywords);

/**
 * Route: GET /api/search/similar
 * Description: Dedicated route for parallel search with 5 similar queries from query string
 */
router.get('/similar', searchController.handleSimilarSearch);

/**
 * Route: GET /api/search/similar/:query
 * Description: Dedicated route for parallel search with 5 similar queries from path param
 */
router.get('/similar/:query', searchController.handleSimilarSearch);

/**
 * Route: GET /api/search/google
 * Description: Search endpoint forcing Google
 */
router.get('/google', (req, res, next) => {
  req.query.engine = 'google';
  next();
}, searchController.handleSearch);

/**
 * Route: GET /api/search/google/summary
 * Description: Google search + AI synthesis summary endpoint
 */
router.get('/google/summary', (req, res, next) => {
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

/**
 * Route: GET /api/search/duckduckgo/summary
 * Description: DuckDuckGo search + AI synthesis summary endpoint
 */
router.get('/duckduckgo/summary', (req, res, next) => {
  req.query.engine = 'duckduckgo';
  next();
}, searchController.handleSearch);

module.exports = router;
