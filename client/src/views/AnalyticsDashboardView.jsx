import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  Ban,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { api } from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsDashboardView({ queues = [] }) {
  const [selectedQueueId, setSelectedQueueId] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.get(selectedQueueId, timeRange);
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedQueueId, timeRange]);

  // Export data as CSV
  const handleExportCSV = () => {
    if (!analytics || !analytics.queueComparison) return;

    let csv = 'Queue Name,Department,Total Tokens,Waiting,Completed,Avg Wait (Minutes)\n';
    analytics.queueComparison.forEach((q) => {
      csv += `"${q.name}","${q.department || ''}",${q.total},${q.waiting},${q.completed},${q.avgWaitMinutes}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QueueFlow_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Chart 1: Queue Traffic & Flow Trends (Line / Area)
  const trafficChartData = {
    labels: analytics?.trends?.hours || [],
    datasets: [
      {
        label: 'Tokens Arrived (Queue Inflow)',
        data: analytics?.trends?.tokensArrived || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#818cf8'
      },
      {
        label: 'Tokens Served (Completed)',
        data: analytics?.trends?.tokensServed || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#34d399'
      }
    ]
  };

  // Chart 2: Hourly Average Wait Times (Bar)
  const waitTrendChartData = {
    labels: analytics?.trends?.hours || [],
    datasets: [
      {
        label: 'Avg Wait Time (Minutes)',
        data: analytics?.trends?.avgWaitByHour || [],
        backgroundColor: 'rgba(129, 140, 248, 0.75)',
        borderColor: '#818cf8',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // Chart 3: Token Status Breakdown (Doughnut)
  const statusDoughnutData = {
    labels: ['Completed', 'Waiting', 'In Service', 'Cancelled'],
    datasets: [
      {
        data: [
          analytics?.statusDistribution?.completed || 0,
          analytics?.statusDistribution?.waiting || 0,
          analytics?.statusDistribution?.inService || 0,
          analytics?.statusDistribution?.cancelled || 0
        ],
        backgroundColor: ['#10b981', '#6366f1', '#06b6d4', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'system-ui' }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
        beginAtZero: true
      }
    }
  };

  const kpis = analytics?.kpis || {
    totalTokens: 0,
    totalWaiting: 0,
    totalCompleted: 0,
    totalCancelled: 0,
    avgWaitMinutes: 0,
    maxWaitMinutes: 0,
    avgServiceMinutes: 0,
    completionRate: 0,
    cancellationRate: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Queue Analytics & Insights</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics on wait times, queue lengths, customer inflow & operational efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Queue Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-white">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedQueueId}
              onChange={(e) => setSelectedQueueId(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Queues</option>
              {queues.map((q) => (
                <option key={q.id} value={q.id} className="bg-slate-900 text-white">
                  [{q.prefix}] {q.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            {['today', 'week', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === 'all' ? 'All Time' : range === 'today' ? 'Today' : 'Last 7 Days'}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 border border-slate-700/60 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Average Wait Time */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Average Wait Time</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{kpis.avgWaitMinutes}</span>
            <span className="text-xs text-slate-400 font-semibold">minutes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Max Wait: <strong className="text-slate-300">{kpis.maxWaitMinutes}m</strong>
          </p>
        </div>

        {/* KPI 2: Average Service Time */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Avg Service Time</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{kpis.avgServiceMinutes}</span>
            <span className="text-xs text-slate-400 font-semibold">minutes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Time spent per customer consultation
          </p>
        </div>

        {/* KPI 3: Total Issued & Throughput */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Total Tokens Issued</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{kpis.totalTokens}</span>
            <span className="text-xs text-slate-400 font-semibold">tokens</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Currently Waiting: <strong className="text-indigo-400">{kpis.totalWaiting}</strong>
          </p>
        </div>

        {/* KPI 4: Completion Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Completion Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{kpis.completionRate}%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Cancellation Rate: <strong className="text-red-400">{kpis.cancellationRate}%</strong>
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Queue Length & Flow Trends */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Queue Flow & Customer Volume</span>
                <span className="text-xs font-normal text-slate-400">(Hourly Distribution)</span>
              </h3>
              <p className="text-xs text-slate-400">Comparison of arriving customers vs served tokens</p>
            </div>
          </div>

          <div className="h-64 sm:h-72">
            <Line data={trafficChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 2: Status Breakdown Doughnut */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Token Status Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Current state breakdown of all tokens</p>

            <div className="h-52 relative flex items-center justify-center">
              <Doughnut
                data={statusDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 }
                    }
                  },
                  cutout: '70%'
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Completed:</span>
              <span className="font-bold text-white ml-auto">{kpis.totalCompleted}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-slate-400">Waiting:</span>
              <span className="font-bold text-white ml-auto">{kpis.totalWaiting}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span className="text-slate-400">In Service:</span>
              <span className="font-bold text-white ml-auto">{kpis.totalInService}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-400">Cancelled:</span>
              <span className="font-bold text-white ml-auto">{kpis.totalCancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Wait Times Bar Chart & Queue Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wait Time Trends Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-1">Average Wait Time Trends</h3>
          <p className="text-xs text-slate-400 mb-4">Average customer waiting duration by hour</p>

          <div className="h-64">
            <Bar data={waitTrendChartData} options={chartOptions} />
          </div>
        </div>

        {/* Per-Queue Performance Comparison */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-1">Queue Performance Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Efficiency metrics per counter</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Queue Name</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center">Waiting</th>
                  <th className="py-2.5 px-3 text-center">Served</th>
                  <th className="py-2.5 px-3 text-right">Avg Wait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(analytics?.queueComparison || []).map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{q.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">[{q.prefix}] {q.department}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300 font-mono">{q.total}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-400 font-mono">{q.waiting}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400 font-mono">{q.completed}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {q.avgWaitMinutes} min
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
