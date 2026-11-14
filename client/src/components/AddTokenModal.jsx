import React, { useState } from 'react';
import { X, UserPlus, Phone, FileText, Star, CheckCircle, Ticket, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function AddTokenModal({ isOpen, onClose, queue, onTokenCreated }) {
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [serviceReason, setServiceReason] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdToken, setCreatedToken] = useState(null);

  if (!isOpen || !queue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim()) {
      setError('Person name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.tokens.create({
        queueId: queue.id,
        personName: personName.trim(),
        personPhone: personPhone.trim(),
        serviceReason: serviceReason.trim() || 'General Consultation',
        priority
      });

      if (res.success && res.token) {
        setCreatedToken(res.token);
        if (onTokenCreated) onTokenCreated(res.token);
      }
    } catch (err) {
      setError(err.message || 'Failed to issue token.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPersonName('');
    setPersonPhone('');
    setServiceReason('');
    setPriority('normal');
    setCreatedToken(null);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {createdToken ? (
          /* SUCCESS TOKEN SLIP VIEW */
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Token Issued Successfully!</h3>
            <p className="text-xs text-slate-400 mb-6">Added to queue: <strong className="text-slate-200">{queue.name}</strong></p>

            {/* Virtual Token Slip Card */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-850 p-6 rounded-2xl border-2 border-dashed border-indigo-500/40 relative max-w-xs mx-auto shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/60 pb-3 mb-4">
                <span className="font-semibold text-indigo-400 tracking-wider">QUEUEFLOW TICKET</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="my-2">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">Your Token</span>
                <div className="text-4xl font-extrabold tracking-tight text-white my-1 bg-gradient-to-r from-indigo-300 via-white to-cyan-200 bg-clip-text text-transparent">
                  {createdToken.tokenNumber}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-1.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white font-medium">{createdToken.personName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Queue Position:</span>
                  <span className="text-indigo-400 font-bold">#{createdToken.position} in line</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service:</span>
                  <span className="text-slate-300 truncate max-w-[140px]">{createdToken.serviceReason}</span>
                </div>
                {createdToken.priority === 'vip' && (
                  <div className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ⭐ VIP PRIORITY
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                + Issue Another Token
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Add Person / Generate Token</h3>
                <p className="text-xs text-slate-400">
                  Target Queue: <span className="text-indigo-400 font-medium">[{queue.prefix}] {queue.name}</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Person Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. John Doe"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone Number <span className="text-slate-500 text-[10px]">(optional for SMS alert)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 012-3456"
                    value={personPhone}
                    onChange={(e) => setPersonPhone(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Service Reason / Notes
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Follow-up consultation, Billing query"
                    value={serviceReason}
                    onChange={(e) => setServiceReason(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Service Priority
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      priority === 'normal'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>Regular</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('vip')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      priority === 'vip'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-500/10'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>VIP Priority</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !personName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{loading ? 'Generating...' : 'Issue Token'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
