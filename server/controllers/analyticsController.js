const db = require('../db/jsonDb');

exports.getAnalytics = (req, res) => {
  try {
    const { queueId, timeRange } = req.query; // timeRange: 'today' | 'week' | 'all'

    let queues = db.findAll('queues');
    let tokens = db.findAll('tokens');

    if (queueId && queueId !== 'all') {
      queues = queues.filter(q => q.id === queueId);
      tokens = tokens.filter(t => t.queueId === queueId);
    }

    const now = new Date();
    if (timeRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      tokens = tokens.filter(t => new Date(t.createdAt).getTime() >= startOfDay);
    } else if (timeRange === 'week') {
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      tokens = tokens.filter(t => new Date(t.createdAt).getTime() >= sevenDaysAgo);
    }

    // 1. KPI Counts
    const totalTokens = tokens.length;
    const waitingTokens = tokens.filter(t => t.status === 'WAITING');
    const inServiceTokens = tokens.filter(t => t.status === 'IN_SERVICE');
    const completedTokens = tokens.filter(t => t.status === 'COMPLETED');
    const cancelledTokens = tokens.filter(t => t.status === 'CANCELLED');

    const totalWaiting = waitingTokens.length;
    const totalInService = inServiceTokens.length;
    const totalCompleted = completedTokens.length;
    const totalCancelled = cancelledTokens.length;

    // 2. Wait Time Calculations (createdAt to serviceStartedAt)
    const waitTimesMinutes = [];
    tokens.forEach(t => {
      if (t.serviceStartedAt && t.createdAt) {
        const waitMs = new Date(t.serviceStartedAt) - new Date(t.createdAt);
        if (waitMs >= 0) {
          waitTimesMinutes.push(waitMs / 60000);
        }
      }
    });

    const avgWaitMinutes =
      waitTimesMinutes.length > 0
        ? Number((waitTimesMinutes.reduce((a, b) => a + b, 0) / waitTimesMinutes.length).toFixed(1))
        : 0;

    const maxWaitMinutes =
      waitTimesMinutes.length > 0
        ? Number(Math.max(...waitTimesMinutes).toFixed(1))
        : 0;

    // 3. Service Time Calculations (serviceStartedAt to completedAt)
    const serviceTimesMinutes = [];
    completedTokens.forEach(t => {
      if (t.serviceStartedAt && t.completedAt) {
        const servMs = new Date(t.completedAt) - new Date(t.serviceStartedAt);
        if (servMs >= 0) {
          serviceTimesMinutes.push(servMs / 60000);
        }
      }
    });

    const avgServiceMinutes =
      serviceTimesMinutes.length > 0
        ? Number((serviceTimesMinutes.reduce((a, b) => a + b, 0) / serviceTimesMinutes.length).toFixed(1))
        : 0;

    // 4. Hourly Queue Flow Trends (Hours: 08:00 to 20:00)
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const hourlyCreated = new Array(hours.length).fill(0);
    const hourlyServed = new Array(hours.length).fill(0);
    const hourlyWaitTimes = new Array(hours.length).fill(0);
    const hourlyWaitCounts = new Array(hours.length).fill(0);

    tokens.forEach(t => {
      if (t.createdAt) {
        const hour = new Date(t.createdAt).getHours();
        const hourIndex = hour - 8;
        if (hourIndex >= 0 && hourIndex < hours.length) {
          hourlyCreated[hourIndex]++;
        }
      }

      if (t.serviceStartedAt) {
        const hour = new Date(t.serviceStartedAt).getHours();
        const hourIndex = hour - 8;
        if (hourIndex >= 0 && hourIndex < hours.length) {
          hourlyServed[hourIndex]++;
          const waitMs = new Date(t.serviceStartedAt) - new Date(t.createdAt);
          if (waitMs >= 0) {
            hourlyWaitTimes[hourIndex] += waitMs / 60000;
            hourlyWaitCounts[hourIndex]++;
          }
        }
      }
    });

    const hourlyAvgWait = hourlyWaitCounts.map((count, i) =>
      count > 0 ? Number((hourlyWaitTimes[i] / count).toFixed(1)) : 0
    );

    // 5. Status Breakdown
    const statusDistribution = {
      waiting: totalWaiting,
      inService: totalInService,
      completed: totalCompleted,
      cancelled: totalCancelled
    };

    // 6. Wait Time Buckets (Distribution histogram)
    const waitBuckets = {
      '0-5 min': 0,
      '5-15 min': 0,
      '15-30 min': 0,
      '30+ min': 0
    };

    waitTimesMinutes.forEach(mins => {
      if (mins <= 5) waitBuckets['0-5 min']++;
      else if (mins <= 15) waitBuckets['5-15 min']++;
      else if (mins <= 30) waitBuckets['15-30 min']++;
      else waitBuckets['30+ min']++;
    });

    // 7. Per-Queue Performance Comparison
    const queueComparison = queues.map(q => {
      const qTokens = tokens.filter(t => t.queueId === q.id);
      const qCompleted = qTokens.filter(t => t.status === 'COMPLETED');
      const qWaiting = qTokens.filter(t => t.status === 'WAITING');

      let qWaitTotal = 0;
      let qWaitCount = 0;
      qTokens.forEach(t => {
        if (t.serviceStartedAt && t.createdAt) {
          const ms = new Date(t.serviceStartedAt) - new Date(t.createdAt);
          if (ms >= 0) {
            qWaitTotal += ms;
            qWaitCount++;
          }
        }
      });

      return {
        id: q.id,
        name: q.name,
        prefix: q.prefix,
        department: q.department,
        total: qTokens.length,
        waiting: qWaiting.length,
        completed: qCompleted.length,
        avgWaitMinutes: qWaitCount > 0 ? Number((qWaitTotal / qWaitCount / 60000).toFixed(1)) : 0
      };
    });

    // 8. Recent Activity Logs
    const recentLogs = db
      .findAll('activity_logs')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15);

    return res.json({
      success: true,
      timeRange: timeRange || 'all',
      kpis: {
        totalTokens,
        totalWaiting,
        totalInService,
        totalCompleted,
        totalCancelled,
        avgWaitMinutes,
        maxWaitMinutes,
        avgServiceMinutes,
        completionRate:
          totalTokens > 0 ? Number(((totalCompleted / totalTokens) * 100).toFixed(1)) : 0,
        cancellationRate:
          totalTokens > 0 ? Number(((totalCancelled / totalTokens) * 100).toFixed(1)) : 0
      },
      trends: {
        hours,
        tokensArrived: hourlyCreated,
        tokensServed: hourlyServed,
        avgWaitByHour: hourlyAvgWait
      },
      statusDistribution,
      waitBuckets,
      queueComparison,
      recentLogs
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error calculating analytics.'
    });
  }
};
