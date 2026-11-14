import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Building2
} from 'lucide-react';
import { api } from '../services/api';

export default function QueuesManagementView({
  queues = [],
  onSelectQueue,
  onOpenCreateModal,
  onRefreshQueues
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const handleToggleStatus = async (queue) => {
    setActionLoading(queue.id);
    const newStatus = queue.status === 'active' ? 'paused' : 'active';
    try {
      await api.queues.update(queue.id, { status: newStatus });
      if (onRefreshQueues) onRefreshQueues();
    } catch (err) {
      alert('Failed to update queue: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (queue) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${queue.name}"? All its active tokens and history will be deleted.`
      )
    ) {
      return;
    }

    setActionLoading(queue.id);
    try {
      await api.queues.delete(queue.id);
      if (onRefreshQueues) onRefreshQueues();
    } catch (err) {
      alert('Failed to delete queue: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredQueues = queues.filter(
    (q) =>
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.department && q.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Queue Management</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {queues.length} Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, configure, and monitor service counters across all departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search queues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Queue</span>
          </button>
        </div>
      </div>

      {/* Queues Grid */}
      {filteredQueues.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Queues Found</h3>
          <p className="text-xs text-slate-400 mb-6">
            {searchTerm ? 'No queues match your search query.' : 'Get started by creating your first queue.'}
          </p>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Queue</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQueues.map((q) => {
            const isPaused = q.status === 'paused';

            return (
              <div
                key={q.id}
                className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPaused
                    ? 'border-slate-800/60 opacity-75'
                    : 'border-slate-800 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5'
                }`}
              >
                <div>
                  {/* Top Bar: Prefix, Status & Department */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {q.prefix}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {q.department || 'General'}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isPaused
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {isPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>

                  {/* Queue Name */}
                  <h3 className="text-lg font-bold text-white tracking-tight mb-1">{q.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                    {q.description || 'No description provided.'}
                  </p>

                  {/* Current Serving Banner */}
                  {q.currentServingToken ? (
                    <div className="p-3 mb-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                          Now Serving
                        </span>
                        <span className="font-bold text-white text-sm">
                          {q.currentServingToken.tokenNumber}
                        </span>
                        <span className="text-slate-300 ml-1.5 truncate max-w-[110px] inline-block align-bottom">
                          {q.currentServingToken.personName}
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  ) : (
                    <div className="p-3 mb-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-500">
                      Counter currently idle
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center mb-5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Waiting</span>
                      <p className="text-base font-extrabold text-indigo-400">{q.waitingCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Served</span>
                      <p className="text-base font-extrabold text-emerald-400">{q.completedCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Wait</span>
                      <p className="text-base font-extrabold text-slate-300">{q.avgWaitMinutes || 0}m</p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(q)}
                      disabled={actionLoading === q.id}
                      title={isPaused ? 'Resume Queue' : 'Pause Queue'}
                      className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-colors"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    </button>

                    <button
                      onClick={() => handleDelete(q)}
                      disabled={actionLoading === q.id}
                      title="Delete Queue"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 border border-slate-700/60 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectQueue(q.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                  >
                    <span>Open Live Board</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
