import React from 'react';
import { CheckCircle2, XCircle, CopySlash, MinusCircle } from 'lucide-react';

export default function StatusLegend() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-2.5 shadow-md shadow-black/20 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 font-medium text-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          <span>Decision States:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Included */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/25 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium">Included</span>
            <span className="text-emerald-500/80 text-[11px] hidden md:inline">• Fits in budget</span>
          </div>

          {/* Cut by Budget */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-500/25 text-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-medium">Cut by Budget</span>
            <span className="text-rose-500/80 text-[11px] hidden md:inline">• Exceeds remaining tokens</span>
          </div>

          {/* Deduplicated */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-500/25 text-amber-300">
            <CopySlash className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">Deduplicated</span>
            <span className="text-amber-500/80 text-[11px] hidden md:inline">• Near-identical duplicate</span>
          </div>

          {/* Below Threshold */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <MinusCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium">Below Threshold</span>
            <span className="text-slate-400 text-[11px] hidden md:inline">• Low relevance or decayed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
