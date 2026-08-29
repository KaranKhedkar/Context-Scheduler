import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  CopySlash, 
  MinusCircle, 
  Clock, 
  Hash, 
  Zap, 
  Sliders, 
  Activity,
  ArrowRight
} from 'lucide-react';

export default function LiveInspector({ queryResult, isQuerying }) {
  if (!queryResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
        <Activity className="w-10 h-10 mb-3 text-slate-600 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Live Engine Inspector Idle</h3>
        <p className="text-xs max-w-xs text-slate-400">
          Submit a query on the left to watch real-time relevance scoring, recency decay, deduplication, and budget packing.
        </p>
      </div>
    );
  }

  const { budget_limit, tokens_used, token_reduction_pct, candidates_trace, budget_progression } = queryResult;
  const fillPct = Math.min(100, Math.round((tokens_used / Math.max(1, budget_limit)) * 100));

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

  const getStatusBadge = (candidate) => {
    switch (candidate.status) {
      case 'INCLUDED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>INCLUDED</span>
          </div>
        );
      case 'CUT_BY_BUDGET':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>CUT BY BUDGET</span>
          </div>
        );
      case 'DEDUPLICATED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold">
            <CopySlash className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>DEDUPLICATED</span>
          </div>
        );
      case 'BELOW_THRESHOLD':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-600 text-slate-200 text-xs font-semibold shadow-sm">
            <MinusCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span>BELOW THRESHOLD</span>
          </div>
        );
    }
  };

  const getCardBorder = (status) => {
    switch (status) {
      case 'INCLUDED':
        return 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500/60';
      case 'CUT_BY_BUDGET':
        return 'border-rose-500/30 bg-rose-950/10 hover:border-rose-500/50';
      case 'DEDUPLICATED':
        return 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50';
      case 'BELOW_THRESHOLD':
      default:
        return 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Token Budget Meter */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Token Budget Allocation</h3>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-400">
              Used: <strong className="text-indigo-300 font-bold">{tokens_used}</strong> / {budget_limit} tokens
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-[11px]">
              {token_reduction_pct}% reduction
            </span>
          </div>
        </div>

        {/* Progress Fill Bar */}
        <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
            style={{ width: `${fillPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
          <span>0 tokens</span>
          <span className="text-slate-300 font-medium">
            {tokens_used <= budget_limit ? `${budget_limit - tokens_used} tokens remaining` : 'Budget full'}
          </span>
          <span>{budget_limit} tokens (Cap)</span>
        </div>
      </div>

      {/* Candidate Memories List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Evaluated Candidate Memories ({candidates_trace.length})
          </h4>
          <span className="text-[11px] text-slate-400">Sorted by selection density &amp; final score</span>
        </div>

        <div className="space-y-2.5">
          {candidates_trace.map((candidate, idx) => {
            const isDeduplicated = candidate.status === 'DEDUPLICATED';
            
            return (
              <div 
                key={candidate.id || idx}
                className={`p-3.5 rounded-xl border transition-all duration-200 ${getCardBorder(candidate.status)}`}
              >
                {/* Header: Status + Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(candidate)}
                    {getTypeBadge(candidate.type)}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-[11px] text-slate-300">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {candidate.time_ago}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
                      {candidate.tokens} tokens
                    </span>
                  </div>
                </div>

                {/* Memory Content */}
                <p className="text-xs sm:text-[13px] text-slate-200 font-medium leading-relaxed mb-3">
                  "{candidate.content}"
                </p>

                {/* Deduplication Match Notice */}
                {isDeduplicated && candidate.dedup_match && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                    <CopySlash className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">Redundancy Filter Triggered:</span>
                      <p className="text-amber-200/90 text-[11px] mt-0.5">
                        Matched kept item with <strong>{Math.round(candidate.dedup_match.similarity * 100)}%</strong> cosine similarity:
                        <br />
                        <span className="italic text-slate-300 font-mono text-[10px]">
                          "{candidate.dedup_match.similar_to_content}"
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Score Breakdown Gauges */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  
                  {/* Relevance */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Relevance (70%)</span>
                      <span className="font-mono font-semibold text-slate-200">{candidate.relevance}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-400 rounded-full" 
                        style={{ width: `${Math.round(candidate.relevance * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Recency */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Recency (30%)</span>
                      <span className="font-mono font-semibold text-slate-200">{candidate.recency}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full" 
                        style={{ width: `${Math.round(candidate.recency * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Final Score / Density */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Combined Score</span>
                      <span className="font-mono font-bold text-indigo-300">{candidate.final_score}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${Math.round(candidate.final_score * 100)}%` }} 
                      />
                    </div>
                  </div>

                </div>

                {/* Status Detail Subtext */}
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Score density: <strong className="font-mono text-slate-300">{candidate.score_density}</strong> score/tok</span>
                  <span className="text-slate-400">{candidate.status_detail}</span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
