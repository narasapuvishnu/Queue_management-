import React from 'react';
import {
  Layers,
  BarChart3,
  Tv,
  ListOrdered,
  LogOut,
  User,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  currentView,
  setCurrentView,
  queues = [],
  selectedQueueId,
  setSelectedQueueId,
  onOpenCreateQueue,
  onOpenAuthModal,
  onResetDemo
}) {
  const { user, isAuthenticated, logout } = useAuth();

  const selectedQueue = queues.find(q => q.id === selectedQueueId);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  QueueFlow
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Enterprise Queue & Token Hub</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentView('live')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'live'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Live Queue</span>
            </button>

            <button
              onClick={() => setCurrentView('queues')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'queues'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Queues</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-800 text-slate-300">
                {queues.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setCurrentView('kiosk')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'kiosk'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Open Waiting Room Kiosk TV Mode"
            >
              <Tv className="w-4 h-4" />
              <span className="hidden md:inline">TV Display</span>
            </button>
          </nav>

          {/* Right Actions: Queue Switcher & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Queue Switcher (when on live view) */}
            {currentView === 'live' && queues.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400">Queue:</span>
                <select
                  value={selectedQueueId || ''}
                  onChange={(e) => setSelectedQueueId(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-1"
                >
                  {queues.map((q) => (
                    <option key={q.id} value={q.id} className="bg-slate-900 text-white">
                      [{q.prefix}] {q.name} ({q.waitingCount || 0} waiting)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Demo Reset Helper */}
            <button
              onClick={onResetDemo}
              title="Reset Demo Data"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Demo</span>
            </button>

            {/* Auth section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {user?.name?.[0] || 'M'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium text-white truncate max-w-[120px]">
                      {user?.name || user?.username}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Queue Manager
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/20 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Manager Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
