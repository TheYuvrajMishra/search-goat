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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="relative min-h-[100dvh] bg-[#FDFBF7] flex flex-col font-sans paper-grain">
      {/* Editorial Luxury Hero - Split Archetype */}
      <section className="w-full pt-24 md:pt-40 pb-20 md:pb-32 px-6 md:px-24 lg:px-32 border-b border-[#1A1817]/[0.03]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#1A1817] text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-bold text-[#FDFBF7] mb-8 md:mb-12">
              Vol. 01 — Intelligence Suite
            </div>
            <h1 className="text-[60px] sm:text-[80px] md:text-[100px] lg:text-[140px] leading-[0.8] font-serif font-medium tracking-[-0.04em] text-[#1A1817]">
              Search<br />
              <span className="text-[#1A1817]/10 ml-[0.1em]">Goat</span>
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.4, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="pt-4 md:pt-48"
          >
            <div className="w-16 md:w-24 h-[1px] bg-[#1A1817]/10 mb-8 md:mb-12" />
            <p className="text-[18px] md:text-[20px] lg:text-[24px] leading-[1.4] text-[#1A1817]/60 font-medium max-w-[420px] font-serif italic">
              "To search is human; to aggregate is divine. We provide the haptic depth required for modern autonomous research."
            </p>
            <div className="mt-10 md:mt-16 flex items-center gap-4 md:gap-6">
              <div className="flex -space-x-2 md:-space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#FDFBF7] bg-[#F4F1EA]" />
                ))}
              </div>
              <span className="text-[9px] md:text-[11px] uppercase tracking-widest font-bold text-[#1A1817]/30">
                Active Peer Aggregators
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dynamic Content Stream */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-24 lg:px-32 py-20 md:py-40">
        <div className="space-y-24 md:space-y-40">
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
                <div className="flex items-center gap-4 px-8 py-5 md:px-10 md:py-6 rounded-[2rem] md:rounded-[2.5rem] bg-[#F4F1EA]/50 border border-[#1A1817]/[0.03] ambient-soft-shadow">
                  <div className="text-[10px] md:text-[12px] uppercase tracking-[0.3em] font-bold text-[#1A1817]/30">Synthesizing</div>
                  <div className="flex gap-1.5 md:gap-2">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
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
      </main>

      {/* Persistent Floating Input Island */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 md:px-10 pb-8 md:pb-16 pt-24 md:pt-32 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent pointer-events-none">
        <div className="max-w-[900px] mx-auto pointer-events-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
