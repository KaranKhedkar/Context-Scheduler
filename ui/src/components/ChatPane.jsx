import React, { useState } from 'react';
import { Send, Bot, Sliders, ChevronDown, ChevronUp, MessageSquare, Terminal } from 'lucide-react';

export default function ChatPane({
  query,
  setQuery,
  budget,
  setBudget,
  onRunQuery,
  isQuerying,
  queryResult,
  activePreset,
  onSelectPreset,
  isLoadingPreset
}) {
  const [showRawContext, setShowRawContext] = useState(false);

  const presetQueries = [
    { id: "recency_conflict", label: "Recency conflict", query: "Who is the primary contact for Engineering?" },
    { id: "multi_hop", label: "Multi-hop decision", query: "Why did we choose Nuxt for Project Zeta?" },
    { id: "redundancy_incident", label: "Duplicate alerts", query: "What happened to the Auth service?" },
  ];

  const budgetPresets = [25, 50, 75, 100, 250, 500];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;
    onRunQuery(query, budget);
  };

  return (
    <div className="space-y-4">
      
      {/* Demo Scenario Picker Row */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <span className="text-slate-400 font-medium">Demo scenario presets:</span>
          {isLoadingPreset && <span className="text-indigo-400 text-[11px] animate-pulse">Loading preset...</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {presetQueries.map((pq) => (
            <button
              key={pq.id}
              type="button"
              onClick={() => onSelectPreset(pq.id)}
              disabled={isLoadingPreset}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                activePreset === pq.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              {pq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Question
            </label>
            <span className="text-[11px] text-slate-400">Ask about stored memories</span>
          </div>

          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Who is the primary contact for Engineering?"
              rows={2}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
            />
            <button
              type="submit"
              disabled={isQuerying || !query.trim()}
              className="absolute right-2.5 bottom-3.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isQuerying ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Schedule</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>

          {/* Token Budget Slider Control */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-medium">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Prompt token budget:</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-white">{budget}</span>
                <span className="text-slate-400">tokens</span>
              </div>
            </div>

            <input
              type="range"
              min="25"
              max="500"
              step="25"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
            />

            {/* Quick budget chips */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1.5">
                {budgetPresets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                      budget === b
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {b}t
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500">Benchmark: 50t</span>
            </div>
          </div>

        </form>
      </div>

      {/* LLM Response Pane */}
      {queryResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Model Answer</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Groq • GPT-OSS 120B</span>
          </div>

          <div className="text-xs sm:text-[13px] text-slate-100 leading-relaxed font-sans bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            {queryResult.llm_answer || "No response generated."}
          </div>

          {/* Assembled Context Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowRawContext(!showRawContext)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-all"
            >
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Assembled Context Sent to LLM</span>
                <span className="text-slate-400">({queryResult.tokens_used} tokens)</span>
              </div>
              {showRawContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showRawContext && (
              <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {queryResult.context_text || "<Empty context>"}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
