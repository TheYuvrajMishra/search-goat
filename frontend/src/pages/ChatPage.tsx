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
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-purple-500 animate-pulse" />
            <h1 className="text-xl font-medium tracking-tight">Vanguard <span className="text-white/40">Aggregator</span></h1>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/[0.03] ring-1 ring-white/10 text-[10px] uppercase tracking-[0.2em] font-medium text-white/30">
            v1.0.4 Online
          </div>
        </div>
      </header>

      {/* Main Message Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-24 pb-40">
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
