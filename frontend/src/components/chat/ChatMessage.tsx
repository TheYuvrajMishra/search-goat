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
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'} mb-8`}
    >
      <div className={`max-w-[85%] ${isAssistant ? 'w-full' : 'w-auto'}`}>
        {/* Role Eyebrow Tag */}
        <div className={`flex items-center mb-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
          <span className="px-3 py-1 rounded-full bg-white/[0.03] ring-1 ring-white/10 text-[9px] uppercase tracking-[0.2em] font-medium text-white/30">
            {isAssistant ? 'Synthesis' : 'Query'}
          </span>
        </div>

        {/* Message Content Bubble */}
        <div className={`
          relative p-6 rounded-[2rem] 
          ${isAssistant 
            ? 'bg-transparent border-l-2 border-white/5 pl-8 rounded-l-none' 
            : 'bg-white/[0.03] ring-1 ring-white/10 shadow-2xl backdrop-blur-md'}
        `}>
          <div className="text-[15px] leading-relaxed text-white/90 font-light whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Assistant Metadata: Keywords & Results */}
          {isAssistant && message.keywords && message.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {message.keywords.map((kw, i) => (
                <span key={i} className="text-[10px] text-emerald-400/60 font-mono italic">
                  #{kw.replace(/\s+/g, '').toLowerCase()}
                </span>
              ))}
            </div>
          )}

          {isAssistant && message.results && message.results.length > 0 && (
            <div className="mt-8">
              <div className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/20 mb-4 ml-1">
                Contextual Sources
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {message.results.slice(0, 4).map((res, i) => (
                  <ResultCard key={i} result={res} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
