const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.post('/', sessionController.createSession);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSessionDetails);
router.put('/:id', sessionController.renameSession);
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
