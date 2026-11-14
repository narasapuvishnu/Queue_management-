const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// Public or optionally authed routes (e.g. for customer display screen or kiosk)
router.get('/', optionalAuthMiddleware, queueController.getQueues);
router.get('/:id', optionalAuthMiddleware, queueController.getQueueById);

// Manager-protected routes
router.post('/', authMiddleware, queueController.createQueue);
router.put('/:id', authMiddleware, queueController.updateQueue);
router.delete('/:id', authMiddleware, queueController.deleteQueue);

module.exports = router;
