require('dotenv').config();
const express = require('express');
const cors = require('cors');
const searchRouter = require('./src/routes/search');
const browserService = require('./src/services/browserService');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON payloads
app.use(express.json());

// Simple Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
// Supporting both /api/search and direct /search contexts
app.use('/api/search', searchRouter);
app.use('/search', searchRouter);

// Health check endpoint
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    browserInitialized: !!(browserService.browser && browserService.browser.connected)
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found. Try GET /search/q?query=hello'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled internal server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error: ' + err.message
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Search Scraper Service listening on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(` - GET http://localhost:${PORT}/search/q?query=<term>`);
  console.log(` - GET http://localhost:${PORT}/search/q/<term>`);
  console.log(` - GET http://localhost:${PORT}/search/summary?query=<term>`);
  console.log(` - GET http://localhost:${PORT}/search/keywords?q=<term>`);
  console.log(` - GET http://localhost:${PORT}/search/similar?query=<term>`);
  console.log(` - GET http://localhost:${PORT}/search/google?q=<term>`);
  console.log(` - GET http://localhost:${PORT}/search/duckduckgo?q=<term>`);
  console.log(` - GET http://localhost:${PORT}/search/google/summary?q=<term>`);
  console.log(` - GET http://localhost:${PORT}/status`);
  console.log(`=========================================`);
});

// Handle graceful shutdown
const handleShutdown = async () => {
  console.log('Shutting down server gracefully...');
  server.close(async () => {
    console.log('Express server closed.');
    try {
      await browserService.closeBrowser();
      console.log('Puppeteer browser instances terminated.');
    } catch (err) {
      console.error('Error closing Puppeteer browser on shutdown:', err);
    }
    process.exit(0);
  });

  // Set timeout fallback
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Force exiting...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
