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
      content: "I am Search Goat. Your curated intelligence layer. I don't just find links; I synthesize the web's collective knowledge into definitive answers. How can I assist your investigation today?"
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
          content: data.summary || "Synthesis complete. Review the curated intelligence below.",
          results: data.results,
          keywords: data.meta?.keywords
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Connection failure');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Structural error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFFFF] flex flex-col font-sans">
      {/* Editorial Branding Section - Soft Structuralism */}
      <section className="w-full pt-20 pb-16 px-8 md:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 text-[10px] uppercase tracking-[0.3em] font-bold text-black/60 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-black/60 animate-pulse" />
              Structural Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl leading-[0.9] font-sans font-bold tracking-tight text-black">
              Search <span className="text-black/25">Goat</span>
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="md:w-1/3 pb-2"
          >
            <p className="text-[15px] leading-relaxed text-black/60 font-medium max-w-[280px]">
              The premium aggregator for high-fidelity research and autonomous web synthesis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Dynamic Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-8 md:px-24 pb-48">
        <div className="space-y-16">
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
                <div className="flex gap-2 p-6 rounded-[2rem] bg-[#F5F5F7] border border-black/5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-black/30"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Floating Action Island */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-8 pb-12 pt-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
