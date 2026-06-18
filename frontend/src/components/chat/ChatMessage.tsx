import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultCard } from '../search/ResultCard';
import { MapsResultTable } from '../search/MapsResultTable';

interface ChatMessageProps {
  message: {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    results?: any[];
    keywords?: string[];
    report?: string | null;
  };
  isGeneratingReport?: boolean;
  onGenerateReport?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isGeneratingReport = false, 
  onGenerateReport 
}) => {
  const isAssistant = message.role === 'assistant';
  const [activeTab, setActiveTab] = React.useState<'synthesis' | 'report' | 'sources'>('synthesis');

  React.useEffect(() => {
    if (message.report) {
      setActiveTab('report');
    }
  }, [message.report]);

  const hasResults = message.results && message.results.length > 0;
  const isMapsResults = hasResults && 'name' in message.results![0] && 'address' in message.results![0];
  const hasReport = !!message.report;
  const canGenerateReport = hasResults && !isMapsResults && !hasReport && onGenerateReport;

  // Helper to color/style citations [Source X] in text
  const formatCitations = (text: string) => {
    const parts = text.split(/(\[Source \d+\])/g);
    return parts.map((part, i) => {
      if (part.match(/\[Source \d+\]/)) {
        return (
          <span 
            key={i} 
            className="px-1.5 py-0.5 rounded bg-[#5D6355]/10 border border-[#5D6355]/20 text-[9px] font-bold text-[#5D6355] mx-0.5 inline-block align-middle"
          >
            {part.replace('[', '').replace(']', '')}
          </span>
        );
      }
      return part;
    });
  };

  // Simple custom Markdown-like parser/renderer for reports
  const renderReport = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      // H2 Headings
      if (trimmed.startsWith('## ')) {
        return (
          <h2 
            key={index} 
            className="text-[16px] sm:text-[18px] md:text-[20px] font-bold tracking-wider text-[#1A1817] border-b border-[#1A1817]/10 pb-2 mt-8 mb-4 font-serif"
          >
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      
      // H3 Headings
      if (trimmed.startsWith('### ')) {
        return (
          <h3 
            key={index} 
            className="text-[14px] sm:text-[15px] md:text-[16px] font-bold text-[#1A1817] mt-6 mb-3 font-serif"
          >
            {trimmed.replace('### ', '')}
          </h3>
        );
      }

      // Strong paragraphs
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p 
            key={index} 
            className="font-bold text-[#1A1817] text-[14px] sm:text-[16px] md:text-[18px] leading-[1.6] font-serif"
          >
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }

      // Lists/Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        const cleanContent = formatCitations(content);
        return (
          <div key={index} className="flex gap-3 pl-2 my-2.5">
            <span className="text-[#5D6355] mt-1.5 flex-shrink-0 text-[8px]">•</span>
            <span className="text-[14px] sm:text-[15px] md:text-[16px] leading-[1.6] text-[#1A1817]/80 font-serif">
              {cleanContent}
            </span>
          </div>
        );
      }

      // Empty lines
      if (!trimmed) {
        return <div key={index} className="h-2" />;
      }

      // Normal paragraph
      const cleanContent = formatCitations(trimmed);
      return (
        <p 
          key={index} 
          className="text-[14px] sm:text-[16px] md:text-[18px] leading-[1.6] text-[#1A1817]/85 font-serif"
        >
          {cleanContent}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
      className={`chat-message-container flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[100%] md:max-w-[90%] ${isAssistant ? 'w-full' : 'w-auto'}`}>

        {/* Double-Bezel Hard-Architecture Container */}
        <div className={`
          relative 
          ${isAssistant 
            ? 'bg-transparent' 
            : 'p-1 rounded-[2rem] md:rounded-[2.5rem] bg-[#F4F1EA] ring-1 ring-[#1A1817]/[0.02] shadow-[0_20px_50px_rgba(26,24,23,0.03)]'}
        `}>
          <div className={`
            relative 
            ${isAssistant 
              ? 'p-0' 
              : 'p-4 md:p-6 bg-[#FDFBF7] rounded-[calc(2rem-0.25rem)] md:rounded-[calc(2.5rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(26,24,23,0.02)]'}
          `}>
            
            {/* Tab Bar - Sleek Premium Minimalist */}
            {isAssistant && hasResults && (
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1A1817]/[0.05]">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('synthesis')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 border ${
                      activeTab === 'synthesis'
                        ? 'bg-[#1A1817] text-[#FDFBF7] border-[#1A1817]'
                        : 'bg-transparent text-[#1A1817]/60 border-transparent hover:text-[#1A1817]'
                    }`}
                  >
                    Synthesis
                  </button>
                  {hasReport && (
                    <button
                      onClick={() => setActiveTab('report')}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 border ${
                        activeTab === 'report'
                          ? 'bg-[#1A1817] text-[#FDFBF7] border-[#1A1817]'
                          : 'bg-transparent text-[#1A1817]/60 border-transparent hover:text-[#1A1817]'
                      }`}
                    >
                      Deep Report
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('sources')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 border ${
                      activeTab === 'sources'
                        ? 'bg-[#1A1817] text-[#FDFBF7] border-[#1A1817]'
                        : 'bg-transparent text-[#1A1817]/60 border-transparent hover:text-[#1A1817]'
                    }`}
                  >
                    {isMapsResults ? 'Business Leads' : 'Sources'}
                  </button>
                </div>

                {/* Report Generation Trigger */}
                {canGenerateReport && (
                  <button
                    onClick={onGenerateReport}
                    disabled={isGeneratingReport}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase border transition-all duration-500 cursor-pointer ${
                      isGeneratingReport
                        ? 'bg-[#1A1817]/[0.03] text-[#1A1817]/40 border-[#1A1817]/10 cursor-not-allowed'
                        : 'bg-transparent text-[#5D6355] border-[#5D6355]/30 hover:bg-[#5D6355] hover:text-[#FDFBF7] hover:border-[#5D6355] shadow-sm'
                    }`}
                  >
                    {isGeneratingReport ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1A1817]/30 border border-[#1A1817]/40 animate-ping" />
                        Scraping & Synthesizing...
                      </>
                    ) : (
                      'Generate Deep Report'
                    )}
                  </button>
                )}
              </div>
            )}

            <div className="relative">
              <AnimatePresence mode="wait">
                {/* Synthesis Tab */}
                {(!isAssistant || !hasResults || activeTab === 'synthesis') && (
                  <motion.div
                    key="synthesis"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className={`whitespace-pre-wrap font-medium tracking-tight
                      ${isAssistant 
                        ? 'font-serif text-[16px] sm:text-[18px] md:text-[20px] lg:text-[24px] leading-[1.35] text-[#1A1817]/90' 
                        : 'text-[13px] md:text-[14px] lg:text-[15px] leading-[1.5] text-[#1A1817]'}
                    `}
                  >
                    {message.content}
                  </motion.div>
                )}

                {/* Deep Report Tab */}
                {isAssistant && hasResults && activeTab === 'report' && message.report && (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="prose prose-stone max-w-none font-serif text-[#1A1817]/90"
                  >
                    <div className="report-content-body space-y-6">
                      {renderReport(message.report)}
                    </div>
                  </motion.div>
                )}

                {/* Sources Tab */}
                {isAssistant && hasResults && activeTab === 'sources' && (
                  <motion.div
                    key="sources"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    {isMapsResults ? (
                      <MapsResultTable businesses={message.results!} />
                    ) : (
                      <div className="space-y-6 md:space-y-10">
                        <div className="flex items-center gap-4 md:gap-8">
                          <h5 className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] md:tracking-[0.4em] font-black text-[#1A1817]/20 whitespace-nowrap">
                            Documented Sources
                          </h5>
                          <div className="h-[1px] flex-1 bg-[#1A1817]/[0.03]" />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                          {message.results!.slice(0, 10).map((res, i) => (
                            <ResultCard key={i} result={res} index={i} />
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content Depth: Staggered Bento Architecture */}
            {isAssistant && (
              <div className="mt-8 md:mt-12 space-y-12 md:space-y-16">
                {/* Keywords Tag Cloud - Luxury Editorial Style */}
                {message.keywords && message.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {message.keywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="px-3.5 py-1 md:px-4 md:py-1.5 rounded-full bg-[#1A1817]/[0.03] border border-[#1A1817]/[0.05] text-[9px] md:text-[10px] text-[#1A1817]/80 font-bold tracking-widest hover:bg-[#1A1817] hover:text-[#FDFBF7] transition-all duration-700 cursor-default uppercase"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
