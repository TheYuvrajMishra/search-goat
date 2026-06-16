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
        {/* Double-Bezel Hard-Architecture: Editorial Input */}
        <div className="p-1.5 rounded-[2.5rem] md:rounded-[3rem] bg-[#F4F1EA] ring-1 ring-[#1A1817]/[0.05] shadow-[0_40px_100px_rgba(26,24,23,0.05)] transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:shadow-[0_60px_120px_rgba(26,24,23,0.1)] group-focus-within:ring-[#1A1817]/[0.1]">
          <div className="flex items-center gap-4 pl-6 pr-1.5 py-1.5 md:pl-8 md:pr-2 md:py-2 bg-[#FDFBF7] rounded-[calc(2.5rem-0.5rem)] md:rounded-[calc(3rem-0.375rem)] shadow-inner">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="What shall we initiate?"
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-[16px] font-medium tracking-tight placeholder:text-[#1A1817]/20 text-[#1A1817] selection:bg-[#1A1817]/5"
            />
            
            {/* Vanguard Button-in-Button Trailing Icon CTA */}
            <motion.button
              type="submit"
              disabled={!value.trim() || isLoading}
              whileTap={{ scale: 0.94 }}
              className={`
                relative group/btn flex items-center justify-center w-12 h-12 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]
                ${value.trim() && !isLoading 
                  ? 'bg-[#1A1817] text-[#FDFBF7] shadow-2xl hover:scale-105' 
                  : 'bg-[#1A1817]/[0.1] text-[#fff]'}
              `}
            >
              <PiArrowUpLight className={`text-2xl transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${value.trim() ? 'group-hover/btn:-translate-y-1.5' : ''}`} />
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
};
