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
            <div className={`
              whitespace-pre-wrap font-medium tracking-tight
              ${isAssistant 
                ? 'font-serif text-[16px] sm:text-[18px] md:text-[20px] lg:text-[24px] leading-[1.35] text-[#1A1817]/90' 
                : 'text-[13px] md:text-[14px] lg:text-[15px] leading-[1.5] text-[#1A1817]'}
            `}>
              {message.content}
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

                {/* Source Intelligence - Physical Card Cascade */}
                {message.results && message.results.length > 0 && (
                  <div className="space-y-6 md:space-y-10">
                    <div className="flex items-center gap-4 md:gap-8">
                      <h5 className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] md:tracking-[0.4em] font-black text-[#1A1817]/20 whitespace-nowrap">
                        Documented Sources
                      </h5>
                      <div className="h-[1px] flex-1 bg-[#1A1817]/[0.03]" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
