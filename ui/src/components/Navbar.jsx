import React from 'react';
import { Layers, Cpu, Database, BarChart3, Sparkles, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activePreset, onSelectPreset, isLoadingPreset }) {
  const tabs = [
    { id: 'chat', label: 'Chat & Live Inspector', icon: Cpu },
    { id: 'comparison', label: 'Scheduler vs Vector RAG', icon: Layers },
    { id: 'memories', label: 'Memory Store', icon: Database },
    { id: 'benchmark', label: 'Benchmark & Sweep', icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Context Scheduler</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">v1.0</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Deterministic Prompt Budget Allocator</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Scenario Preset Switcher */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Demo Scenario:</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              {[
                { id: 'recency_conflict', label: 'Recency Conflict' },
                { id: 'multi_hop', label: 'Multi-Hop' },
                { id: 'redundancy_incident', label: 'Redundant Outage' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPreset(p.id)}
                  disabled={isLoadingPreset}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    activePreset === p.id
                      ? 'bg-slate-800 text-indigo-300 font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
