import React, { useState } from 'react';
import { X, PlusCircle, Layers, Tag, Building2, AlignLeft } from 'lucide-react';
import { api } from '../services/api';

export default function CreateQueueModal({ isOpen, onClose, onQueueCreated }) {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [department, setDepartment] = useState('Customer Service');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Auto-suggest prefix when user types name
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!prefix || prefix.length <= 4) {
      const words = val.trim().split(/\s+/);
      if (words.length >= 2) {
        setPrefix((words[0][0] + words[1][0]).toUpperCase());
      } else if (words[0].length >= 3) {
        setPrefix(words[0].substring(0, 3).toUpperCase());
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Queue name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.queues.create({
        name: name.trim(),
        prefix: prefix.trim().toUpperCase() || 'Q',
        department: department.trim(),
        description: description.trim()
      });

      if (res.success && res.queue) {
        if (onQueueCreated) onQueueCreated(res.queue);
        onClose();
        setName('');
        setPrefix('');
        setDescription('');
      }
    } catch (err) {
      setError(err.message || 'Failed to create queue.');
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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create New Queue</h3>
            <p className="text-xs text-slate-400">Set up a dedicated token queue for your counter</p>
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
              Queue Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. VIP Consultation, Express Checkout"
                value={name}
                onChange={handleNameChange}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Token Prefix
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  maxLength={5}
                  placeholder="e.g. VIP"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>
              <span className="text-[10px] text-slate-500">e.g. {prefix || 'Q'}-101</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Department
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Customer Service">Customer Service</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance & Cash">Finance & Cash</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Operations">Operations</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Instructions <span className="text-slate-500 text-[10px]">(optional)</span>
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <textarea
                rows={2}
                placeholder="What is this queue used for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
