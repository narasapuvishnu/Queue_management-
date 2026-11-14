const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// Get tokens for a queue (optional auth so public display board can read waiting list)
router.get('/queue/:queueId', optionalAuthMiddleware, tokenController.getTokens);

// Manager actions (authenticated)
// Requirement #3: Add person / token into queue
router.post('/', authMiddleware, tokenController.createToken);

// Requirement #5: Move tokens UP and DOWN
router.post('/:id/move', authMiddleware, tokenController.moveToken);

// Requirement #6: Assign token at top of queue for service
router.post('/queue/:queueId/call-next', authMiddleware, tokenController.callNextToken);

// Complete active service
router.post('/:id/complete', authMiddleware, tokenController.completeToken);

// Requirement #7: Cancel token from queue
router.post('/:id/cancel', authMiddleware, tokenController.cancelToken);

module.exports = router;
