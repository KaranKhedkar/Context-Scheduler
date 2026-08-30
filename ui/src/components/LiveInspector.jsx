import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  CopySlash, 
  MinusCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Activity,
  Info
} from 'lucide-react';

export default function LiveInspector({ queryResult, isQuerying }) {
  const [showExcluded, setShowExcluded] = useState(false);
  const [expandedScores, setExpandedScores] = useState({});

  if (!queryResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
        <Activity className="w-8 h-8 mb-3 text-slate-600 animate-pulse" />
        <h3 className="text-sm font-medium text-slate-300 mb-1">Live Engine Inspector</h3>
        <p className="text-xs max-w-xs text-slate-400">
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

  // Plain language reason generator
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
        return 'border-emerald-500/40 bg-emerald-950/10';
      case 'CUT_BY_BUDGET':
        return 'border-rose-500/30 bg-rose-950/10';
      case 'DEDUPLICATED':
        return 'border-amber-500/30 bg-amber-950/10';
      case 'BELOW_THRESHOLD':
      default:
        return 'border-slate-700 bg-slate-900/60';
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
        return <MinusCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
    }
  };

  const renderMemoryCard = (candidate) => {
    const showScore = !!expandedScores[candidate.id];

    return (
      <div 
        key={candidate.id}
        className={`p-3 rounded-xl border transition-all ${getCardBorder(candidate.status)}`}
      >
        {/* Header: Status icon + Plain reason + Type tag */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {getStatusIcon(candidate.status)}
            <span className="text-xs font-medium text-slate-200 truncate">
              {getPlainReason(candidate)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Monochrome Type Tag */}
            <span className="px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 text-[10px] font-mono">
              {candidate.type}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {candidate.tokens}t
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-xs sm:text-[13px] text-slate-100 font-normal leading-relaxed mb-2">
          "{candidate.content}"
        </p>

        {/* Deduplication detail snippet (neutral styling, no nested colored border) */}
        {candidate.status === 'DEDUPLICATED' && candidate.dedup_match && (
          <div className="mb-2 p-2 rounded-lg bg-slate-950/60 text-slate-300 text-[11px]">
            <span className="text-amber-400 font-medium">Similar to: </span>
            <span className="italic text-slate-400">"{candidate.dedup_match.similar_to_content}"</span>
          </div>
        )}

        {/* Footer: Time ago + "Show scores" toggle */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {candidate.time_ago}
          </span>
          
          <button
            type="button"
            onClick={() => toggleScores(candidate.id)}
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors text-[11px]"
          >
            <span>{showScore ? 'Hide scores' : 'Show scores'}</span>
            {showScore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Progressive Disclosure: Single-Hue Score Bars */}
        {showScore && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
            {/* Relevance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Relevance</span>
                <span className="font-mono text-slate-300">{candidate.relevance}</span>
              </div>
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round(candidate.relevance * 100)}%` }} />
              </div>
            </div>

            {/* Recency */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Recency (7d)</span>
                <span className="font-mono text-slate-300">{candidate.recency}</span>
              </div>
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round(candidate.recency * 100)}%` }} />
              </div>
            </div>

            {/* Combined */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Combined</span>
                <span className="font-mono text-slate-300 font-bold">{candidate.final_score}</span>
              </div>
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round(candidate.final_score * 100)}%` }} />
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Plain-English Summary Line */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-200">
          <div>
            <strong className="text-white">{includedList.length} of {candidates_trace.length}</strong> memories included
            {excludedCount > 0 && (
              <span className="text-slate-400"> · {excludedCount} excluded ({cutByBudgetList.length} cut, {deduplicatedList.length} duplicate)</span>
            )}
            <span className="text-slate-400"> · {tokens_used} / {budget_limit} tokens</span>
          </div>
        </div>

        {/* 2. Token Budget Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-300 bg-indigo-500"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          
          <p className="text-xs text-slate-400">
            Used {tokens_used} of {budget_limit} tokens
            {cutByBudgetList.length > 0 
              ? ` — ${cutByBudgetList.length} memories didn't fit and were left out.`
              : ' — all candidate memories fit within the budget.'}
          </p>
        </div>
      </div>

      {/* 3. Included Memories Section (Primary Content) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Included in Prompt Context ({includedList.length})
          </h3>
          <span className="text-[11px] text-emerald-400 font-medium">Selected for LLM</span>
        </div>

        <div className="space-y-2">
          {includedList.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3">No memories fit the token budget.</p>
          ) : (
            includedList.map(renderMemoryCard)
          )}
        </div>
      </div>

      {/* 4. Excluded Memories Section (Collapsed by Default) */}
      {excludedCount > 0 && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <button
            type="button"
            onClick={() => setShowExcluded(!showExcluded)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 transition-all"
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
                <div className="space-y-2">
                  <span className="text-xs font-medium text-rose-300 flex items-center gap-1.5 px-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Cut by Token Budget ({cutByBudgetList.length})
                  </span>
                  <div className="space-y-2">
                    {cutByBudgetList.map(renderMemoryCard)}
                  </div>
                </div>
              )}

              {/* Deduplicated */}
              {deduplicatedList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-amber-300 flex items-center gap-1.5 px-1">
                    <CopySlash className="w-3.5 h-3.5 text-amber-400" />
                    Deduplicated / Redundant ({deduplicatedList.length})
                  </span>
                  <div className="space-y-2">
                    {deduplicatedList.map(renderMemoryCard)}
                  </div>
                </div>
              )}

              {/* Below Threshold */}
              {belowThresholdList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5 px-1">
                    <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
                    Below Relevance Threshold ({belowThresholdList.length})
                  </span>
                  <div className="space-y-2">
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
