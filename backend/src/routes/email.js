const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

/**
 * Route: GET /api/email/context
 * Description: Reads the contents of email_context.md.
 */
router.get('/context', emailController.handleGetContext);

/**
 * Route: POST /api/email/context
 * Description: Overwrites the contents of email_context.md.
 */
router.post('/context', emailController.handleSaveContext);

/**
 * Route: POST /api/email/generate
 * Description: Searches target companies and uses LLM to synthesize cold emails.
 */
router.post('/generate', emailController.handleGenerateEmails);

module.exports = router;
