import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Source {
  id: number;
  url: string;
  title: string;
  accessed_at: string;
  snippet: string;
}

interface DraftReport {
  approach_id: string;
  title: string;
  markdown: string;
  sources: Source[];
}

interface DraftReportViewProps {
  drafts: Record<string, DraftReport>;
}

export const DraftReportView: React.FC<DraftReportViewProps> = ({ drafts }) => {
  const [selectedId, setSelectedId] = React.useState('A');
  const draft = drafts[selectedId];

  if (Object.keys(drafts).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted font-mono-accent uppercase tracking-widest border border-dashed border-border-strong">
        Waiting for drafts...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex space-x-1 p-1 bg-bg-panel brutalist-border w-fit">
        {['A', 'B', 'C'].map(id => (
          <button
            key={id}
            onClick={() => setSelectedId(id)}
            disabled={!drafts[id]}
            className={`px-4 py-1 text-xs font-mono-accent border ${
              selectedId === id
                ? 'bg-accent text-bg-base border-accent'
                : drafts[id]
                  ? 'text-text-secondary hover:text-text-primary border-transparent'
                  : 'text-text-muted border-transparent cursor-not-allowed'
            }`}
          >
            Draft {id}
          </button>
        ))}
      </div>

      {!draft ? (
        <div className="p-10 border border-dashed border-border-strong text-center text-text-muted font-mono-accent">
          Research in progress for Approach {selectedId}...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="prose prose-invert max-w-none brutalist-card p-8">
              <h1 className="text-2xl font-bold tracking-tighter mb-6 border-b border-border-default pb-4">
                {draft.title}
              </h1>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {draft.markdown}
              </ReactMarkdown>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-text-secondary font-bold px-1">Sources Cited</h3>
            <div className="space-y-3">
              {draft.sources.map((source) => (
                <div key={source.id} className="brutalist-card p-4 text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-mono bg-bg-elevated px-1.5 py-0.5 border border-border-strong">[{source.id}]</span>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-mono truncate ml-2 flex-1">
                      {source.url.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                  <div className="font-bold text-text-primary truncate">{source.title}</div>
                  <div className="text-text-muted line-clamp-2 italic">"{source.snippet}"</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
