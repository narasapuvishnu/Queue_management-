import React, { useState, useEffect } from 'react';
import { Tv, Volume2, Clock, Users, ArrowRight, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function DisplayScreenView({ queues = [], selectedQueueId }) {
  const [activeQueueId, setActiveQueueId] = useState(selectedQueueId || queues[0]?.id);
  const [tokensData, setTokensData] = useState({
    waitingTokens: [],
    inServiceToken: null
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll active queue data every 3 seconds
  useEffect(() => {
    if (!activeQueueId && queues.length > 0) {
      setActiveQueueId(queues[0].id);
    }

    const loadData = async () => {
      if (!activeQueueId) return;
      try {
        const res = await api.tokens.getByQueue(activeQueueId);
        if (res.success) {
          setTokensData({
            waitingTokens: res.waitingTokens || [],
            inServiceToken: res.inServiceToken || null
          });
        }
      } catch (err) {
        console.error('Error fetching kiosk tokens:', err);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [activeQueueId, queues]);

  const activeQueue = queues.find((q) => q.id === activeQueueId) || queues[0];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Top Bar with Queue Switcher, Clock, and Fullscreen */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              PUBLIC DISPLAY BOARD
            </span>
            <div className="flex items-center gap-2">
              <select
                value={activeQueueId || ''}
                onChange={(e) => setActiveQueueId(e.target.value)}
                className="bg-transparent font-bold text-white text-base focus:outline-none cursor-pointer"
              >
                {queues.map((q) => (
                  <option key={q.id} value={q.id} className="bg-slate-900 text-white">
                    {q.name} ({q.department})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Clock & Fullscreen Button */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-lg font-mono font-bold text-white">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {currentTime.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Kiosk Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-stretch">
        {/* NOW SERVING - Giant Display Card */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950/40 border-2 border-indigo-500/40 p-8 sm:p-12 flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden">
          {/* Animated Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              NOW SERVING
            </span>

            <span className="text-xs font-mono font-semibold text-slate-400">
              COUNTER #1 • {activeQueue?.name || 'General Counter'}
            </span>
          </div>

          {/* Token Display Hero */}
          <div className="my-8 sm:my-14">
            {tokensData.inServiceToken ? (
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block mb-2">
                  TICKET NUMBER
                </span>
                <div className="text-6xl sm:text-8xl md:text-9xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.5)] my-2">
                  {tokensData.inServiceToken.tokenNumber}
                </div>
                <div className="mt-4 text-2xl sm:text-3xl font-bold text-indigo-300">
                  {tokensData.inServiceToken.personName}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Service: {tokensData.inServiceToken.serviceReason}
                </div>
              </div>
            ) : (
              <div className="py-12">
                <div className="text-5xl sm:text-6xl font-extrabold text-slate-600 font-mono tracking-widest">
                  -- IDLE --
                </div>
                <p className="text-base text-slate-400 mt-4">
                  Please wait, next ticket will be called shortly.
                </p>
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-4">
            <span>Please proceed to the counter when your token appears</span>
            <span className="font-semibold text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              QueueFlow Realtime Display
            </span>
          </div>
        </div>

        {/* UPCOMING / NEXT IN LINE LIST */}
        <div className="lg:col-span-1 rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Next In Line
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-indigo-300">
                {tokensData.waitingTokens.length} waiting
              </span>
            </div>

            {tokensData.waitingTokens.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No upcoming tickets in this queue.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {tokensData.waitingTokens.slice(0, 7).map((token) => (
                  <div
                    key={token.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      token.position === 1
                        ? 'bg-gradient-to-r from-indigo-950/60 to-slate-900 border-indigo-500/50 shadow-md'
                        : 'bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          token.position === 1
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{token.position}
                      </span>
                      <div>
                        <div className="font-mono font-bold text-white text-base">
                          {token.tokenNumber}
                        </div>
                        <div className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
                          {token.personName}
                        </div>
                      </div>
                    </div>

                    {token.position === 1 ? (
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 animate-pulse">
                        Next Up
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">
                        ~{(token.position - 1) * 5}m wait
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
            Tickets are called in sequential order. Keep your slip handy.
          </div>
        </div>
      </div>
    </div>
  );
}
