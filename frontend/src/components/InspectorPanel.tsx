import React from 'react';

export const InspectorPanel: React.FC = () => {
  return (
    <div className="w-80 h-full border-l border-border-default bg-bg-panel flex flex-col">
      <div className="p-6 border-b border-border-default">
        <h2 className="text-xs uppercase tracking-widest text-text-secondary font-bold">Inspector</h2>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="text-sm text-text-muted italic">
          Select an item to view details...
        </div>
      </div>
    </div>
  );
};
