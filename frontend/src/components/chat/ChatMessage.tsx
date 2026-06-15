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
      initial={{ opacity: 0, y: 40, filter: 'blur(15px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
      className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[100%] md:max-w-[85%] ${isAssistant ? 'w-full' : 'w-auto'}`}>
        {/* Meta Label */}
        <div className={`flex items-center gap-4 mb-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-black/40">
            {isAssistant ? 'Synthesized Intelligence' : 'User Query'}
          </span>
          <div className="h-[1px] w-8 bg-black/10" />
        </div>

        {/* Message Architecture (Double-Bezel) */}
        <div className={`
          relative 
          ${isAssistant 
            ? 'bg-transparent' 
            : 'p-1.5 rounded-[2rem] bg-[#F5F5F7] ring-1 ring-black/[0.05] shadow-sm'}
        `}>
          <div className={`
            relative p-6 
            ${isAssistant 
              ? 'p-0' 
              : 'bg-white rounded-[calc(2rem-0.375rem)] shadow-inner'}
          `}>
            <div className={`
              text-[16px] md:text-[18px] leading-[1.6] text-black font-medium tracking-tight whitespace-pre-wrap
              ${isAssistant ? 'font-serif text-[24px] md:text-[32px] leading-[1.35] text-black/90' : ''}
            `}>
              {message.content}
            </div>

            {/* Content Extensions */}
            {isAssistant && (
              <div className="mt-12 space-y-16">
                {/* Keywords Tag Cloud */}
                {message.keywords && message.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {message.keywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="px-4 py-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.05] text-[11px] text-black/70 font-bold tracking-wide hover:bg-black hover:text-white transition-all duration-500 cursor-default"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Source Grid */}
                {message.results && message.results.length > 0 && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-6">
                      <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-black/20 whitespace-nowrap">
                        Documented Sources
                      </span>
                      <div className="h-[1px] flex-1 bg-black/5" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
