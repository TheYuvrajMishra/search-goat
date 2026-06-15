import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  results?: any[];
  keywords?: string[];
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to the Search Goat editorial suite. I am your autonomous intelligence architect. My directive is to parse the global noise and synthesize definitive research pillars for your inquiry. Where shall we begin our investigation?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (query: string) => {
    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/search/q?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.summary || "Synthesis successfully integrated. Review the structural pillars below.",
          results: data.results,
          keywords: data.meta?.keywords
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Intelligence link severed.');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Operational Impediment: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-[#FDFBF7] flex flex-col font-sans paper-grain overflow-hidden selection:bg-[#1A1817]/5 selection:text-[#1A1817]">
      {/* 
        VANGUARD EDITORIAL HEADER
        Minimalist, high-tension architectural layout focusing on macro-whitespace
      */}
      <header className="relative z-20 w-full pt-10 md:pt-16 pb-10 px-6 md:px-16 lg:px-24 border-b border-[#1A1817]/[0.03] flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col gap-6 md:gap-8"
        >
          <h1 className="text-[56px] sm:text-[72px] md:text-[100px] leading-[0.8] font-serif font-medium tracking-[-0.06em] text-[#1A1817]">
            Search<span className="text-[#1A1817]/50 italic ml-[0.01em]">Goat</span>
          </h1>
        </motion.div>
      </header>

      {/* 
        CENTRAL INTELLIGENCE STREAM 
        Fixed viewport with internal haptic scroll to fit in one page
      */}
      <main className="relative z-10 flex-1 w-full overflow-hidden flex flex-col">
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide px-6 md:px-16 lg:px-24 py-12 md:py-20"
        >
          <div className="max-w-[1200px] mx-auto space-y-20 md:space-y-32">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-4 px-8 py-5 md:px-10 md:py-6 rounded-[2rem] md:rounded-[2.5rem] bg-[#F4F1EA]/50 border border-[#1A1817]/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] font-black text-[#1A1817]/30 italic">Synthesizing Core</div>
                    <div className="flex gap-2">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0], opacity: [0.2, 1, 0.2] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                          className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-[#1A1817]/20"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* 
        PERSISTENT INPUT ISLAND 
        Detached floating architecture with gradient occlusion for that expensive feel
      */}
      <footer className="relative z-30 w-full px-6 md:px-16 lg:px-24 pb-8 md:pb-12 pt-10 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/95 to-transparent pointer-events-none">
        <div className="max-w-[900px] mx-auto pointer-events-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
