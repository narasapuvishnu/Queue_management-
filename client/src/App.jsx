import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LiveQueueView from './views/LiveQueueView';
import QueuesManagementView from './views/QueuesManagementView';
import AnalyticsDashboardView from './views/AnalyticsDashboardView';
import DisplayScreenView from './views/DisplayScreenView';
import AuthModal from './components/AuthModal';
import CreateQueueModal from './components/CreateQueueModal';
import { api } from './services/api';

function MainApp() {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState('live'); // 'live' | 'queues' | 'analytics' | 'kiosk'
  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [loadingQueues, setLoadingQueues] = useState(true);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateQueueModalOpen, setIsCreateQueueModalOpen] = useState(false);

  // Load all queues
  const fetchQueues = async (silent = false) => {
    if (!silent) setLoadingQueues(true);
    try {
      const res = await api.queues.getAll();
      if (res.success && res.queues) {
        setQueues(res.queues);
        // Default selected queue if none selected yet
        if (!selectedQueueId && res.queues.length > 0) {
          setSelectedQueueId(res.queues[0].id);
        } else if (selectedQueueId && !res.queues.some(q => q.id === selectedQueueId)) {
          setSelectedQueueId(res.queues[0]?.id || null);
        }
      }
    } catch (err) {
      console.error('Failed to load queues:', err);
    } finally {
      if (!silent) setLoadingQueues(false);
    }
  };

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(() => fetchQueues(true), 4000);
    return () => clearInterval(interval);
  }, []);

  // Demo reset
  const handleResetDemo = async () => {
    if (window.confirm('Reset database to clean demo state?')) {
      try {
        await api.resetDemo();
        await fetchQueues();
        alert('Database has been reset to demo state with sample queues and tokens!');
      } catch (err) {
        alert('Reset failed: ' + err.message);
      }
    }
  };

  const selectedQueue = queues.find(q => q.id === selectedQueueId) || queues[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        queues={queues}
        selectedQueueId={selectedQueueId}
        setSelectedQueueId={setSelectedQueueId}
        onOpenCreateQueue={() => setIsCreateQueueModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onResetDemo={handleResetDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'live' && (
          <LiveQueueView
            queue={selectedQueue}
            onOpenCreateQueue={() => setIsCreateQueueModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            isAuthenticated={isAuthenticated}
          />
        )}

        {currentView === 'queues' && (
          <QueuesManagementView
            queues={queues}
            onSelectQueue={(id) => {
              setSelectedQueueId(id);
              setCurrentView('live');
            }}
            onOpenCreateModal={() => setIsCreateQueueModalOpen(true)}
            onRefreshQueues={() => fetchQueues(true)}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsDashboardView queues={queues} />
        )}

        {currentView === 'kiosk' && (
          <DisplayScreenView
            queues={queues}
            selectedQueueId={selectedQueueId}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>QueueFlow Enterprise Queue Management System • Full Stack Edition</span>
          <span>Evaluation Demo: admin@queueflow.com / admin123</span>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Create Queue Modal */}
      <CreateQueueModal
        isOpen={isCreateQueueModalOpen}
        onClose={() => setIsCreateQueueModalOpen(false)}
        onQueueCreated={(newQueue) => {
          fetchQueues();
          setSelectedQueueId(newQueue.id);
          setCurrentView('live');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
