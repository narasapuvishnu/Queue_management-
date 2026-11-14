const db = require('../db/jsonDb');

// Helper to generate a 2-4 letter uppercase prefix from queue name
function generatePrefix(name) {
  if (!name) return 'Q';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const clean = name.replace(/[^a-zA-Z]/g, '');
  return (clean.substring(0, 3) || 'Q').toUpperCase();
}

// Create a new Queue (Requirements #1 & #2)
exports.createQueue = (req, res) => {
  try {
    const { name, description, prefix, department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Queue name is required.'
      });
    }

    const trimmedName = name.trim();
    const cleanPrefix = (prefix && prefix.trim().toUpperCase()) || generatePrefix(trimmedName);

    const newQueue = db.insert('queues', {
      managerId: req.user.id,
      name: trimmedName,
      description: description ? description.trim() : '',
      prefix: cleanPrefix,
      department: department ? department.trim() : 'General',
      status: 'active', // 'active' | 'paused'
      tokenCounter: 100, // starting sequence for tokens: 101, 102, ...
      currentServingTokenId: null
    });

    db.logActivity(newQueue.id, 'QUEUE_CREATED', {
      queueName: newQueue.name,
      createdBy: req.user.email
    });

    return res.status(201).json({
      success: true,
      message: `Queue "${newQueue.name}" created successfully.`,
      queue: newQueue
    });
  } catch (err) {
    console.error('Create queue error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error creating queue.'
    });
  }
};

// Get all queues with real-time statistics
exports.getQueues = (req, res) => {
  try {
    const allQueues = db.findAll('queues');
    const allTokens = db.findAll('tokens');

    // Enrich each queue with live stats
    const enrichedQueues = allQueues.map(queue => {
      const queueTokens = allTokens.filter(t => t.queueId === queue.id);
      const waitingTokens = queueTokens
        .filter(t => t.status === 'WAITING')
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      const inServiceToken = queueTokens.find(t => t.status === 'IN_SERVICE') || null;
      const completedTokens = queueTokens.filter(t => t.status === 'COMPLETED');
      const cancelledTokens = queueTokens.filter(t => t.status === 'CANCELLED');

      // Calculate average wait time for completed tokens today
      let totalWaitMs = 0;
      let waitCount = 0;
      completedTokens.forEach(t => {
        if (t.serviceStartedAt && t.createdAt) {
          const wait = new Date(t.serviceStartedAt) - new Date(t.createdAt);
          if (wait > 0) {
            totalWaitMs += wait;
            waitCount++;
          }
        }
      });
      const avgWaitMinutes = waitCount > 0 ? Math.round(totalWaitMs / waitCount / 60000) : 0;

      return {
        ...queue,
        waitingCount: waitingTokens.length,
        inServiceCount: inServiceToken ? 1 : 0,
        completedCount: completedTokens.length,
        cancelledCount: cancelledTokens.length,
        totalTokens: queueTokens.length,
        avgWaitMinutes,
        currentServingToken: inServiceToken,
        nextInLineToken: waitingTokens[0] || null
      };
    });

    return res.json({
      success: true,
      queues: enrichedQueues
    });
  } catch (err) {
    console.error('Get queues error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching queues.'
    });
  }
};

// Get single queue by ID with full token roster
exports.getQueueById = (req, res) => {
  try {
    const { id } = req.params;
    const queue = db.findById('queues', id);

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.'
      });
    }

    const allTokens = db.findAll('tokens', t => t.queueId === id);
    const waitingTokens = allTokens
      .filter(t => t.status === 'WAITING')
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const inServiceToken = allTokens.find(t => t.status === 'IN_SERVICE') || null;
    const completedTokens = allTokens.filter(t => t.status === 'COMPLETED');
    const cancelledTokens = allTokens.filter(t => t.status === 'CANCELLED');

    return res.json({
      success: true,
      queue: {
        ...queue,
        waitingTokens,
        inServiceToken,
        waitingCount: waitingTokens.length,
        completedCount: completedTokens.length,
        cancelledCount: cancelledTokens.length,
        totalCount: allTokens.length
      }
    });
  } catch (err) {
    console.error('Get queue by id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching queue.'
    });
  }
};

// Update Queue (Rename, update description, pause/resume)
exports.updateQueue = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, prefix, department, status } = req.body;

    const queue = db.findById('queues', id);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.'
      });
    }

    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (prefix && prefix.trim()) updates.prefix = prefix.trim().toUpperCase();
    if (department !== undefined) updates.department = department.trim();
    if (status && ['active', 'paused'].includes(status)) updates.status = status;

    const updatedQueue = db.update('queues', id, updates);

    db.logActivity(id, 'QUEUE_UPDATED', {
      updates,
      updatedBy: req.user.email
    });

    return res.json({
      success: true,
      message: 'Queue updated successfully.',
      queue: updatedQueue
    });
  } catch (err) {
    console.error('Update queue error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating queue.'
    });
  }
};

// Delete Queue and cascade delete its tokens
exports.deleteQueue = (req, res) => {
  try {
    const { id } = req.params;
    const queue = db.findById('queues', id);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.'
      });
    }

    // Delete associated tokens
    db.deleteWhere('tokens', t => t.queueId === id);
    db.delete('queues', id);

    db.logActivity(id, 'QUEUE_DELETED', {
      queueName: queue.name,
      deletedBy: req.user.email
    });

    return res.json({
      success: true,
      message: `Queue "${queue.name}" and all its tokens were deleted.`
    });
  } catch (err) {
    console.error('Delete queue error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error deleting queue.'
    });
  }
};
