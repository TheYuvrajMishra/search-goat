import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiXLight, PiUserLight, PiArrowUpRightLight } from 'react-icons/pi';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onHistoryClick: (query: string) => void;
}

const dummyHistories = [
  { query: "Decentralized Energy Grids in Northern Europe", date: "June 15, 2026" },
  { query: "Global Semiconductor Supply Chains Vol. IV", date: "June 14, 2026" },
  { query: "Neo-Classical Architecture Trends in Baltic Cities", date: "June 12, 2026" },
  { query: "Artificial Intelligence Copyright Law Review", date: "June 10, 2026" },
  { query: "Synthetic Biology Regulation Frameworks", date: "June 05, 2026" },
  { query: "Quantum Cryptography Standards", date: "May 28, 2026" },
];

// Stagger variants for the history items cascade reveal
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)', 
    transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] } 
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  onHistoryClick 
}) => {

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="flex flex-col gap-8">
        {/* Sidebar Header with Subheading Pill */}
        <div className="flex items-center justify-between pb-6 border-b border-[#1A1817]/[0.05]">
          <div className="flex flex-col gap-1.5">
            <span className="w-max rounded-full px-2 py-0.5 bg-[#1A1817]/[0.03] border border-[#1A1817]/[0.05] text-[7.5px] uppercase tracking-[0.2em] font-black text-[#1A1817]/50">
              Session Desk
            </span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-[20px] sm:text-[22px] leading-none font-serif font-medium tracking-[-0.04em] text-[#1A1817]">
                Search<span className="text-[#1A1817]/50 italic ml-[0.01em]">Goat</span>
              </h2>
              <span className="text-[8px] uppercase tracking-[0.2em] font-black text-[#1A1817]/30 mt-1">
                Hub
              </span>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden p-1.5 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/50 hover:text-[#1A1817] transition-all duration-350 cursor-pointer"
          >
            <PiXLight className="text-lg" />
          </button>
        </div>

        {/* Intelligence Histories */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-[#1A1817]/30">
            Archives & Syntheses
          </h3>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2 max-h-[52vh] overflow-y-auto scrollbar-hide"
          >
            {dummyHistories.map((hist, i) => (
              <motion.div key={i} variants={itemVariants}>
                <button
                  onClick={() => {
                    onHistoryClick(hist.query);
                    setIsSidebarOpen(false);
                  }}
                  className="group w-full p-1 rounded-2xl bg-[#1A1817]/[0.02] border border-[#1A1817]/[0.03] hover:bg-[#1A1817]/[0.04] hover:border-[#1A1817]/[0.08] shadow-[0_2px_8px_rgba(26,24,23,0.01)] hover:shadow-[0_4px_16px_rgba(26,24,23,0.03)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
                >
                  <div className="bg-[#FDFBF7]/60 rounded-[calc(1rem-0.25rem)] p-3.5 shadow-[inset_0_1px_1px_rgba(253,251,247,0.8)] flex items-center justify-between gap-3 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[#FDFBF7]">
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[12px] font-serif font-medium text-[#1A1817]/75 group-hover:text-[#1A1817] transition-colors leading-[1.3] text-wrap pretty line-clamp-2 text-left">
                        {hist.query}
                      </span>
                      <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#1A1817]/30 group-hover:text-[#1A1817]/50 mt-2 transition-colors">
                        {hist.date}
                      </span>
                    </div>
                    {/* Nested Button-in-Button Arrow Wrapper */}
                    <div className="w-6 h-6 rounded-full bg-[#1A1817]/[0.02] border border-[#1A1817]/[0.04] flex items-center justify-center text-[#1A1817]/35 group-hover:text-[#FDFBF7] group-hover:bg-[#1A1817] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0">
                      <PiArrowUpRightLight className="text-[10px]" />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Footer Info with Double-Bezel Nested Architecture */}
      <div className="pt-6 border-t border-[#1A1817]/[0.05] flex flex-col gap-4">
        <div className="p-1 rounded-[1.75rem] bg-[#1A1817]/[0.02] border border-[#1A1817]/[0.03]">
          <div className="bg-[#FDFBF7] rounded-[calc(1.75rem-0.25rem)] p-4 shadow-[inset_0_1px_1px_rgba(26,24,23,0.01),0_8px_24px_rgba(26,24,23,0.01)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#1A1817] flex items-center justify-center text-xs text-[#FDFBF7] shadow-[0_4px_12px_rgba(26,24,23,0.15)] flex-shrink-0">
                <PiUserLight className="text-sm text-[#FDFBF7]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#1A1817] truncate">Intelligence Architect</span>
                <span className="text-[8px] uppercase tracking-[0.15em] font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Secure Link
                </span>
              </div>
            </div>
            
            {/* Minor System Latency Detail */}
            <div className="hidden lg:flex flex-col items-end flex-shrink-0 text-right">
              <span className="text-[8px] uppercase tracking-[0.2em] font-black text-[#1A1817]/30">Latency</span>
              <span className="text-[9px] font-mono font-bold text-[#1A1817]/60 mt-0.5">14ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[320px] lg:w-[360px] h-full bg-[#F4F1EA]/30 border-r border-[#1A1817]/[0.05] p-6 lg:p-8 flex-shrink-0 relative z-30 justify-between">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-[#1A1817]/10 backdrop-blur-sm md:hidden"
            />
            {/* Sidebar Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] sm:w-[320px] bg-[#F4F1EA] border-r border-[#1A1817]/[0.05] p-6 flex flex-col justify-between md:hidden"
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
