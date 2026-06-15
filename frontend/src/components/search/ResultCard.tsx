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
      initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ 
        duration: 1.2, 
        delay: index * 0.08,
        ease: [0.32, 0.72, 0, 1] 
      }}
      className="group block w-full h-full"
    >
      <div className="relative p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-[#FDFBF7] border border-[#1A1817]/[0.05] shadow-[0_20px_80px_rgba(26,24,23,0.02)] group-hover:shadow-[0_40px_100px_rgba(26,24,23,0.06)] group-hover:border-[#1A1817]/[0.1] transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-2 h-full flex flex-col justify-between min-h-[320px] md:min-h-[400px]">
        <div>
          {/* Source Branding */}
          <div className="flex items-start justify-between gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#1A1817]/[0.02] flex items-center justify-center border border-[#1A1817]/[0.03] flex-shrink-0">
                {result.favicon ? (
                  <img src={result.favicon} alt="" className="w-4 h-4 md:w-5 md:h-5 grayscale group-hover:grayscale-0 transition-all duration-700" />
                ) : (
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#1A1817]/10" />
                )}
              </div>
              <span className="text-[10px] md:text-[12px] uppercase tracking-[0.3em] font-black text-[#1A1817]/30 group-hover:text-[#1A1817]/60 transition-colors truncate">
                {result.domain}
              </span>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1A1817] text-[#FDFBF7] flex items-center justify-center translate-x-2 md:translate-x-4 -translate-y-2 md:-translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] flex-shrink-0">
              <PiArrowUpRightLight className="text-lg md:text-xl" />
            </div>
          </div>
          
          <h4 className="text-[20px] md:text-[28px] font-serif font-medium text-[#1A1817] leading-[1.3] mb-4 md:mb-6 group-hover:text-[#1A1817]/80 transition-colors tracking-tight line-clamp-2">
            {result.title}
          </h4>
          
          <p className="text-[15px] md:text-[17px] text-[#1A1817]/50 leading-[1.6] font-medium line-clamp-3">
            {result.snippet}
          </p>
        </div>
        
        {/* Contextual Link Label */}
        <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-[#1A1817]/[0.03]">
          <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-bold text-[#1A1817]/20 group-hover:text-[#1A1817] transition-colors duration-700">
            Read Full Intelligence
          </span>
        </div>
      </div>
    </motion.a>
  );
};
