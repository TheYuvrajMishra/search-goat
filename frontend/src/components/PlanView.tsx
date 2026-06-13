import React from 'react';

interface Approach {
  id: string;
  name: string;
  methodology: string;
  source_types: string[];
  sub_questions: string[];
  seed_queries: string[];
}

interface PlanViewProps {
  plan: {
    query: string;
    approaches: Approach[];
  } | null;
}

export const PlanView: React.FC<PlanViewProps> = ({ plan }) => {
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted font-mono-accent uppercase tracking-widest border border-dashed border-border-strong">
        Waiting for plan...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 brutalist-card">
        <h3 className="text-xs uppercase tracking-widest text-accent font-bold mb-2">Original Query</h3>
        <p className="text-lg font-medium">{plan.query}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plan.approaches.map((approach) => (
          <div key={approach.id} className="brutalist-card flex flex-col">
            <div className="p-4 border-b border-border-default flex items-center justify-between">
              <span className="text-xs font-mono bg-accent text-bg-base px-2 py-0.5 font-bold">APPROACH {approach.id}</span>
              <span className="text-xs uppercase font-bold tracking-tight text-text-secondary">{approach.name}</span>
            </div>
            <div className="p-4 flex-1 space-y-4">
              <section>
                <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Methodology</h4>
                <p className="text-xs leading-relaxed text-text-secondary">{approach.methodology}</p>
              </section>
              <section>
                <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Source Types</h4>
                <div className="flex flex-wrap gap-1">
                  {approach.source_types.map(t => (
                    <span key={t} className="text-[10px] font-mono border border-border-strong px-1.5 py-0.5">{t}</span>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Sub Questions</h4>
                <ul className="list-disc list-inside text-[10px] text-text-secondary space-y-1">
                  {approach.sub_questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </section>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
