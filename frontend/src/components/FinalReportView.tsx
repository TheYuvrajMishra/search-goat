import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FactCheckTable } from './FactCheckTable';

interface Props {
  report: any;
  finalFactCheck: any;
}

export const FinalReportView: React.FC<Props> = ({ report, finalFactCheck }) => {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted font-mono-accent uppercase tracking-widest border border-dashed border-border-strong">
        Finalizing report...
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="prose prose-invert max-w-none brutalist-card p-10 bg-bg-panel/50">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report.markdown}
        </ReactMarkdown>
      </div>

      {finalFactCheck && (
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-text-secondary font-bold px-1">Final Fact-Check Audit</h3>
          <FactCheckTable results={finalFactCheck.results} claims={[]} /> {/* claims empty as IDs are in Markdown */}
        </div>
      )}

      <div className="flex justify-end space-x-4 border-t border-border pt-8">
        <button className="px-6 py-2 border border-border hover:bg-bg-elevated text-xs font-mono uppercase tracking-widest transition-colors">
          Export PDF
        </button>
        <button className="px-6 py-2 bg-accent text-bg-base font-bold text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity">
          Download Markdown
        </button>
      </div>
    </div>
  );
};
