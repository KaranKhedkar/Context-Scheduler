import React, { useState } from 'react';
import { Send, Bot, User, Sliders, ChevronDown, ChevronUp, Sparkles, MessageSquare, Terminal } from 'lucide-react';

export default function ChatPane({
  query,
  setQuery,
  budget,
  setBudget,
  onRunQuery,
  isQuerying,
  queryResult
}) {
  const [showRawContext, setShowRawContext] = useState(false);

  const presetQueries = [
    { label: "Engineering Contact (Recency)", text: "Who is the primary contact for Engineering?" },
    { label: "Nuxt Decision (Multi-Hop)", text: "Why did we choose Nuxt for Project Zeta?" },
    { label: "Auth Outage (Redundancy)", text: "What happened to the Auth service?" },
  ];

  const budgetPresets = [25, 50, 75, 100, 250, 500];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;
    onRunQuery(query, budget);
  };

  return (
    <div className="space-y-4">
      
      {/* Query Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-3">
          
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Prompt Query
            </label>
            <span className="text-[11px] text-slate-400">Ask about stored team memories</span>
          </div>

          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Who is the primary contact for Engineering?"
              rows={2}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
            <button
              type="submit"
              disabled={isQuerying || !query.trim()}
              className="absolute right-2.5 bottom-3.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30"
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

          {/* Quick preset query pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
            </span>
            {presetQueries.map((pq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(pq.text);
                  onRunQuery(pq.text, budget);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-750 border border-slate-700/70 text-slate-300 hover:text-white text-[11px] font-medium transition-all"
              >
                {pq.label}
              </button>
            ))}
          </div>

          {/* Token Budget Slider Control */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Prompt Token Budget:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold text-indigo-300">{budget}</span>
                <span className="text-xs text-slate-400">tokens</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="25"
                max="500"
                step="25"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Quick budget chips */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {budgetPresets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                      budget === b
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {b}t
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">Default benchmark budget: 50t</span>
            </div>
          </div>

        </form>
      </div>

      {/* LLM Response Pane */}
      {queryResult && (
        <div className="space-y-3">
          
          {/* Answer Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">LLM Response</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Groq • GPT-OSS 120B (Temp 0.0)</span>
            </div>

            <div className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
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
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  <span>Assembled Context Injected to LLM</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {queryResult.tokens_used} tokens
                  </span>
                </div>
                {showRawContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showRawContext && (
                <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed">
                  {queryResult.context_text || "<Empty context>"}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
