import React, { useState, useEffect } from 'react';

interface PromptFile {
  path: string;
  metadata: {
    name: string;
    role?: string;
    applicable_stage: string;
  };
  content: string;
}

export const RegistryEditor: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/prompts');
      const data = await res.json();
      setPrompts(data);
      if (data.length > 0 && !selectedPath) {
        selectPrompt(data[0].path);
      }
    } catch (err) {
      console.error('Failed to fetch prompts', err);
    }
  };

  const selectPrompt = async (path: string) => {
    setSelectedPath(path);
    try {
      const res = await fetch(`http://localhost:3002/api/prompts/${path}`);
      const data = await res.json();
      setContent(data.content);
      setMessage('');
    } catch (err) {
      console.error('Failed to fetch prompt content', err);
    }
  };

  const handleSave = async () => {
    if (!selectedPath) return;
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:3002/api/prompts/${selectedPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setMessage('Saved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save');
      }
    } catch (err) {
      setMessage('Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[600px] border border-border-strong bg-bg-panel overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* File Tree */}
      <div className="w-64 border-r border-border-strong flex flex-col">
        <div className="p-4 border-b border-border-strong bg-bg-elevated">
          <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary font-bold">Registry Files</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {prompts.map((p) => (
            <button
              key={p.path}
              onClick={() => selectPrompt(p.path)}
              className={`w-full text-left px-4 py-2 text-xs font-mono truncate border-b border-border/50 hover:bg-bg-elevated transition-colors ${
                selectedPath === p.path ? 'bg-bg-elevated text-accent border-r-2 border-r-accent' : 'text-text-secondary'
              }`}
            >
              {p.path}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-border-strong bg-bg-elevated flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary font-bold truncate">
              {selectedPath || 'Select a file'}
            </h3>
            {message && <span className="text-[10px] font-mono text-accent animate-pulse">{message}</span>}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedPath}
            className="px-4 py-1 bg-accent text-bg-base text-[10px] font-mono uppercase font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-bg-base p-6 text-sm font-mono text-text-primary focus:outline-none resize-none leading-relaxed"
          placeholder="Select a file to edit..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};
