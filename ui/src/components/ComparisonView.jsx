import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, CopySlash, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function ComparisonView({ queryResult, isQuerying }) {
  if (!queryResult) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
        <Layers className="w-10 h-10 mb-3 mx-auto text-slate-600 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-300 mb-1">No Active Query Comparison</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Execute a query from the Chat pane or select a demo preset above to see the real-time side-by-side comparison between Context Scheduler and Vector RAG.
        </p>
      </div>
    );
  }

  const { query, budget_limit, tokens_used, candidates_trace, vector_rag } = queryResult;
  
  // Extract included memories in Context Scheduler
  const schedulerMemories = candidates_trace.filter(c => c.status === 'INCLUDED');
  const deduplicatedMemories = candidates_trace.filter(c => c.status === 'DEDUPLICATED');
  
  const ragMemories = vector_rag?.memories || [];
  const ragTokens = vector_rag?.tokens_used || 0;

  return (
    <div className="space-y-6">
      
      {/* Query Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Comparing Query Under {budget_limit}t Budget:</span>
          <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">"{query}"</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>{deduplicatedMemories.length} duplicates purged</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            {ragTokens > tokens_used ? `${ragTokens - tokens_used} tokens saved` : 'Optimal packing'}
          </div>
        </div>
      </div>

      {/* Side-by-Side Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Context Scheduler */}
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Context Scheduler</h3>
                <p className="text-[11px] text-slate-400">Relevance + 7d Recency + Dedup + Density Knapsack</p>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-indigo-300 font-bold">{tokens_used}</span>
              <span className="text-slate-500"> / {budget_limit} tokens</span>
            </div>
          </div>

          {/* List of Selected Items */}
          <div className="space-y-2.5">
            {schedulerMemories.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3">No memories selected.</p>
            ) : (
              schedulerMemories.map((mem, idx) => (
                <div key={mem.id || idx} className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
                      Rank #{idx + 1} • {mem.tokens} tokens
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{mem.time_ago}</span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium">"{mem.content}"</p>
                </div>
              ))
            )}
          </div>

          {/* Deduplication Summary Box */}
          {deduplicatedMemories.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <CopySlash className="w-3.5 h-3.5 text-amber-400" />
                <span>Pairwise Deduplication Protected Context:</span>
              </div>
              <ul className="text-[11px] text-amber-200/80 space-y-1 list-disc list-inside">
                {deduplicatedMemories.map((d, i) => (
                  <li key={i} className="truncate">
                    Dropped duplicate: "{d.content}"
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Right Column: Vector RAG Baseline */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-300">Standard Vector RAG</h3>
                <p className="text-[11px] text-slate-400">Raw Cosine Similarity (Greedy Top-K)</p>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-300 font-bold">{ragTokens}</span>
              <span className="text-slate-500"> / {budget_limit} tokens</span>
            </div>
          </div>

          {/* List of RAG Items */}
          <div className="space-y-2.5">
            {ragMemories.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3">No memories retrieved.</p>
            ) : (
              ragMemories.map((mem, idx) => (
                <div key={mem.id || idx} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                      Top #{idx + 1} • {mem.tokens} tokens
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{mem.time_ago}</span>
                  </div>
                  <p className="text-xs text-slate-300">"{mem.content}"</p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Vector RAG blindly pulls near-duplicate sentences and ignores recency decay, crowding out relevant context when budgets are tight.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
