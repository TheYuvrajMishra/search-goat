import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { PiArrowCounterClockwiseLight, PiSidebarLight } from 'react-icons/pi';
import { Sidebar } from '../components/layout/Sidebar';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleResetSession = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Welcome to the Search Goat editorial suite. I am your autonomous intelligence architect. My directive is to parse the global noise and synthesize definitive research pillars for your inquiry. Where shall we begin our investigation?"
      }
    ]);
  };
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      scrollToBottom();
    } else {
      // Scroll to the top of the newly generated assistant response
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          const messageElements = scrollContainerRef.current.querySelectorAll('.chat-message-container');
          const lastMessageElement = messageElements[messageElements.length - 1] as HTMLElement;
          if (lastMessageElement) {
            const container = scrollContainerRef.current;
            const offsetTop = lastMessageElement.offsetTop;
            const paddingOffset = window.innerWidth >= 768 ? 40 : 24;
            container.scrollTo({
              top: offsetTop - paddingOffset,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

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
    <div className="relative h-[100dvh] w-full bg-[#FDFBF7] flex flex-row font-sans paper-grain overflow-hidden selection:bg-[#1A1817]/5 selection:text-[#1A1817]">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        onHistoryClick={handleSendMessage}
      />

      {/* Main Chat Content Area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {/* Redesigned header/navbar with Mobile Sidebar Trigger */}
        <header className="relative z-20 w-full py-4 md:py-6 px-6 md:px-16 lg:px-24 border-b border-[#1A1817]/[0.04] bg-[#FDFBF7]/70 backdrop-blur-xl flex items-center justify-between gap-4 shadow-[inset_0_-1px_0_rgba(26,24,23,0.01)]">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-4"
          >
            {/* Mobile Sidebar Trigger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/60 hover:text-[#1A1817] transition-all duration-300 cursor-pointer"
            >
              <PiSidebarLight className="text-xl" />
            </button>

      
          </motion.div>

          {/* Control Suite / Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-4 md:gap-6"
          >
            {/* Reset Action */}
            <button
              onClick={handleResetSession}
              disabled={messages.length <= 1 && !isLoading}
              className="group flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-full bg-[#1A1817] hover:bg-[#1A1817]/85 text-[#FDFBF7] disabled:bg-[#1A1817]/5 disabled:text-[#1A1817]/35 disabled:cursor-not-allowed border border-[#1A1817]/[0.05] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold shadow-[0_10px_30px_rgba(26,24,23,0.05)] hover:shadow-[0_15px_35px_rgba(26,24,23,0.1)] active:scale-98 cursor-pointer"
            >
              <PiArrowCounterClockwiseLight className="text-sm group-hover:rotate-180 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
              <span className="hidden sm:inline">Reset Session</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </motion.div>
        </header>

        {/* CENTRAL INTELLIGENCE STREAM */}
        <main className="relative z-10 flex-1 w-full overflow-hidden flex flex-col">
          <div 
            ref={scrollContainerRef}
            className="relative flex-1 overflow-y-auto scrollbar-hide px-6 md:px-16 lg:px-24 py-12 md:py-20"
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

        {/* PERSISTENT INPUT ISLAND */}
        <footer className="relative z-30 w-full px-6 md:px-16 lg:px-24 pb-8 md:pb-12 pt-10 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/95 to-transparent pointer-events-none">
          <div className="max-w-[900px] mx-auto pointer-events-auto">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;
