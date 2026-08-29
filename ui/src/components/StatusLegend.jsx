import React from 'react';
import { CheckCircle2, XCircle, CopySlash, MinusCircle } from 'lucide-react';

export default function StatusLegend() {
  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-4 py-2.5 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 font-medium tracking-wide uppercase text-[11px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          Engine Decision States:
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          {/* Included */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold">Included</span>
            <span className="text-emerald-500/80 text-[11px] hidden md:inline">• Packs into budget</span>
          </div>

          {/* Cut by Budget */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-500/30 text-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-semibold">Cut by Budget</span>
            <span className="text-rose-500/80 text-[11px] hidden md:inline">• Exceeds token limit</span>
          </div>

          {/* Deduplicated */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-500/30 text-amber-300">
            <CopySlash className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">Deduplicated</span>
            <span className="text-amber-500/80 text-[11px] hidden md:inline">• &gt;90% semantic duplicate</span>
          </div>

          {/* Below Threshold (Crisp Slate with high contrast) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-600/60 text-slate-200">
            <MinusCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="font-semibold">Below Threshold</span>
            <span className="text-slate-400 text-[11px] hidden md:inline">• Low relevance/decayed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
