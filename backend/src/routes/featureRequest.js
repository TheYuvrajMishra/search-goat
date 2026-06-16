const express = require('express');
const router = express.Router();
const featureRequestController = require('../controllers/featureRequestController');

router.post('/', featureRequestController.createFeatureRequest);
router.get('/', featureRequestController.getFeatureRequests);

module.exports = router;
