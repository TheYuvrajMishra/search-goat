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
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Vanguard Double-Bezel Architecture */}
        <div className="p-1.5 rounded-[2rem] bg-[#F5F5F7] ring-1 ring-black/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:shadow-[0_30px_70px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4 pl-7 pr-1.5 py-1.5 bg-white rounded-[calc(2rem-0.375rem)] shadow-inner">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="What are we investigating?"
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-[16px] font-medium tracking-tight placeholder:text-black/30 text-black selection:bg-black/5"
            />
            
            {/* Magnetic Button-in-Button CTA */}
            <motion.button
              type="submit"
              disabled={!value.trim() || isLoading}
              whileTap={{ scale: 0.94 }}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-700
                ${value.trim() && !isLoading 
                  ? 'bg-black text-white hover:scale-105 shadow-lg' 
                  : 'bg-black/[0.03] text-black/20'}
              `}
            >
              <PiArrowUpLight className={`text-xl transition-transform duration-700 ${value.trim() ? 'group-hover:-translate-y-1' : ''}`} />
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
};
