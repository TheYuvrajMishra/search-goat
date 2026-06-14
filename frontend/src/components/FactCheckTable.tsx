import React from 'react';

interface FactCheckResult {
  claim_id: string;
  verdict: 'Verified' | 'Partially Verified' | 'Unverified' | 'Contradicted' | 'Outdated';
  confidence: number;
  evidence: Array<{
    url: string;
    note: string;
    stance: 'supports' | 'contradicts';
  }>;
}

interface Props {
  results: FactCheckResult[];
  claims: any[];
}

export const FactCheckTable: React.FC<Props> = ({ results, claims }) => {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Verified': return 'text-[var(--accent)] border-[var(--accent)]';
      case 'Partially Verified': return 'text-[var(--accent-warn)] border-[var(--accent-warn)]';
      case 'Contradicted': return 'text-[var(--accent-danger)] border-[var(--accent-danger)]';
      case 'Unverified':
      case 'Outdated': return 'text-[var(--accent-info)] border-[var(--accent-info)]';
      default: return 'text-text-muted border-border';
    }
  };

  return (
    <div className="mt-8 border border-border">
      <div className="bg-bg-panel p-4 border-b border-border">
        <h3 className="text-xs uppercase tracking-widest font-mono-accent text-text-secondary">Fact-Check Verification</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-panel/50">
              <th className="p-4 text-xs font-mono-accent uppercase text-text-muted w-1/2">Claim</th>
              <th className="p-4 text-xs font-mono-accent uppercase text-text-muted">Verdict</th>
              <th className="p-4 text-xs font-mono-accent uppercase text-text-muted">Confidence</th>
              <th className="p-4 text-xs font-mono-accent uppercase text-text-muted">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {results.map((res) => {
              const claim = claims.find(c => c.id === res.claim_id);
              return (
                <tr key={res.claim_id} className="border-b border-border hover:bg-bg-panel/30 transition-colors">
                  <td className="p-4">
                    <div className="text-sm text-text-primary mb-1">{claim?.text || 'Unknown claim'}</div>
                    <div className="text-[10px] font-mono text-text-muted uppercase">ID: {res.claim_id}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 border text-[10px] font-mono uppercase ${getVerdictColor(res.verdict)}`}>
                      {res.verdict}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="w-24 h-1.5 bg-border relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-accent" 
                        style={{ width: `${res.confidence * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono mt-1 text-text-muted">{(res.confidence * 100).toFixed(0)}%</div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      {res.evidence.map((ev, i) => (
                        <div key={i} className="group">
                          <a 
                            href={ev.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-accent hover:underline block truncate max-w-[200px]"
                          >
                            {ev.url}
                          </a>
                          <div className="text-[10px] text-text-muted italic leading-tight mt-0.5">
                            {ev.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
