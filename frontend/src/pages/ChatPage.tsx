import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EtherealBackground } from '../components/layout/EtherealBackground';
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
      content: "Hello. I am your specialized research assistant. I aggregate results from across the web and synthesize them into comprehensive answers. What would you like to investigate today?"
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
          content: data.summary || "Here are the search results I found for your query.",
          results: data.results,
          keywords: data.meta?.keywords
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to fetch results');
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `I encountered an error while processing your request: ${error.message}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500/30">
      <EtherealBackground />
      
      {/* Main Message Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-12 pb-40">
        {/* App Hero Branding */}
        <div className="flex flex-col items-center mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-6 mx-auto">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-white mb-4">
              Search <span className="text-white/30 italic">Goat</span>
            </h1>
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/20 font-medium">
              Intelligence Aggregator
            </p>
          </motion.div>
        </div>

        <div className="space-y-12">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start pl-8"
              >
                <div className="flex gap-1.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Fixed Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-10 pt-10 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto px-6 pointer-events-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
