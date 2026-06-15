import React from 'react';
import { motion } from 'framer-motion';
import { PiArrowUpRightLight } from 'react-icons/pi';

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
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ 
        duration: 1, 
        delay: index * 0.05,
        ease: [0.32, 0.72, 0, 1] 
      }}
      whileHover={{ y: -4 }}
      className="group block w-full"
    >
      <div className="relative p-6 rounded-[1.5rem] bg-white border border-black/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.02)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div className="flex items-center gap-3">
            {result.favicon ? (
              <img src={result.favicon} alt="" className="w-4 h-4 rounded-sm grayscale group-hover:grayscale-0 transition-all" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-black/5" />
            )}
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 group-hover:text-black/60 transition-colors">
              {result.domain}
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
            <PiArrowUpRightLight className="text-xs" />
          </div>
        </div>
        
        <h4 className="text-[17px] font-bold text-black tracking-tight leading-[1.3] mb-3 group-hover:text-black/70 transition-colors">
          {result.title}
        </h4>
        
        <p className="text-[14px] text-black/50 leading-relaxed font-medium line-clamp-2">
          {result.snippet}
        </p>
        
        {result.matchedQuery && (
          <div className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="w-1 h-1 rounded-full bg-black/20" />
            <span className="text-[10px] text-black/20 font-bold uppercase tracking-widest">
              Relevant to: {result.matchedQuery}
            </span>
          </div>
        )}
      </div>
    </motion.a>
  );
};
