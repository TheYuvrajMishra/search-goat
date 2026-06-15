import React from 'react';
import { motion } from 'framer-motion';

interface DoubleBezelContainerProps {
  children: React.ReactNode;
  className?: string;
  outerClassName?: string;
  innerClassName?: string;
}

/**
 * Implements the Vanguard "Doppelrand" (Double-Bezel) technique.
 * A physical, machined hardware look with nested concentric curves.
 */
export const DoubleBezelContainer: React.FC<DoubleBezelContainerProps> = ({
  children,
  className = '',
  outerClassName = '',
  innerClassName = ''
}) => {
  return (
    <div className={`relative group ${className}`}>
      {/* Outer Shell: Machined Frame */}
      <div className={`
        relative p-2 rounded-[2.5rem] 
        bg-white/[0.02] ring-1 ring-white/10 
        backdrop-blur-2xl shadow-2xl
        ${outerClassName}
      `}>
        {/* Inner Core: Content Area */}
        <div className={`
          relative bg-[#0a0a0a] overflow-hidden
          rounded-[calc(2.5rem-0.5rem)] 
          shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]
          ${innerClassName}
        `}>
          {children}
        </div>
      </div>
    </div>
  );
};
