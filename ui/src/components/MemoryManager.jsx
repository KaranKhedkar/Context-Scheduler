import React, { useState } from 'react';
import { Database, Plus, Search, Filter, Clock, Sparkles, RefreshCw, Layers } from 'lucide-react';

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

  const getTypeBadge = (type) => {
    switch (type) {
      case 'DECISION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/70 border border-purple-500/30 text-purple-300">DECISION</span>;
      case 'PREFERENCE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">PREFERENCE</span>;
      case 'EVENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/70 border border-amber-500/30 text-amber-300">EVENT</span>;
      case 'FACT':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950/70 border border-sky-500/30 text-sky-300">FACT</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Scenario Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Load Benchmark Scenario Presets</h3>
          </div>
          <span className="text-[11px] text-slate-400">Seeds FAISS index with synthetic test cases</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Preset 1 */}
          <button
            onClick={() => onSelectPreset('recency_conflict')}
            disabled={isLoadingPreset}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activePreset === 'recency_conflict'
                ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">1. Recency Conflict</span>
              <span className="text-[10px] font-mono text-indigo-400">7 items</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Old Charlie fact (30d ago) vs new Heidi override (1d ago) with budget distractors.
            </p>
          </button>

          {/* Preset 2 */}
          <button
            onClick={() => onSelectPreset('multi_hop')}
            disabled={isLoadingPreset}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activePreset === 'multi_hop'
                ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">2. Multi-Hop Reasoning</span>
              <span className="text-[10px] font-mono text-indigo-400">8 items</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Project Zeta SSR requirement linked to Nuxt architectural choice.
            </p>
          </button>

          {/* Preset 3 */}
          <button
            onClick={() => onSelectPreset('redundancy_incident')}
            disabled={isLoadingPreset}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activePreset === 'redundancy_incident'
                ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">3. Redundant Outage</span>
              <span className="text-[10px] font-mono text-indigo-400">9 items</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              1 primary Auth timeout alert + 4 near-duplicate alerts and traffic noise.
            </p>
          </button>

        </div>
      </div>

      {/* Main Grid: Add Form + Memories Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Add Memory Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Plus className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Add Custom Memory</h3>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Memory Content</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. The database cluster was updated to PostgreSQL 16."
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">Memory Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="FACT">FACT</option>
                  <option value="DECISION">DECISION</option>
                  <option value="PREFERENCE">PREFERENCE</option>
                  <option value="EVENT">EVENT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">Age (Timestamp)</label>
                <select
                  value={newAgeDays}
                  onChange={(e) => setNewAgeDays(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="0">Just now (0d)</option>
                  <option value="1">1 day ago</option>
                  <option value="7">7 days ago</option>
                  <option value="30">30 days ago</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdding || !newContent.trim()}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Embed &amp; Add to FAISS Index</span>
            </button>
          </form>
        </div>

        {/* Right: Active Memories Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          
          {/* Filter / Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Vector Store Contents ({memories.length})
              </h3>
            </div>

            {/* Filter by Type */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    selectedType === t
                      ? 'bg-indigo-600 text-white'
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
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Memories List */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {filteredMemories.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">No matching memories in store.</p>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(mem.type)}
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {mem.time_ago}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      "{mem.content}"
                    </p>
                  </div>
                  
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 shrink-0">
                    {mem.tokens} tokens
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
