import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatusLegend from './components/StatusLegend';
import ChatPane from './components/ChatPane';
import LiveInspector from './components/LiveInspector';
import ComparisonView from './components/ComparisonView';
import MemoryManager from './components/MemoryManager';
import BenchmarkView from './components/BenchmarkView';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [activePreset, setActivePreset] = useState('recency_conflict');
  const [query, setQuery] = useState('Who is the primary contact for Engineering?');
  const [budget, setBudget] = useState(50);
  const [queryResult, setQueryResult] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);

  // Fetch memories from backend
  const fetchMemories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/memories`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    }
  };

  // Run Query
  const handleRunQuery = async (queryText, maxTokens) => {
    setIsQuerying(true);
    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          max_tokens: maxTokens,
          generate_llm: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQueryResult(data);
      }
    } catch (err) {
      console.error('Error running query:', err);
    } finally {
      setIsQuerying(false);
    }
  };

  // Seed Preset Scenarios
  const handleSelectPreset = async (presetName) => {
    setIsLoadingPreset(true);
    setActivePreset(presetName);
    try {
      const res = await fetch(`${API_BASE}/api/seed_preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_name: presetName })
      });
      if (res.ok) {
        await fetchMemories();
        
        // Auto-populate query matching the preset
        let nextQuery = 'Who is the primary contact for Engineering?';
        if (presetName === 'multi_hop') {
          nextQuery = 'Why did we choose Nuxt for Project Zeta?';
        } else if (presetName === 'redundancy_incident') {
          nextQuery = 'What happened to the Auth service?';
        }
        setQuery(nextQuery);
        handleRunQuery(nextQuery, budget);
      }
    } catch (err) {
      console.error('Error loading preset:', err);
    } finally {
      setIsLoadingPreset(false);
    }
  };

  // Add Custom Memory
  const handleAddMemory = async (content, type, timestamp) => {
    try {
      const res = await fetch(`${API_BASE}/api/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, timestamp })
      });
      if (res.ok) {
        await fetchMemories();
      }
    } catch (err) {
      console.error('Error adding memory:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMemories();
    handleRunQuery(query, 50);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area with generous spacing rhythm */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Always-visible Persistent Decision States Legend */}
        <StatusLegend />

        {/* Tab 1: Chat + Live Debug Inspector */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Chat & Query Pane (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <ChatPane
                query={query}
                setQuery={setQuery}
                budget={budget}
                setBudget={setBudget}
                onRunQuery={handleRunQuery}
                isQuerying={isQuerying}
                queryResult={queryResult}
                activePreset={activePreset}
                onSelectPreset={handleSelectPreset}
                isLoadingPreset={isLoadingPreset}
              />
            </div>

            {/* Right Column: Live Engine Inspector (7 cols) */}
            <div className="lg:col-span-7">
              <LiveInspector
                queryResult={queryResult}
              />
            </div>

          </div>
        )}

        {/* Tab 2: Context Scheduler vs Vector RAG Comparison */}
        {activeTab === 'comparison' && (
          <ComparisonView
            queryResult={queryResult}
          />
        )}

        {/* Tab 3: Memory Store Explorer */}
        {activeTab === 'memories' && (
          <MemoryManager
            memories={memories}
            onAddMemory={handleAddMemory}
            onSelectPreset={handleSelectPreset}
            activePreset={activePreset}
            isLoadingPreset={isLoadingPreset}
          />
        )}

        {/* Tab 4: Benchmark Suite & Metrics */}
        {activeTab === 'benchmark' && (
          <BenchmarkView />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-[#060913]/90 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <span>Context Scheduler • Deterministic Memory &amp; Token Budget Optimization</span>
          <span className="font-mono text-[11px] text-slate-500">Python 3.10+ • FAISS • SentenceTransformers • Groq</span>
        </div>
      </footer>

    </div>
  );
}
