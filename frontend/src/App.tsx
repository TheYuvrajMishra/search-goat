import React, { useState } from 'react';
import { PipelineRail } from './components/PipelineRail';
import { InspectorPanel } from './components/InspectorPanel';
import { useRunEvents } from './hooks/useRunEvents';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('plan');
  const [runId, setRunId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const { stageStatus, progress, currentStage } = useRunEvents(runId);

  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'debate', label: 'Debate' },
    { id: 'synthesis', label: 'Synthesis' },
    { id: 'final', label: 'Final Report' },
  ];

  const startRun = async () => {
    if (!query) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setRunId(data.runId);
    } catch (error) {
      console.error('Failed to start run:', error);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-bg-base overflow-hidden">
      {/* Sidebar / Pipeline Rail */}
      <PipelineRail stageStatus={stageStatus} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header / Tabs */}
        <header className="border-b border-border-default bg-bg-panel px-6 pt-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold tracking-tighter text-text-primary">
              search-goat <span className="text-accent">/</span> research-run
            </h1>
            <div className="font-mono-accent text-text-muted">
              {runId ? `ID: ${runId}` : 'No active run'}
            </div>
          </div>
          
          <nav className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-mono-accent border-t border-l border-r border-transparent -mb-[1px] ${
                  activeTab === tab.id
                    ? 'border-border-default bg-bg-base text-accent border-b-2 border-b-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-10">
          {!runId ? (
            <div className="max-w-2xl mx-auto mt-20 p-8 border border-border-default bg-bg-panel">
              <h2 className="text-lg font-bold mb-4 font-mono-accent">Start New Research</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter research query..."
                  className="flex-1 bg-bg-base border border-border-default p-3 text-text-primary focus:outline-none focus:border-accent font-sans"
                  onKeyDown={(e) => e.key === 'Enter' && startRun()}
                />
                <button
                  onClick={startRun}
                  className="bg-accent text-bg-base font-bold px-6 py-2 uppercase tracking-tighter hover:opacity-90"
                >
                  Run
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <div className="mb-8 p-4 border border-accent/20 bg-accent/5 font-mono text-xs text-accent">
                {currentStage ? `[${currentStage.toUpperCase()}]` : 'INITIALIZING...'} {progress}% Complete
              </div>
              <div className="flex-1 border border-dashed border-border-strong flex items-center justify-center text-text-muted font-mono-accent uppercase tracking-widest">
                Content area for: {activeTab}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Rail / Inspector */}
      <InspectorPanel />
    </div>
  );
};

export default App;
