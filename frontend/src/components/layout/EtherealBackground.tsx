import React from 'react';

export const EtherealBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050505]">
      {/* Cinematic Radial Orbs */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 animate-pulse"
        style={{ 
          background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
          animationDuration: '8s'
        }}
      />
      <div 
        className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10"
        style={{ 
          background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          animationDuration: '12s'
        }}
      />
      
      {/* Physical Texture: Grain Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
