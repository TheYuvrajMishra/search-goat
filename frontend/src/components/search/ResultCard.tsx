import React from 'react';
import { motion } from 'framer-motion';
import { PiArrowSquareOutLight } from 'react-icons/pi';

interface ResultCardProps {
  result: {
    title: string;
    url: string;
    domain: string;
    favicon: string;
    snippet: string;
    matchedQuery?: string;
  };
  index: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.1,
        ease: [0.32, 0.72, 0, 1] 
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="block w-full"
    >
      <div className="p-1 rounded-[1.5rem] bg-white/[0.02] ring-1 ring-white/5 hover:ring-white/20 transition-all duration-500">
        <div className="p-4 bg-[#0d0d0d] rounded-[calc(1.5rem-0.25rem)] shadow-inner">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              {result.favicon && (
                <img src={result.favicon} alt="" className="w-4 h-4 rounded-sm" />
              )}
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/30 truncate max-w-[150px]">
                {result.domain}
              </span>
            </div>
            <PiArrowSquareOutLight className="text-white/20 text-sm flex-shrink-0" />
          </div>
          
          <h4 className="text-[15px] font-medium text-white/90 leading-tight mb-2 group-hover:text-emerald-400 transition-colors">
            {result.title}
          </h4>
          
          <p className="text-[13px] text-white/40 leading-relaxed line-clamp-2 font-light">
            {result.snippet}
          </p>
          
          {result.matchedQuery && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
              <span className="text-[9px] text-white/20 italic truncate">
                Matched: {result.matchedQuery}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.a>
  );
};
