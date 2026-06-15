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
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
      className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[90%] md:max-w-[80%] ${isAssistant ? 'w-full' : 'w-auto'}`}>
        {/* Role & Role Icon */}
        <div className={`flex items-center gap-3 mb-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
          {isAssistant && (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          )}
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-white/30">
            {isAssistant ? 'Assistant Synthesis' : 'User Request'}
          </span>
          {!isAssistant && (
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`
          relative 
          ${isAssistant 
            ? 'bg-transparent border-l border-white/10 pl-8' 
            : 'bg-white/[0.03] ring-1 ring-white/10 p-6 rounded-[2rem] shadow-2xl backdrop-blur-xl'}
        `}>
          <div className={`
            text-[16px] leading-[1.6] text-white/90 font-light whitespace-pre-wrap
            ${isAssistant ? 'tracking-wide' : ''}
          `}>
            {message.content}
          </div>

          {/* Assistant Metadata */}
          {isAssistant && (
            <div className="mt-8 space-y-10">
              {/* Keywords Tag Cloud */}
              {message.keywords && message.keywords.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {message.keywords.map((kw, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-emerald-400/60 font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Contextual Results Grid */}
              {message.results && message.results.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/20 whitespace-nowrap">
                      Source Intelligence
                    </span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
    </motion.div>
  );
};
