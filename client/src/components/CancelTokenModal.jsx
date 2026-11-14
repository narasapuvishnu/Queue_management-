import React, { useState } from 'react';
import { X, AlertTriangle, Ban } from 'lucide-react';
import { api } from '../services/api';

const QUICK_REASONS = [
  'Customer left / No-show',
  'Duplicate token created',
  'Issue resolved elsewhere',
  'Rescheduled for another time',
  'Wrong service queue selected'
];

export default function CancelTokenModal({ isOpen, onClose, token, onCancelled }) {
  const [reason, setReason] = useState(QUICK_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !token) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const finalReason = isCustom ? customReason.trim() || 'Cancelled by manager' : reason;
      const res = await api.tokens.cancel(token.id, finalReason);
      if (res.success) {
        if (onCancelled) onCancelled(res.cancelledToken, res.waitingTokens);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cancel Token</h3>
            <p className="text-xs text-slate-400">Remove person from active queue</p>
          </div>
        </div>

        {/* Token Info Pill */}
        <div className="p-3 mb-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Token</span>
            <p className="font-mono font-bold text-base text-white">{token.tokenNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Customer</span>
            <p className="font-semibold text-sm text-slate-200">{token.personName}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-5">
          <label className="block text-xs font-medium text-slate-300">
            Select Cancellation Reason:
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {QUICK_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                  !isCustom && reason === r
                    ? 'bg-red-500/10 text-red-300 border-red-500/40'
                    : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  checked={!isCustom && reason === r}
                  onChange={() => {
                    setReason(r);
                    setIsCustom(false);
                  }}
                  className="text-red-600 focus:ring-red-500"
                />
                <span>{r}</span>
              </label>
            ))}

            <label
              className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                isCustom
                  ? 'bg-red-500/10 text-red-300 border-red-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                name="cancel_reason"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
                className="text-red-600 focus:ring-red-500"
              />
              <span>Other (Custom reason)</span>
            </label>
          </div>

          {isCustom && (
            <input
              type="text"
              autoFocus
              placeholder="Enter custom cancellation reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Keep Token
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-md shadow-red-600/20 disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{loading ? 'Cancelling...' : 'Confirm Cancellation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
