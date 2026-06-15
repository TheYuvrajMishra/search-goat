import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PiArrowUpLight } from 'react-icons/pi';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue('');
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-8">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Outer Bezel */}
        <div className="p-1.5 rounded-full bg-white/[0.03] ring-1 ring-white/10 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:ring-white/20 group-focus-within:bg-white/[0.05]">
          <div className="flex items-center gap-2 pl-6 pr-1.5 py-1.5 bg-[#0a0a0a] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-white/20 text-white selection:bg-emerald-500/30"
            />
            
            {/* Vanguard Button-in-Button CTA */}
            <motion.button
              type="submit"
              disabled={!value.trim() || isLoading}
              whileTap={{ scale: 0.96 }}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500
                ${value.trim() && !isLoading 
                  ? 'bg-white text-black hover:bg-emerald-400' 
                  : 'bg-white/5 text-white/20'}
              `}
            >
              <PiArrowUpLight className={`text-xl transition-transform duration-500 ${value.trim() ? 'group-hover:-translate-y-0.5' : ''}`} />
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
};
