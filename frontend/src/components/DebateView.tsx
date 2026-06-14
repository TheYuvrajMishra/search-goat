import React from 'react';

interface Props {
  debate: any;
}

export const DebateView: React.FC<Props> = ({ debate }) => {
  if (!debate) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted font-mono-accent uppercase tracking-widest border border-dashed border-border-strong">
        Debate in progress...
      </div>
    );
  }

  const getApproachColor = (id: string) => {
    switch (id) {
      case 'A': return 'border-l-accent text-accent';
      case 'B': return 'border-l-[var(--accent-warn)] text-[var(--accent-warn)]';
      case 'C': return 'border-l-[var(--accent-info)] text-[var(--accent-info)]';
      default: return 'border-l-border text-text-secondary';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 bg-bg-panel border border-border-strong">
        <h2 className="text-xl font-bold tracking-tighter mb-2">Cross-Examination Debate</h2>
        <p className="text-sm text-text-secondary font-sans leading-relaxed">
          The three research approaches are now critiquing each other's findings to surface contradictions and gaps.
        </p>
      </div>

      <div className="space-y-10">
        {debate.rounds.map((round: any) => (
          <div key={round.round} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-px flex-1 bg-border-strong" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted bg-bg-base px-3">
                Round {round.round}
              </span>
              <div className="h-px flex-1 bg-border-strong" />
            </div>

            <div className="space-y-8">
              {round.critiques.map((critique: any) => {
                const rebuttal = round.rebuttals.find((r: any) => r.to_critique === critique.id);
                return (
                  <div key={critique.id} className="space-y-4">
                    {/* Critique */}
                    <div className={`pl-6 border-l-2 ${getApproachColor(critique.from)} space-y-2`}>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] uppercase font-bold">Approach {critique.from} Critiques Approach {critique.against}</span>
                        <span className={`text-[10px] font-mono border px-1.5 py-0.5 uppercase ${
                          critique.severity === 'high' ? 'border-accent-danger text-accent-danger' : 'border-border-strong text-text-muted'
                        }`}>
                          {critique.severity} SEVERITY
                        </span>
                      </div>
                      <div className="text-sm font-bold text-text-primary">Issue: {critique.issue_type.replace('_', ' ')}</div>
                      <div className="text-sm text-text-secondary leading-relaxed font-sans">{critique.detail}</div>
                      
                      {critique.counter_evidence?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-[10px] font-mono text-text-muted uppercase tracking-tighter">Counter Evidence:</div>
                          {critique.counter_evidence.map((ev: any, i: number) => (
                            <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-accent hover:underline block truncate">
                              [{i+1}] {ev.url}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rebuttal */}
                    {rebuttal && (
                      <div className={`ml-8 pl-6 border-l-2 ${getApproachColor(rebuttal.from)} space-y-2 relative`}>
                        <div className="absolute -top-4 -left-[2px] w-2 h-2 bg-bg-base border-l-2 border-b-2 border-border-strong" />
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] uppercase font-bold">Approach {rebuttal.from} Response</span>
                          {rebuttal.concession && (
                            <span className="text-[10px] font-mono border border-accent text-accent px-1.5 py-0.5 uppercase">
                              CONCESSION
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-text-secondary leading-relaxed font-sans italic">
                          "{rebuttal.response}"
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {debate.unresolved?.length > 0 && (
        <div className="p-6 border border-accent-warn/30 bg-accent-warn/5">
          <h3 className="text-xs font-mono uppercase text-accent-warn mb-4 font-bold tracking-widest">Unresolved Contentions</h3>
          <ul className="space-y-2">
            {debate.unresolved.map((id: string) => (
              <li key={id} className="text-xs text-text-secondary flex items-start">
                <span className="text-accent-warn mr-2">!</span>
                <span>Critique {id} remains unresolved and will be flagged in the synthesis.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
