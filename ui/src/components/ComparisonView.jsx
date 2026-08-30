import React from 'react';
import { Layers, CheckCircle2, CopySlash, ArrowRight } from 'lucide-react';

export default function ComparisonView({ queryResult }) {
  if (!queryResult) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
        <Layers className="w-8 h-8 mb-3 mx-auto text-slate-600 animate-pulse" />
        <h3 className="text-sm font-medium text-slate-300 mb-1">No Active Query Comparison</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Submit a query or select a demo preset in the Chat view to inspect the side-by-side comparison between Context Scheduler and Vector RAG.
        </p>
      </div>
    );
  }

  const { query, budget_limit, tokens_used, candidates_trace, vector_rag } = queryResult;
  
  const schedulerMemories = candidates_trace.filter(c => c.status === 'INCLUDED');
  const deduplicatedMemories = candidates_trace.filter(c => c.status === 'DEDUPLICATED');
  
  const ragMemories = vector_rag?.memories || [];
  const ragTokens = vector_rag?.tokens_used || 0;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      
      {/* Question Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Comparing prompt assembly ({budget_limit} tokens limit):</span>
          <h2 className="text-sm sm:text-base font-semibold text-white mt-0.5">"{query}"</h2>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Column 1: Context Scheduler */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Context Scheduler</h3>
                <p className="text-[11px] text-slate-400">Deduplication + Recency + Knapsack density</p>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-emerald-400 font-medium">
              {tokens_used} / {budget_limit} tokens
            </div>
          </div>

          {/* List of Context Scheduler items */}
          <div className="space-y-2">
            {schedulerMemories.map((mem, idx) => (
              <div key={mem.id || idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-medium text-[11px]">
                    Rank #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 text-[10px] font-mono">
                      {mem.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{mem.tokens}t</span>
                  </div>
                </div>
                <p className="text-xs text-slate-200">"{mem.content}"</p>
              </div>
            ))}
          </div>

          {/* Deduplicated indicator */}
          {deduplicatedMemories.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <CopySlash className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>{deduplicatedMemories.length} redundant {deduplicatedMemories.length === 1 ? 'copy' : 'copies'} purged</strong> before prompt assembly.
              </span>
            </div>
          )}

        </div>

        {/* Column 2: Vector RAG */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-300">Standard Vector RAG</h3>
                <p className="text-[11px] text-slate-400">Raw cosine similarity (Greedy Top-K)</p>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-400">
              {ragTokens} / {budget_limit} tokens
            </div>
          </div>

          {/* List of Vector RAG items */}
          <div className="space-y-2">
            {ragMemories.map((mem, idx) => (
              <div key={mem.id || idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Top #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 text-[10px] font-mono">
                      {mem.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{mem.tokens}t</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300">"{mem.content}"</p>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Core Key Finding Banner Beneath */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-center text-xs sm:text-sm text-slate-200">
        {deduplicatedMemories.length > 0 ? (
          <span>
            <strong className="text-amber-400">Vector RAG kept {ragMemories.length} copies of similar facts.</strong> Context Scheduler kept 1 and used the saved space for distinct context.
          </span>
        ) : (
          <span>
            <strong>Context Scheduler dynamically packs memories by factual density</strong> rather than blindly appending raw similarity matches.
          </span>
        )}
      </div>

    </div>
  );
}
