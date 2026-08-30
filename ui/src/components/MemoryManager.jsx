import React, { useState } from 'react';
import { Database, Plus, Search, Clock, Sparkles } from 'lucide-react';

export default function MemoryManager({
  memories,
  onAddMemory,
  onSelectPreset,
  activePreset,
  isLoadingPreset
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('FACT');
  const [newAgeDays, setNewAgeDays] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const types = ['ALL', 'FACT', 'DECISION', 'PREFERENCE', 'EVENT'];

  const filteredMemories = memories.filter((m) => {
    const matchesSearch = m.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || m.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsAdding(true);
    const timestamp = Date.now() / 1000 - (Number(newAgeDays) * 86400);
    await onAddMemory(newContent, newType, timestamp);
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Scenario Presets Row */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-lg shadow-black/25 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Benchmark Scenario Presets</span>
          </h3>
          <span className="text-[11px] text-slate-400">Populate the vector store with synthetic test data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <button
            onClick={() => onSelectPreset('recency_conflict')}
            disabled={isLoadingPreset}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
              activePreset === 'recency_conflict'
                ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900/90 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">1. Recency conflict</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">7 items</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Charlie (30d ago) vs Heidi override (1d ago) with month-long distractors.
            </p>
          </button>

          <button
            onClick={() => onSelectPreset('multi_hop')}
            disabled={isLoadingPreset}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
              activePreset === 'multi_hop'
                ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900/90 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">2. Multi-hop reasoning</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">8 items</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Project Zeta SSR requirement linked to Nuxt architectural choice.
            </p>
          </button>

          <button
            onClick={() => onSelectPreset('redundancy_incident')}
            disabled={isLoadingPreset}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
              activePreset === 'redundancy_incident'
                ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900/90 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">3. Redundant outage</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">9 items</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              1 primary Auth outage alert + 4 near-duplicate alerts and traffic metrics.
            </p>
          </button>

        </div>
      </div>

      {/* Main Grid: Add Form + Memories Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Add Memory Form */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-lg shadow-black/25 space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800/80 pb-2.5">
            Add memory
          </h3>

          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Content</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. Database cluster was upgraded to PostgreSQL 16."
                rows={3}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200 resize-none shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="FACT">FACT</option>
                  <option value="DECISION">DECISION</option>
                  <option value="PREFERENCE">PREFERENCE</option>
                  <option value="EVENT">EVENT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">Age</label>
                <select
                  value={newAgeDays}
                  onChange={(e) => setNewAgeDays(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="0">Just now</option>
                  <option value="1">1 day ago</option>
                  <option value="7">7 days ago</option>
                  <option value="30">30 days ago</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdding || !newContent.trim()}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md shadow-indigo-600/30 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Vector Store</span>
            </button>
          </form>
        </div>

        {/* Right: Active Memories Table */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-lg shadow-black/25 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Stored memories ({memories.length})
            </h3>

            {/* Filter by Type */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-150 ${
                    selectedType === t
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search memories in store..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200 shadow-inner"
            />
          </div>

          {/* Memories List */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {filteredMemories.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No matching memories in store.</p>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-all duration-200 flex items-start justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded border border-slate-700/80 text-slate-400 text-[10px] font-mono">
                        {mem.type}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {mem.time_ago}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      "{mem.content}"
                    </p>
                  </div>
                  
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {mem.tokens}t
                  </span>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
