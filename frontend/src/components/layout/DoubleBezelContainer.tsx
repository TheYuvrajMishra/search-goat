import React from 'react';

interface DoubleBezelContainerProps {
  children: React.ReactNode;
  className?: string;
  outerClassName?: string;
  innerClassName?: string;
}

/**
 * Implements the Vanguard "Doppelrand" (Double-Bezel) technique.
 * Updated for the Soft Structuralism (Light) archetype.
 */
export const DoubleBezelContainer: React.FC<DoubleBezelContainerProps> = ({
  children,
  className = '',
  outerClassName = '',
  innerClassName = ''
}) => {
  return (
    <div className={`relative group ${className}`}>
      {/* Outer Shell: Machined Frame (Light) */}
      <div className={`
        relative p-2 rounded-[3rem] 
        bg-[#F5F5F7] ring-1 ring-black/[0.03] 
        shadow-[0_40px_100px_rgba(0,0,0,0.04)]
        ${outerClassName}
      `}>
        {/* Inner Core: Content Area (Light) */}
        <div className={`
          relative bg-white overflow-hidden
          rounded-[calc(3rem-0.5rem)] 
          shadow-inner
          ${innerClassName}
        `}>
          {children}
        </div>
      </div>
    </div>
  );
};
