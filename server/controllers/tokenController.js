const db = require('../db/jsonDb');

// Helper function to re-index all waiting tokens for a queue (1, 2, 3...)
function reindexWaitingTokens(queueId) {
  const waitingTokens = db
    .findAll('tokens', t => t.queueId === queueId && t.status === 'WAITING')
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  waitingTokens.forEach((tok, idx) => {
    const newPos = idx + 1;
    if (tok.position !== newPos) {
      db.update('tokens', tok.id, { position: newPos });
      tok.position = newPos;
    }
  });

  return waitingTokens;
}

// Requirement #3: Add new person / token into queue
exports.createToken = (req, res) => {
  try {
    const { queueId, personName, personPhone, serviceReason, priority } = req.body;

    if (!queueId) {
      return res.status(400).json({
        success: false,
        message: 'Queue ID is required.'
      });
    }

    if (!personName || !personName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Person name is required to issue a token.'
      });
    }

    const queue = db.findById('queues', queueId);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.'
      });
    }

    if (queue.status === 'paused') {
      return res.status(400).json({
        success: false,
        message: 'This queue is currently paused. Resume it to issue tokens.'
      });
    }

    // Increment token counter
    const nextCounter = (queue.tokenCounter || 100) + 1;
    db.update('queues', queueId, { tokenCounter: nextCounter });

    const prefix = queue.prefix || 'Q';
    const tokenNumber = `${prefix}-${nextCounter}`;

    // Calculate position (bottom of waiting list)
    const existingWaiting = db.findAll(
      'tokens',
      t => t.queueId === queueId && t.status === 'WAITING'
    );
    const position = existingWaiting.length + 1;

    const token = db.insert('tokens', {
      queueId,
      tokenNumber,
      personName: personName.trim(),
      personPhone: personPhone ? personPhone.trim() : '',
      serviceReason: serviceReason ? serviceReason.trim() : 'General Service',
      priority: priority === 'vip' ? 'vip' : 'normal',
      status: 'WAITING', // 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED'
      position,
      createdAt: new Date().toISOString(),
      serviceStartedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      createdBy: req.user ? req.user.email : 'Manager'
    });

    db.logActivity(queueId, 'TOKEN_CREATED', {
      tokenNumber,
      personName: token.personName,
      position
    });

    return res.status(201).json({
      success: true,
      message: `Token ${tokenNumber} created for ${token.personName} at position #${position}.`,
      token
    });
  } catch (err) {
    console.error('Create token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error creating token.'
    });
  }
};

// Requirement #4: Display list of waiting tokens
exports.getTokens = (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.query;

    const queue = db.findById('queues', queueId);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.'
      });
    }

    let tokens = db.findAll('tokens', t => t.queueId === queueId);

    if (status) {
      tokens = tokens.filter(t => t.status === status.toUpperCase());
    }

    // Sort waiting tokens by position, others by createdAt desc
    const waitingTokens = tokens
      .filter(t => t.status === 'WAITING')
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const inServiceToken = tokens.find(t => t.status === 'IN_SERVICE') || null;
    const completedTokens = tokens
      .filter(t => t.status === 'COMPLETED')
      .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
    const cancelledTokens = tokens
      .filter(t => t.status === 'CANCELLED')
      .sort((a, b) => new Date(b.cancelledAt || b.createdAt) - new Date(a.cancelledAt || a.createdAt));

    return res.json({
      success: true,
      queueName: queue.name,
      inServiceToken,
      waitingTokens,
      completedTokens,
      cancelledTokens,
      totalWaiting: waitingTokens.length,
      totalCount: tokens.length
    });
  } catch (err) {
    console.error('Get tokens error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching tokens.'
    });
  }
};

// Requirement #5: Move tokens UP and DOWN in the queue
exports.moveToken = (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' | 'down'

    if (!direction || !['up', 'down'].includes(direction.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid direction. Must be "up" or "down".'
      });
    }

    const currentToken = db.findById('tokens', id);
    if (!currentToken) {
      return res.status(404).json({
        success: false,
        message: 'Token not found.'
      });
    }

    if (currentToken.status !== 'WAITING') {
      return res.status(400).json({
        success: false,
        message: `Only WAITING tokens can be reordered. Current status: ${currentToken.status}`
      });
    }

    // Get all waiting tokens for this queue, sorted by position
    const waitingList = db
      .findAll('tokens', t => t.queueId === currentToken.queueId && t.status === 'WAITING')
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    // Ensure positions are continuous 1..N
    waitingList.forEach((tok, idx) => {
      tok.position = idx + 1;
    });

    const currentIndex = waitingList.findIndex(t => t.id === id);
    if (currentIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Token not found in active waiting list.'
      });
    }

    let targetIndex = -1;
    if (direction.toLowerCase() === 'up') {
      if (currentIndex === 0) {
        return res.status(400).json({
          success: false,
          message: 'Token is already at the top of the queue (#1).'
        });
      }
      targetIndex = currentIndex - 1;
    } else {
      if (currentIndex === waitingList.length - 1) {
        return res.status(400).json({
          success: false,
          message: 'Token is already at the bottom of the queue.'
        });
      }
      targetIndex = currentIndex + 1;
    }

    const targetToken = waitingList[targetIndex];

    // Swap positions
    const tempPos = currentToken.position;
    currentToken.position = targetToken.position;
    targetToken.position = tempPos;

    // Persist swapped positions to database
    db.update('tokens', currentToken.id, { position: currentToken.position });
    db.update('tokens', targetToken.id, { position: targetToken.position });

    // Clean re-index to prevent any holes
    const updatedWaitingList = reindexWaitingTokens(currentToken.queueId);

    db.logActivity(currentToken.queueId, 'TOKEN_MOVED', {
      tokenNumber: currentToken.tokenNumber,
      direction,
      newPosition: currentToken.position
    });

    return res.json({
      success: true,
      message: `Token ${currentToken.tokenNumber} moved ${direction} to position #${currentToken.position}.`,
      waitingTokens: updatedWaitingList,
      movedToken: db.findById('tokens', currentToken.id)
    });
  } catch (err) {
    console.error('Move token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error moving token.'
    });
  }
};

