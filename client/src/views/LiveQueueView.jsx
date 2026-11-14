import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Ban,
  Clock,
  Sparkles,
  Phone,
  Tag,
  AlertCircle,
  CheckCircle2,
  Volume2,
  RefreshCw,
  Search,
  UserPlus,
  Play,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import AddTokenModal from '../components/AddTokenModal';
import CancelTokenModal from '../components/CancelTokenModal';

// Audio chime generator using Web Audio API (zero audio file dependency!)
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // Audio context not allowed or unsupported
  }
}

// Time elapsed formatter (e.g. 3m 42s)
function formatElapsed(fromIso) {
  if (!fromIso) return '0s';
  const sec = Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function LiveQueueView({
  queue,
  onOpenCreateQueue,
  onOpenAuthModal,
  isAuthenticated
}) {
  const [tokensData, setTokensData] = useState({
    waitingTokens: [],
    inServiceToken: null,
    completedTokens: [],
    cancelledTokens: []
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('waiting'); // 'waiting' | 'history'

  // Modals state
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [cancelTargetToken, setCancelTargetToken] = useState(null);

  // Live timer tick every second
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch tokens for active queue
  const fetchTokens = async (silent = false) => {
    if (!queue?.id) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.tokens.getByQueue(queue.id);
      if (res.success) {
        setTokensData({
          waitingTokens: res.waitingTokens || [],
          inServiceToken: res.inServiceToken || null,
          completedTokens: res.completedTokens || [],
          cancelledTokens: res.cancelledTokens || []
        });
      }
    } catch (err) {
      console.error('Failed to load tokens:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(() => fetchTokens(true), 3500);
    return () => clearInterval(interval);
  }, [queue?.id]);

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Requirement #6: Assign token at top of queue for service
  const handleCallNext = async () => {
    if (!queue?.id) return;
    if (tokensData.waitingTokens.length === 0) {
      showNotification('No tokens are currently waiting in this queue.', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.tokens.callNext(queue.id);
      if (res.success) {
        playChime();
        showNotification(
          `🔔 Now Serving: Token ${res.inServiceToken.tokenNumber} (${res.inServiceToken.personName})`,
          'success'
        );
        fetchTokens(true);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to call next token.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete current service
  const handleCompleteCurrent = async () => {
    if (!tokensData.inServiceToken) return;
    setActionLoading(true);
    try {
      const res = await api.tokens.complete(tokensData.inServiceToken.id);
      if (res.success) {
        showNotification(`Service completed for ${res.token.personName}.`, 'success');
        fetchTokens(true);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to complete service.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Requirement #5: Move token UP
  const handleMoveUp = async (token) => {
    if (token.position <= 1) return;
    try {
      const res = await api.tokens.move(token.id, 'up');
      if (res.success) {
        showNotification(`Moved ${token.tokenNumber} up to #${res.movedToken.position}.`, 'info');
        setTokensData((prev) => ({
          ...prev,
          waitingTokens: res.waitingTokens
        }));
      }
    } catch (err) {
      showNotification(err.message || 'Failed to move token up.', 'error');
    }
  };

  // Requirement #5: Move token DOWN
  const handleMoveDown = async (token) => {
    if (token.position >= tokensData.waitingTokens.length) return;
    try {
      const res = await api.tokens.move(token.id, 'down');
      if (res.success) {
        showNotification(`Moved ${token.tokenNumber} down to #${res.movedToken.position}.`, 'info');
        setTokensData((prev) => ({
          ...prev,
          waitingTokens: res.waitingTokens
        }));
      }
    } catch (err) {
      showNotification(err.message || 'Failed to move token down.', 'error');
    }
  };

  if (!queue) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Tag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Queue Selected</h2>
        <p className="text-sm text-slate-400 mb-6">Create your first queue to start issuing tokens.</p>
        <button
          onClick={onOpenCreateQueue}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Queue</span>
        </button>
      </div>
    );
  }

  // Filtered waiting tokens by search
  const filteredWaiting = tokensData.waitingTokens.filter(
    (t) =>
      t.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.serviceReason && t.serviceReason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const topWaitingToken = tokensData.waitingTokens[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : notification.type === 'warning'
              ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
              : notification.type === 'error'
              ? 'bg-red-950/90 text-red-200 border-red-500/40'
              : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Bell className="w-5 h-5 text-indigo-400 shrink-0 animate-bounce" />
          )}
          <span className="text-sm font-medium">{notification.msg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {queue.prefix}
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{queue.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-pulse" />
              Live Queue
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Department: <strong className="text-slate-300">{queue.department || 'General'}</strong>
            {queue.description && ` • ${queue.description}`}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsAddTokenOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Person / Issue Token</span>
          </button>

          <button
            onClick={() => fetchTokens(false)}
            title="Refresh queue roster"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700/60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2-Column Hero: Active Counter & Call Next Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requirement #6: Call Next Token Action Panel */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Service Dispatch Counter
              </span>
              <span className="text-xs font-medium text-slate-400">
                {tokensData.waitingTokens.length} waiting
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Call Next for Service</h3>
            <p className="text-xs text-slate-400 mb-4">
              Instantly serves the top person waiting in queue (#1) with a single button click.
            </p>

            {topWaitingToken ? (
              <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/70 mb-4">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span>NEXT IN LINE (#1)</span>
                  <span className="text-emerald-400 font-semibold">Ready to Call</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-mono font-extrabold text-white">
                    {topWaitingToken.tokenNumber}
                  </span>
                  <span className="text-sm font-semibold text-indigo-300 truncate max-w-[140px]">
                    {topWaitingToken.personName}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Waiting: {formatElapsed(topWaitingToken.createdAt)}</span>
                  <span className="truncate max-w-[130px]">{topWaitingToken.serviceReason}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-500 mb-4">
                No tokens waiting in queue right now.
              </div>
            )}
          </div>

          {/* REQUIREMENT #6: Simple 1-click button to call top token */}
          <button
            onClick={handleCallNext}
            disabled={actionLoading || tokensData.waitingTokens.length === 0}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 transition-all glow-btn disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4 animate-bounce" />
            <span>
              {actionLoading
                ? 'Calling...'
                : topWaitingToken
                ? `Call Token ${topWaitingToken.tokenNumber} Next`
                : 'Queue Empty (Add Tokens)'}
            </span>
          </button>
        </div>

        {/* Active In-Service Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                  Currently Being Served at Counter
                </span>
              </div>
              {tokensData.inServiceToken && (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active Service
                </span>
              )}
            </div>

            {tokensData.inServiceToken ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
                <div className="md:col-span-1 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-700/60 pb-3 md:pb-0 md:pr-4">
                  <span className="text-xs text-slate-400 font-medium">Serving Token</span>
                  <div className="text-4xl font-extrabold font-mono text-white tracking-tight bg-gradient-to-r from-emerald-300 via-white to-cyan-200 bg-clip-text text-transparent my-1">
                    {tokensData.inServiceToken.tokenNumber}
                  </div>
                  {tokensData.inServiceToken.priority === 'vip' && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⭐ VIP PRIORITY
                    </span>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        {tokensData.inServiceToken.personName}
                      </h4>
                      {tokensData.inServiceToken.personPhone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {tokensData.inServiceToken.personPhone}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Service Duration</span>
                      <p className="text-base font-mono font-bold text-emerald-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        {formatElapsed(tokensData.inServiceToken.serviceStartedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/40 text-xs text-slate-300">
                    <span className="text-slate-400">Service: </span>
                    {tokensData.inServiceToken.serviceReason || 'General Service'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-700/60">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                  <UserCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Counter is Currently Idle</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Call Next for Service" to assign the first waiting person to this counter.
                </p>
              </div>
            )}
          </div>

          {/* Counter Action Controls */}
          {tokensData.inServiceToken && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => setCancelTargetToken(tokensData.inServiceToken)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Service</span>
              </button>

              <button
                onClick={handleCompleteCurrent}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Service Completed</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Roster & Controls Section */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('waiting')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'waiting'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              Waiting Roster ({tokensData.waitingTokens.length})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              Completed ({tokensData.completedTokens.length}) & Cancelled ({tokensData.cancelledTokens.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search person or token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Waiting Roster (Requirement #4, #5, #7) */}
        {activeTab === 'waiting' && (
          <div>
            {filteredWaiting.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-slate-400">
                  {searchTerm ? 'No matching tokens found in waiting list' : 'No tokens waiting in queue'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Add Person / Issue Token" above to add new people to this queue.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Position</th>
                      <th className="py-3 px-4">Token #</th>
                      <th className="py-3 px-4">Person Details</th>
                      <th className="py-3 px-4">Service Type</th>
                      <th className="py-3 px-4">Wait Time</th>
                      <th className="py-3 px-4 text-center">Reorder (Up / Down)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredWaiting.map((token, index) => {
                      const isFirst = token.position === 1;
                      const isLast = token.position === tokensData.waitingTokens.length;

                      return (
                        <tr
                          key={token.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isFirst ? 'bg-indigo-950/20' : ''
                          }`}
                        >
                          {/* Position Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                                isFirst
                                  ? 'bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-sm'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              #{token.position}
                            </span>
                          </td>

                          {/* Token Number */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                                {token.tokenNumber}
                              </span>
                              {token.priority === 'vip' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  VIP
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Person Details */}
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-slate-100 text-sm">{token.personName}</p>
                              {token.personPhone && (
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  {token.personPhone}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Service Type */}
                          <td className="py-3 px-4">
                            <span className="text-slate-300">{token.serviceReason || 'General'}</span>
                          </td>

                          {/* Wait Time counter */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              {formatElapsed(token.createdAt)}
                            </span>
                          </td>

                          {/* REQUIREMENT #5: Move tokens UP and DOWN */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleMoveUp(token)}
                                disabled={isFirst}
                                title={isFirst ? 'Already at top of queue' : 'Move up in queue'}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isFirst
                                    ? 'opacity-25 cursor-not-allowed border-slate-800 text-slate-600'
                                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500'
                                }`}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleMoveDown(token)}
                                disabled={isLast}
                                title={isLast ? 'Already at bottom of queue' : 'Move down in queue'}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isLast
                                    ? 'opacity-25 cursor-not-allowed border-slate-800 text-slate-600'
                                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500'
                                }`}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                          {/* Actions: Cancel or Direct Serve */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Requirement #7: Cancel token from queue */}
                              <button
                                onClick={() => setCancelTargetToken(token)}
                                title="Cancel token from queue"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Historical Logs (Completed & Cancelled) */}
        {activeTab === 'history' && (
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                Completed Tokens Today ({tokensData.completedTokens.length})
              </h4>
              {tokensData.completedTokens.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No tokens completed yet today.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tokensData.completedTokens.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{t.tokenNumber}</span>
                          <span className="text-slate-200 font-medium">{t.personName}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t.serviceReason}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                Cancelled Tokens ({tokensData.cancelledTokens.length})
              </h4>
              {tokensData.cancelledTokens.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No tokens cancelled.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tokensData.cancelledTokens.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{t.tokenNumber}</span>
                          <span className="text-slate-300 font-medium">{t.personName}</span>
                        </div>
                        <p className="text-[11px] text-red-400/80 mt-0.5">
                          Reason: {t.cancellationReason || 'Cancelled'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        Cancelled
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Token Modal */}
      <AddTokenModal
        isOpen={isAddTokenOpen}
        onClose={() => setIsAddTokenOpen(false)}
        queue={queue}
        onTokenCreated={() => {
          fetchTokens(true);
          showNotification('New token added to queue!', 'success');
        }}
      />

      {/* Cancel Confirmation Modal */}
      <CancelTokenModal
        isOpen={!!cancelTargetToken}
        onClose={() => setCancelTargetToken(null)}
        token={cancelTargetToken}
        onCancelled={(cancelledToken, waitingTokens) => {
          showNotification(`Token ${cancelledToken.tokenNumber} cancelled.`, 'info');
          fetchTokens(true);
        }}
      />
    </div>
  );
}
