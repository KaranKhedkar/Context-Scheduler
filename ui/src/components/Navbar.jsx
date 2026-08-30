import React from 'react';
import { Layers, Cpu, Database, BarChart3 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'chat', label: 'Chat & Live Inspector', icon: Cpu },
    { id: 'comparison', label: 'Scheduler vs Vector RAG', icon: Layers },
    { id: 'memories', label: 'Memory Store', icon: Database },
    { id: 'benchmark', label: 'Benchmark & Sweep', icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-800/60 bg-[#060913]/85 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">Context Scheduler</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">v1.0</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60 shadow-sm shadow-black/20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ease-out ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}