// Requirement #6: Assign top token of queue for service [With a simple button click]
exports.callNextToken = (req, res) => {
  try {
    const { queueId } = req.params;

    const queue = db.findById('queues', queueId);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.'
      });
    }

    // Find all waiting tokens sorted by position
    const waitingTokens = db
      .findAll('tokens', t => t.queueId === queueId && t.status === 'WAITING')
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    if (waitingTokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No tokens are currently waiting in this queue.'
      });
    }

    // Top token of the queue
    const topToken = waitingTokens[0];

    // Check if there is already a token in service
    const currentlyServing = db.findOne(
      'tokens',
      t => t.queueId === queueId && t.status === 'IN_SERVICE'
    );

    // If there is an active token in service, mark it completed before serving the next
    if (currentlyServing) {
      db.update('tokens', currentlyServing.id, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      });
      db.logActivity(queueId, 'TOKEN_COMPLETED_AUTO', {
        tokenNumber: currentlyServing.tokenNumber
      });
    }

    // Transition top token to IN_SERVICE
    const assignedToken = db.update('tokens', topToken.id, {
      status: 'IN_SERVICE',
      serviceStartedAt: new Date().toISOString(),
      position: null
    });

    // Update queue's current serving token
    db.update('queues', queueId, {
      currentServingTokenId: assignedToken.id
    });

    // Re-index remaining waiting tokens
    const remainingWaiting = reindexWaitingTokens(queueId);

    db.logActivity(queueId, 'TOKEN_CALLED_FOR_SERVICE', {
      tokenNumber: assignedToken.tokenNumber,
      personName: assignedToken.personName
    });

    return res.json({
      success: true,
      message: `Token ${assignedToken.tokenNumber} (${assignedToken.personName}) is now being served!`,
      inServiceToken: assignedToken,
      waitingTokens: remainingWaiting
    });
  } catch (err) {
    console.error('Call next token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error assigning next token.'
    });
  }
};

// Mark current serving token as COMPLETED
exports.completeToken = (req, res) => {
  try {
    const { id } = req.params;
    const token = db.findById('tokens', id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found.'
      });
    }

    if (token.status !== 'IN_SERVICE') {
      return res.status(400).json({
        success: false,
        message: `Token must be IN_SERVICE to mark as completed. Current status: ${token.status}`
      });
    }

    const completedToken = db.update('tokens', id, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      position: null
    });

    // Clear currentServingTokenId if this was the serving token
    const queue = db.findById('queues', token.queueId);
    if (queue && queue.currentServingTokenId === id) {
      db.update('queues', token.queueId, { currentServingTokenId: null });
    }

    db.logActivity(token.queueId, 'TOKEN_COMPLETED', {
      tokenNumber: completedToken.tokenNumber,
      personName: completedToken.personName
    });

    return res.json({
      success: true,
      message: `Token ${completedToken.tokenNumber} marked as completed.`,
      token: completedToken
    });
  } catch (err) {
    console.error('Complete token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error completing token.'
    });
  }
};

// Requirement #7: Cancel a token from the queue
exports.cancelToken = (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const token = db.findById('tokens', id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found.'
      });
    }

    if (token.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a token that has already been completed.'
      });
    }

    if (token.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This token is already cancelled.'
      });
    }

    const wasWaiting = token.status === 'WAITING';
    const wasServing = token.status === 'IN_SERVICE';

    const cancelledToken = db.update('tokens', id, {
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason ? reason.trim() : 'Cancelled by Queue Manager',
      position: null
    });

    // If it was serving, clear the serving slot on the queue
    if (wasServing) {
      const queue = db.findById('queues', token.queueId);
      if (queue && queue.currentServingTokenId === id) {
        db.update('queues', token.queueId, { currentServingTokenId: null });
      }
    }

    // If it was waiting, reindex the remaining tokens
    let remainingWaiting = [];
    if (wasWaiting) {
      remainingWaiting = reindexWaitingTokens(token.queueId);
    } else {
      remainingWaiting = db
        .findAll('tokens', t => t.queueId === token.queueId && t.status === 'WAITING')
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    }

    db.logActivity(token.queueId, 'TOKEN_CANCELLED', {
      tokenNumber: cancelledToken.tokenNumber,
      personName: cancelledToken.personName,
      reason: cancelledToken.cancellationReason
    });

    return res.json({
      success: true,
      message: `Token ${cancelledToken.tokenNumber} has been cancelled.`,
      cancelledToken,
      waitingTokens: remainingWaiting
    });
  } catch (err) {
    console.error('Cancel token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error cancelling token.'
    });
  }
};
