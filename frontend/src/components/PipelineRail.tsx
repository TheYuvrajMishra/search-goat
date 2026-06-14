import React from 'react';

const STAGES = [
  'Planning',
  'Researching',
  'Fact Checking',
  'Debating',
  'Synthesizing',
  'Final Fact Check',
  'Finalizing'
];

interface PipelineRailProps {
  stageStatus?: Record<string, 'pending' | 'running' | 'done' | 'error'>;
}

export const PipelineRail: React.FC<PipelineRailProps> = ({ stageStatus = {} }) => {
  return (
    <div className="w-64 h-full border-r border-border-default bg-bg-panel flex flex-col">
      <div className="p-6 border-b border-border-default">
        <h2 className="text-xs uppercase tracking-widest text-text-secondary font-bold">Pipeline</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {STAGES.map((stage) => {
          const status = stageStatus[stage.toLowerCase().replace(/ /g, '_')] || 'pending';
          return (
            <div key={stage} className="flex items-center p-4 border-b border-border-default group">
              <div className={`w-3 h-3 border border-border-strong mr-4 ${
                status === 'running' ? 'bg-accent animate-pulse' :
                status === 'done' ? 'bg-accent' :
                status === 'error' ? 'bg-accent-danger' : 'bg-transparent'
              }`} />
              <span className={`text-sm font-mono-accent ${
                status === 'running' ? 'text-text-primary' : 'text-text-secondary'
              }`}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
