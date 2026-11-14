const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { optionalAuthMiddleware } = require('../middleware/auth');

// Analytics dashboard metrics & trend charts
router.get('/', optionalAuthMiddleware, analyticsController.getAnalytics);

module.exports = router;
