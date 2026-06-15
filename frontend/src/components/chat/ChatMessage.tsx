import React from 'react';
import { motion } from 'framer-motion';
import { ResultCard } from '../search/ResultCard';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    results?: any[];
    keywords?: string[];
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
      className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[100%] md:max-w-[90%] ${isAssistant ? 'w-full' : 'w-auto'}`}>
        {/* Editorial Meta Label */}
        <div className={`flex items-center gap-6 mb-8 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
          <div className="h-[1px] w-12 bg-[#1A1817]/10" />
          <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[#1A1817]/40 italic">
            {isAssistant ? 'Analysis Suite' : 'Inquiry Vol. I'}
          </span>
        </div>

        {/* Double-Bezel Hard-Architecture Container */}
        <div className={`
          relative 
          ${isAssistant 
            ? 'bg-transparent' 
            : 'p-1.5 md:p-2 rounded-[2rem] md:rounded-[3rem] bg-[#F4F1EA] ring-1 ring-[#1A1817]/[0.02] shadow-[0_20px_50px_rgba(26,24,23,0.03)]'}
        `}>
          <div className={`
            relative p-6 md:p-10 
            ${isAssistant 
              ? 'p-0' 
              : 'bg-[#FDFBF7] rounded-[calc(2rem-0.375rem)] md:rounded-[calc(3rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(26,24,23,0.02)]'}
          `}>
            <div className={`
              text-[18px] md:text-[22px] lg:text-[28px] leading-[1.4] text-[#1A1817] font-medium tracking-tight whitespace-pre-wrap
              ${isAssistant ? 'font-serif text-[24px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[1.25] text-[#1A1817]/90' : ''}
            `}>
              {message.content}
            </div>

            {/* Content Depth: Staggered Bento Architecture */}
            {isAssistant && (
              <div className="mt-12 md:mt-20 space-y-20 md:space-y-32">
                {/* Keywords Tag Cloud - Luxury Editorial Style */}
                {message.keywords && message.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 md:gap-4">
                    {message.keywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="px-4 py-1.5 md:px-6 md:py-2.5 rounded-full bg-[#1A1817]/[0.03] border border-[#1A1817]/[0.05] text-[11px] md:text-[13px] text-[#1A1817]/80 font-bold tracking-widest hover:bg-[#1A1817] hover:text-[#FDFBF7] transition-all duration-700 cursor-default uppercase"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Source Intelligence - Physical Card Cascade */}
                {message.results && message.results.length > 0 && (
                  <div className="space-y-8 md:space-y-16">
                    <div className="flex items-center gap-4 md:gap-10">
                      <h5 className="text-[11px] md:text-[13px] uppercase tracking-[0.3em] md:tracking-[0.5em] font-black text-[#1A1817]/20 whitespace-nowrap">
                        Documented Sources
                      </h5>
                      <div className="h-[1px] md:h-[2px] flex-1 bg-[#1A1817]/[0.03]" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                      {message.results.slice(0, 10).map((res, i) => (
                        <ResultCard key={i} result={res} index={i} />
                      ))}
                    </div>
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
