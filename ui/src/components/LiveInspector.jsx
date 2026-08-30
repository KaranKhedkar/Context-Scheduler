import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  CopySlash, 
  MinusCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Activity
} from 'lucide-react';

export default function LiveInspector({ queryResult }) {
  const [showExcluded, setShowExcluded] = useState(false);
  const [expandedScores, setExpandedScores] = useState({});

  if (!queryResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60 shadow-lg shadow-black/20">
        <Activity className="w-8 h-8 mb-3 text-slate-600 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Live Engine Inspector</h3>
        <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
          Run a query on the left to see how memories are scored, deduplicated, and packed into the token budget.
        </p>
      </div>
    );
  }

  const { budget_limit, tokens_used, candidates_trace } = queryResult;
  const fillPct = Math.min(100, Math.round((tokens_used / Math.max(1, budget_limit)) * 100));

  // Separate candidates by state
  const includedList = candidates_trace.filter(c => c.status === 'INCLUDED');
  const cutByBudgetList = candidates_trace.filter(c => c.status === 'CUT_BY_BUDGET');
  const deduplicatedList = candidates_trace.filter(c => c.status === 'DEDUPLICATED');
  const belowThresholdList = candidates_trace.filter(c => c.status === 'BELOW_THRESHOLD');
  const excludedCount = cutByBudgetList.length + deduplicatedList.length + belowThresholdList.length;

  const toggleScores = (id) => {
    setExpandedScores(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getPlainReason = (candidate) => {
    switch (candidate.status) {
      case 'INCLUDED':
        if (candidate.recency > 0.8) {
          return 'Highly relevant and recent override';
        }
        return `Ranked #${candidate.status_detail.split('•')[0].replace('Rank', '').trim()} by relevance & token density`;
      case 'CUT_BY_BUDGET':
        return `Exceeded token limit (${candidate.tokens}t required, not enough space remaining)`;
      case 'DEDUPLICATED':
        if (candidate.dedup_match) {
          return `Duplicate of another memory in context (${Math.round(candidate.dedup_match.similarity * 100)}% match)`;
        }
        return 'Duplicate of another fact in context';
      case 'BELOW_THRESHOLD':
      default:
        return 'Low relevance score or decayed by time';
    }
  };

  const getCardBorder = (status) => {
    switch (status) {
      case 'INCLUDED':
        return 'border-emerald-500/35 bg-emerald-950/15 hover:border-emerald-500/50 shadow-sm shadow-emerald-950/20';
      case 'CUT_BY_BUDGET':
        return 'border-rose-500/30 bg-rose-950/15 hover:border-rose-500/40 shadow-sm shadow-rose-950/20';
      case 'DEDUPLICATED':
        return 'border-amber-500/30 bg-amber-950/15 hover:border-amber-500/40 shadow-sm shadow-amber-950/20';
      case 'BELOW_THRESHOLD':
      default:
        return 'border-slate-800 bg-slate-900/50 hover:border-slate-700 shadow-sm shadow-black/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'INCLUDED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'CUT_BY_BUDGET':
        return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'DEDUPLICATED':
        return <CopySlash className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'BELOW_THRESHOLD':
      default:
        return <MinusCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  const renderMemoryCard = (candidate) => {
    const showScore = !!expandedScores[candidate.id];

    return (
      <div 
        key={candidate.id}
        className={`p-3.5 rounded-xl border transition-all duration-200 ease-out ${getCardBorder(candidate.status)}`}
      >
        {/* Header: Status icon + Plain reason + Type tag */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {getStatusIcon(candidate.status)}
            <span className="text-xs font-medium text-slate-200 truncate">
              {getPlainReason(candidate)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Monochrome Type Tag */}
            <span className="px-1.5 py-0.5 rounded border border-slate-700/80 text-slate-400 text-[10px] font-mono">
              {candidate.type}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {candidate.tokens}t
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-xs sm:text-[13px] text-slate-100 font-normal leading-relaxed mb-2.5">
          "{candidate.content}"
        </p>

        {/* Deduplication detail snippet */}
        {candidate.status === 'DEDUPLICATED' && candidate.dedup_match && (
          <div className="mb-2.5 p-2.5 rounded-lg bg-slate-950/60 text-slate-300 text-[11px] shadow-inner">
            <span className="text-amber-400 font-medium">Similar to: </span>
            <span className="italic text-slate-400">"{candidate.dedup_match.similar_to_content}"</span>
          </div>
        )}

        {/* Footer: Time ago + "Show scores" toggle */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            {candidate.time_ago}
          </span>
          
          <button
            type="button"
            onClick={() => toggleScores(candidate.id)}
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors duration-150 text-[11px] font-medium"
          >
            <span>{showScore ? 'Hide scores' : 'Show scores'}</span>
            {showScore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Progressive Disclosure: Single-Hue Score Bars */}
        {showScore && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-xs">
            {/* Relevance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Relevance</span>
                <span className="font-mono text-slate-200">{candidate.relevance}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" style={{ width: `${Math.round(candidate.relevance * 100)}%` }} />
              </div>
            </div>

            {/* Recency */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Recency (7d)</span>
                <span className="font-mono text-slate-200">{candidate.recency}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" style={{ width: `${Math.round(candidate.recency * 100)}%` }} />
              </div>
            </div>

            {/* Combined */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Combined</span>
                <span className="font-mono text-white font-bold">{candidate.final_score}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" style={{ width: `${Math.round(candidate.final_score * 100)}%` }} />
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Plain-English Summary & Token Progress Card */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 shadow-lg shadow-black/25 space-y-3.5">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-200">
          <div>
            <strong className="text-white font-bold">{includedList.length} of {candidates_trace.length}</strong> memories included
            {excludedCount > 0 && (
              <span className="text-slate-400 font-normal"> · {excludedCount} excluded ({cutByBudgetList.length} cut, {deduplicatedList.length} duplicate)</span>
            )}
            <span className="text-slate-400 font-mono font-normal"> · {tokens_used} / {budget_limit} tokens</span>
          </div>
        </div>

        {/* 2. Token Budget Progress Bar */}
        <div className="space-y-2">
          <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          
          <p className="text-xs text-slate-400 leading-normal">
            Used <span className="font-mono text-slate-300 font-medium">{tokens_used}</span> of <span className="font-mono text-slate-300 font-medium">{budget_limit}</span> tokens
            {cutByBudgetList.length > 0 
              ? ` — ${cutByBudgetList.length} ${cutByBudgetList.length === 1 ? 'memory' : 'memories'} didn't fit and ${cutByBudgetList.length === 1 ? 'was' : 'were'} left out.`
              : ' — all candidate memories fit within the budget.'}
          </p>
        </div>
      </div>

      {/* 3. Included Memories Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Included in Prompt Context ({includedList.length})
          </h3>
          <span className="text-[11px] text-emerald-400 font-medium">Selected for LLM</span>
        </div>

        <div className="space-y-2.5">
          {includedList.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 bg-slate-900/30 rounded-xl border border-slate-800/40">No memories fit the token budget.</p>
          ) : (
            includedList.map(renderMemoryCard)
          )}
        </div>
      </div>

      {/* 4. Excluded Memories Section */}
      {excludedCount > 0 && (
        <div className="pt-2 border-t border-slate-800/60 space-y-3">
          <button
            type="button"
            onClick={() => setShowExcluded(!showExcluded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 text-xs font-medium text-slate-300 transition-all duration-200 shadow-sm"
          >
            <span>Why were {excludedCount} memories left out?</span>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px]">
                {showExcluded ? 'Hide details' : 'View excluded'}
              </span>
              {showExcluded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showExcluded && (
            <div className="space-y-4 pt-1">
              
              {/* Cut by Budget */}
              {cutByBudgetList.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5 px-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Cut by Token Budget ({cutByBudgetList.length})
                  </span>
                  <div className="space-y-2.5">
                    {cutByBudgetList.map(renderMemoryCard)}
                  </div>
                </div>
              )}

              {/* Deduplicated */}
              {deduplicatedList.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 px-1">
                    <CopySlash className="w-3.5 h-3.5 text-amber-400" />
                    Deduplicated / Redundant ({deduplicatedList.length})
                  </span>
                  <div className="space-y-2.5">
                    {deduplicatedList.map(renderMemoryCard)}
                  </div>
                </div>
              )}

              {/* Below Threshold */}
              {belowThresholdList.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 px-1">
                    <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
                    Below Relevance Threshold ({belowThresholdList.length})
                  </span>
                  <div className="space-y-2.5">
                    {belowThresholdList.map(renderMemoryCard)}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
