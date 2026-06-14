import React, { useState, useEffect } from 'react';
import { PipelineRail } from './components/PipelineRail';
import { InspectorPanel } from './components/InspectorPanel';
import { useRunEvents } from './hooks/useRunEvents';
import { PlanView } from './components/PlanView';
import { DraftReportView } from './components/DraftReportView';
import { DebateView } from './components/DebateView';
import { FinalReportView } from './components/FinalReportView';
import { RegistryEditor } from './components/RegistryEditor';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('plan');
  const [runId, setRunId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [factchecks, setFactchecks] = useState<Record<string, any>>({});
  const [debate, setDebate] = useState<any>(null);
  const [synthesis, setSynthesis] = useState<any>(null);
  const [finalFactCheck, setFinalFactCheck] = useState<any>(null);
  const [finalReport, setFinalReport] = useState<any>(null);

  const { stageStatus, progress, currentStage } = useRunEvents(runId);

  // Auto-switch tabs based on progress
  useEffect(() => {
    if (currentStage === 'planning' && activeTab !== 'plan') setActiveTab('plan');
    if (currentStage === 'researching' && activeTab === 'plan') setActiveTab('drafts');
  }, [currentStage]);

  // Fetch plan and drafts when they are ready
  useEffect(() => {
    if (!runId) return;

    const fetchPlan = async () => {
      try {
        const response = await fetch(`http://localhost:3002/runs/${runId}/plan.json`);
        if (response.ok) {
          const data = await response.json();
          setPlan(data);
        }
      } catch (err) {}
    };

    const fetchDraft = async (id: string) => {
      try {
        const response = await fetch(`http://localhost:3002/runs/${runId}/drafts/${id}.json`);
        if (response.ok) {
          const data = await response.json();
          setDrafts(prev => ({ ...prev, [id]: data }));
        }
      } catch (err) {}
    };

    const fetchFactCheck = async (id: string) => {
      try {
        const response = await fetch(`http://localhost:3002/runs/${runId}/factchecks/${id}.json`);
        if (response.ok) {
          const data = await response.json();
          setFactchecks(prev => ({ ...prev, [id]: data }));
        }
      } catch (err) {}
    };

    const fetchDebate = async () => {
      try {
        const response = await fetch(`http://localhost:3002/runs/${runId}/debate.json`);
        if (response.ok) {
          const data = await response.json();
          setDebate(data);
        }
      } catch (err) {}
    };

    const fetchSynthesis = async () => {
      try {
        const response = await fetch(`http://localhost:3002/runs/${runId}/synthesis.json`);
        if (response.ok) {
          const data = await response.json();
          setSynthesis(data);
        }
      } catch (err) {}
    };

    const fetchFinalFactCheck = async () => {
      try {
        const response = await fetch(`http://localhost:3002/runs/${runId}/final_factcheck.json`);
        if (response.ok) {
          const data = await response.json();
          setFinalFactCheck(data);
        }
      } catch (err) {}
    };

    const fetchFinalReport = async () => {
      try {
        const response = await fetch(`http://localhost:3002/runs/${runId}/final_report.json`);
        if (response.ok) {
          const data = await response.json();
          setFinalReport(data);
        }
      } catch (err) {}
    };

    if (stageStatus['planning'] === 'done' && !plan) fetchPlan();
    if (stageStatus['researching'] === 'running' || stageStatus['researching'] === 'done') {
      ['A', 'B', 'C'].forEach(id => {
        if (!drafts[id]) fetchDraft(id);
      });
    }
    if (stageStatus['fact_checking'] === 'running' || stageStatus['fact_checking'] === 'done') {
      ['A', 'B', 'C'].forEach(id => {
        if (!factchecks[id]) fetchFactCheck(id);
      });
    }
    if (stageStatus['debating'] === 'running' || stageStatus['debating'] === 'done') {
      if (!debate) fetchDebate();
    }
    if (stageStatus['synthesizing'] === 'running' || stageStatus['synthesizing'] === 'done') {
      if (!synthesis) fetchSynthesis();
    }
    if (stageStatus['final_fact_check'] === 'running' || stageStatus['final_fact_check'] === 'done') {
      if (!finalFactCheck) fetchFinalFactCheck();
    }
    if (stageStatus['finalizing'] === 'running' || stageStatus['finalizing'] === 'done' || stageStatus['done'] === 'done') {
      if (!finalReport) fetchFinalReport();
    }
  }, [runId, stageStatus]);

  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'debate', label: 'Debate' },
    { id: 'synthesis', label: 'Synthesis' },
    { id: 'final', label: 'Final Report' },
    { id: 'registry', label: 'Registry' },
  ];

  const startRun = async () => {
    if (!query) return;
    setPlan(null);
    setDrafts({});
    
    try {
      const response = await fetch('http://localhost:3002/api/runs', {
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

  const renderContent = () => {
    switch (activeTab) {
      case 'plan':
        return <PlanView plan={plan} />;
      case 'drafts':
        return <DraftReportView drafts={drafts} factchecks={factchecks} />;
      case 'debate':
        return <DebateView debate={debate} />;
      case 'synthesis':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-bg-panel border border-border-strong">
              <h2 className="text-xl font-bold tracking-tighter mb-2">Synthesized Draft</h2>
              <p className="text-sm text-text-secondary font-sans leading-relaxed">
                The master researcher is consolidating findings and resolving contentions.
              </p>
            </div>
            <DraftReportView 
              drafts={synthesis ? { S: { ...synthesis, approach_id: 'S', claims: [] } } : {}} 
              factchecks={finalFactCheck ? { S: finalFactCheck } : {}}
            />
          </div>
        );
      case 'final':
        return <FinalReportView report={finalReport} finalFactCheck={finalFactCheck} />;
      case 'registry':
        return <RegistryEditor />;
      default:
        return (
          <div className="h-64 border border-dashed border-border-strong flex items-center justify-center text-text-muted font-mono-accent uppercase tracking-widest">
            Content area for: {activeTab}
          </div>
        );
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
          
          <nav className="flex space-x-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-mono-accent border-t border-l border-r border-transparent -mb-[1px] whitespace-nowrap ${
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
                  className="bg-accent text-bg-base font-bold px-6 py-2 uppercase tracking-tighter hover:opacity-90 transition-opacity"
                >
                  Run
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto min-h-full">
              <div className="mb-8 p-4 border border-accent/20 bg-accent/5 font-mono text-xs text-accent flex justify-between items-center">
                <span>{currentStage ? `[${currentStage.toUpperCase()}]` : 'INITIALIZING...'} {progress}% Complete</span>
                <span className="animate-pulse">● LIVE</span>
              </div>
              {renderContent()}
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
