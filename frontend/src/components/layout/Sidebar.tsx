import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PiXLight, 
  PiTrashLight, 
  PiNotePencilLight, 
  PiCheckLight, 
  PiPlusLight,
  PiLightbulbLight,
  PiCopyrightLight,
  PiPaperPlaneTiltLight
} from 'react-icons/pi';

interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  sessions: Session[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
  onNewSession: () => void;
}

// Stagger variants for the history items cascade reveal
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)', 
    transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] } 
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionRename,
  onNewSession
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Feature Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [featureCategory, setFeatureCategory] = useState<'aesthetics' | 'performance' | 'synthesis' | 'scraper' | 'other'>('aesthetics');
  const [featureEmail, setFeatureEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim() || !featureDesc.trim()) {
      setSubmitError('Title and description are required.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch('http://localhost:3000/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: featureTitle.trim(),
          description: featureDesc.trim(),
          category: featureCategory,
          email: featureEmail.trim() || undefined
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsSubmitSuccess(true);
        setFeatureTitle('');
        setFeatureDesc('');
        setFeatureCategory('aesthetics');
        setFeatureEmail('');
      } else {
        throw new Error(data.error || 'Failed to submit feature request.');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback to localStorage if backend is down or fails
      try {
        const localFeatures = JSON.parse(localStorage.getItem('feature_requests') || '[]');
        localFeatures.push({
          title: featureTitle.trim(),
          description: featureDesc.trim(),
          category: featureCategory,
          email: featureEmail.trim() || undefined,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('feature_requests', JSON.stringify(localFeatures));
        
        setIsSubmitSuccess(true);
        setFeatureTitle('');
        setFeatureDesc('');
        setFeatureCategory('aesthetics');
        setFeatureEmail('');
      } catch (localErr) {
        setSubmitError(err.message || 'Submission failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingSessionId(id);
    setEditTitleValue(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editTitleValue.trim() !== '') {
      onSessionRename(id, editTitleValue.trim());
    }
    setEditingSessionId(null);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="flex flex-col gap-8">
        {/* Sidebar Header with Subheading Pill & Actions */}
        <div className="flex items-center justify-between pb-6 border-b border-[#1A1817]/[0.05]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[20px] sm:text-[22px] leading-none font-serif font-medium tracking-[-0.04em] text-[#1A1817]">
                Search<span className="text-[#1A1817]/50 italic ml-[0.01em]">Goat</span>
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* New Session Button */}
            <button
              onClick={onNewSession}
              className="p-1.5 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/60 hover:text-[#1A1817] transition-all duration-300 cursor-pointer"
              title="New Session"
            >
              <PiPlusLight className="text-lg" />
            </button>
            {/* Close button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden p-1.5 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/50 hover:text-[#1A1817] transition-all duration-350 cursor-pointer"
            >
              <PiXLight className="text-lg" />
            </button>
          </div>
        </div>

        {/* Intelligence Histories */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[9px] uppercase tracking-[0.3em] font-black text-[#1A1817]/30">
            Recent Chats
          </h3>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2 max-h-[52vh] overflow-y-auto scrollbar-hide"
          >
            {sessions.map((sessionItem) => {
              const isEditing = editingSessionId === sessionItem.id;
              const isActive = sessionItem.id === currentSessionId;
              
              return (
                <motion.div key={sessionItem.id} variants={itemVariants}>
                  <div
                    className={`group w-full p-1 rounded-2xl border transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isActive 
                        ? 'bg-[#1A1817]/[0.04] border-[#1A1817]/[0.1] shadow-[0_4px_16px_rgba(26,24,23,0.02)]' 
                        : 'bg-[#1A1817]/[0.02] border-[#1A1817]/[0.03] hover:bg-[#1A1817]/[0.04] hover:border-[#1A1817]/[0.08] shadow-[0_2px_8px_rgba(26,24,23,0.01)] hover:shadow-[0_4px_16px_rgba(26,24,23,0.03)]'
                    }`}
                  >
                    <div className={`rounded-[calc(1rem-0.25rem)] p-3 flex items-center justify-between gap-3 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? 'bg-[#FDFBF7]' : 'bg-[#FDFBF7]/60 group-hover:bg-[#FDFBF7]'}`}>
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full min-w-0">
                          <input
                            type="text"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(sessionItem.id);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            autoFocus
                            className="flex-1 text-[12px] font-serif font-medium text-[#1A1817] bg-transparent border-b border-[#1A1817]/30 focus:border-[#1A1817] outline-none py-0.5 px-0 min-w-0"
                          />
                          <button
                            onClick={() => handleSaveRename(sessionItem.id)}
                            className="p-1 rounded-full hover:bg-[#1A1817]/5 text-emerald-600 transition-colors cursor-pointer"
                          >
                            <PiCheckLight className="text-xs" />
                          </button>
                          <button
                            onClick={() => setEditingSessionId(null)}
                            className="p-1 rounded-full hover:bg-[#1A1817]/5 text-rose-600 transition-colors cursor-pointer"
                          >
                            <PiXLight className="text-xs" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              onSessionSelect(sessionItem.id);
                              setIsSidebarOpen(false);
                            }}
                            className="flex flex-col items-start min-w-0 text-left cursor-pointer flex-1"
                          >
                            <span className="text-[12px] font-serif font-medium text-[#1A1817]/75 group-hover:text-[#1A1817] transition-colors leading-[1.3] text-wrap pretty line-clamp-2">
                              {sessionItem.title}
                            </span>
                            <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#1A1817]/30 group-hover:text-[#1A1817]/50 mt-1.5 transition-colors">
                              {new Date(sessionItem.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </button>
                          
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Rename Button */}
                            <button
                              onClick={() => handleStartRename(sessionItem.id, sessionItem.title)}
                              className="p-1 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/30 hover:text-[#1A1817] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                              title="Rename Session"
                            >
                              <PiNotePencilLight className="text-xs" />
                            </button>
                            {/* Delete Button */}
                            <button
                              onClick={() => onSessionDelete(sessionItem.id)}
                              className="p-1 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/30 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                              title="Delete Session"
                            >
                              <PiTrashLight className="text-xs" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Footer Info with Double-Bezel Nested Architecture */}
      <div className="pt-6 border-t border-[#1A1817]/[0.05] flex flex-col gap-4">
        <button
          onClick={() => {
            setIsModalOpen(true);
            setIsSubmitSuccess(false);
            setSubmitError(null);
          }}
          className="group w-full text-left p-1 rounded-[1.75rem] bg-[#1A1817]/[0.02] hover:bg-[#1A1817]/[0.04] border border-[#1A1817]/[0.03] hover:border-[#1A1817]/[0.06] transition-all duration-300 active:scale-[0.98] cursor-pointer"
          title="Request Feature"
        >
          <div className="bg-[#FDFBF7] group-hover:bg-white rounded-[calc(1.75rem-0.25rem)] p-4 shadow-[inset_0_1px_1px_rgba(26,24,23,0.01),0_8px_24px_rgba(26,24,23,0.01)] group-hover:shadow-[0_8px_20px_rgba(26,24,23,0.03)] flex items-center justify-between gap-4 transition-all duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#1A1817]/[0.03] group-hover:bg-[#1A1817] flex items-center justify-center border border-[#1A1817]/[0.05] group-hover:border-transparent shadow-[inset_0_1px_1px_rgba(26,24,23,0.02)] group-hover:shadow-[0_4px_12px_rgba(26,24,23,0.15)] flex-shrink-0 transition-all duration-300">
                <PiLightbulbLight className="text-base text-[#1A1817] group-hover:text-[#FDFBF7] group-hover:rotate-[15deg] transition-all duration-300" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#1A1817] group-hover:text-emerald-700 transition-colors duration-300 truncate">Request Feature</span>
                <span className="text-[8px] uppercase tracking-[0.12em] font-bold text-emerald-600 mt-1 flex items-center gap-1.5 transition-colors duration-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Suggestion Desk
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1A1817]/[0.02] group-hover:bg-[#1A1817]/5 text-[#1A1817]/30 group-hover:text-[#1A1817]/80 group-hover:translate-x-0.5 transition-all duration-300">
              <PiCopyrightLight className="text-xs" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[320px] lg:w-[360px] h-full bg-[#F4F1EA]/30 border-r border-[#1A1817]/[0.05] p-6 lg:p-8 flex-shrink-0 relative z-30 justify-between">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-[#1A1817]/10 backdrop-blur-sm md:hidden"
            />
            {/* Sidebar Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] sm:w-[320px] bg-[#F4F1EA] border-r border-[#1A1817]/[0.05] p-6 flex flex-col justify-between md:hidden"
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <FeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={featureTitle}
        setTitle={setFeatureTitle}
        desc={featureDesc}
        setDesc={setFeatureDesc}
        category={featureCategory}
        setCategory={setFeatureCategory}
        email={featureEmail}
        setEmail={setFeatureEmail}
        onSubmit={handleFeatureSubmit}
        isSubmitting={isSubmitting}
        isSubmitSuccess={isSubmitSuccess}
        submitError={submitError}
      />
    </>
  );
};

// Feature Request Modal with Double-Bezel nested architecture
export const FeatureModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTitle: (val: string) => void;
  desc: string;
  setDesc: (val: string) => void;
  category: 'aesthetics' | 'performance' | 'synthesis' | 'scraper' | 'other';
  setCategory: (val: 'aesthetics' | 'performance' | 'synthesis' | 'scraper' | 'other') => void;
  email: string;
  setEmail: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isSubmitSuccess: boolean;
  submitError: string | null;
}> = ({
  isOpen,
  onClose,
  title,
  setTitle,
  desc,
  setDesc,
  category,
  setCategory,
  email,
  setEmail,
  onSubmit,
  isSubmitting,
  isSubmitSuccess,
  submitError
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1A1817]/15 backdrop-blur-md"
          />

          {/* Modal Window: Double-Bezel nested container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md p-2 rounded-[2.5rem] bg-[#1A1817]/[0.02] border border-[#1A1817]/[0.04] shadow-[0_32px_64px_rgba(26,24,23,0.08)] z-10"
          >
            {/* Inner bezel core */}
            <div className="bg-[#FDFBF7] rounded-[calc(2.5rem-0.5rem)] p-6 sm:p-8 shadow-[inset_0_1px_2px_rgba(26,24,23,0.01)] relative overflow-hidden">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/40 hover:text-[#1A1817] transition-all duration-300 cursor-pointer"
                title="Close Portal"
              >
                <PiXLight className="text-base" />
              </button>

              <AnimatePresence mode="wait">
                {!isSubmitSuccess ? (
                  <motion.div
                    key="form-view"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-1.5 mb-6">
                      <span className="w-max rounded-full px-2 py-0.5 bg-[#1A1817]/[0.03] border border-[#1A1817]/[0.05] text-[7.5px] uppercase tracking-[0.2em] font-black text-[#1A1817]/50">
                        Feature Portal
                      </span>
                      <h3 className="text-[20px] font-serif font-medium tracking-[-0.03em] text-[#1A1817]">
                        Propose Feature
                      </h3>
                      <p className="text-[10px] text-[#1A1817]/50 leading-relaxed max-w-[90%]">
                        Help shape SearchGoat. Your suggestions directly influence our search and synthesis architectures.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                      {/* Title */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#1A1817]/40">
                          Feature Title
                        </label>
                        <div className="p-0.5 rounded-xl bg-[#1A1817]/[0.01] border border-[#1A1817]/[0.04]">
                          <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Export Synthesis as Markdown"
                            className="w-full bg-[#FDFBF7] px-3.5 py-2 text-[11px] font-medium text-[#1A1817] placeholder-[#1A1817]/25 rounded-[calc(0.75rem-0.125rem)] outline-none focus:bg-white transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Category Row */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#1A1817]/40">
                          Category
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['aesthetics', 'synthesis', 'scraper'] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategory(cat)}
                              className={`px-2 py-1.5 rounded-lg text-[8px] uppercase font-bold tracking-wider transition-all duration-300 text-center cursor-pointer border ${
                                category === cat
                                  ? 'bg-[#1A1817] border-[#1A1817] text-[#FDFBF7] shadow-[0_4px_12px_rgba(26,24,23,0.15)]'
                                  : 'bg-[#1A1817]/[0.01] border-[#1A1817]/[0.04] text-[#1A1817]/50 hover:bg-[#1A1817]/[0.03] hover:text-[#1A1817]'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                          {(['performance', 'other'] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategory(cat)}
                              className={`col-span-1 px-2 py-1.5 rounded-lg text-[8px] uppercase font-bold tracking-wider transition-all duration-300 text-center cursor-pointer border ${
                                category === cat
                                  ? 'bg-[#1A1817] border-[#1A1817] text-[#FDFBF7] shadow-[0_4px_12px_rgba(26,24,23,0.15)]'
                                  : 'bg-[#1A1817]/[0.01] border-[#1A1817]/[0.04] text-[#1A1817]/50 hover:bg-[#1A1817]/[0.03] hover:text-[#1A1817]'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#1A1817]/40">
                          Description
                        </label>
                        <div className="p-0.5 rounded-xl bg-[#1A1817]/[0.01] border border-[#1A1817]/[0.04]">
                          <textarea
                            required
                            rows={3}
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Please describe the feature and how it would improve your workflow..."
                            className="w-full bg-[#FDFBF7] px-3.5 py-2.5 text-[11px] font-medium text-[#1A1817] placeholder-[#1A1817]/25 rounded-[calc(0.75rem-0.125rem)] outline-none focus:bg-white resize-none transition-all duration-300 font-sans"
                          />
                        </div>
                      </div>

                      {/* Contact Email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#1A1817]/40">
                          Contact Email (Optional)
                        </label>
                        <div className="p-0.5 rounded-xl bg-[#1A1817]/[0.01] border border-[#1A1817]/[0.04]">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. architect@firm.com"
                            className="w-full bg-[#FDFBF7] px-3.5 py-2 text-[11px] font-medium text-[#1A1817] placeholder-[#1A1817]/25 rounded-[calc(0.75rem-0.125rem)] outline-none focus:bg-white transition-all duration-300"
                          />
                        </div>
                      </div>

                      {submitError && (
                        <div className="text-[9px] uppercase tracking-wider font-bold text-rose-600 bg-rose-50 border border-rose-200/50 p-2.5 rounded-lg">
                          {submitError}
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group/submit flex items-center justify-center gap-2 py-3 rounded-full bg-[#1A1817] hover:bg-[#1A1817]/90 text-[#FDFBF7] font-serif font-medium tracking-tight text-[12px] shadow-[0_12px_24px_-8px_rgba(26,24,23,0.2)] disabled:bg-[#1A1817]/40 disabled:cursor-not-allowed transition-all duration-500 active:scale-[0.98] cursor-pointer mt-2"
                      >
                        {isSubmitting ? (
                          <div className="flex gap-1.5 items-center justify-center">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#FDFBF7]/60">Logging Proposal</span>
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{ y: [0, -3, 0], opacity: [0.3, 1, 0.3] }}
                                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                                  className="w-1 h-1 rounded-full bg-[#FDFBF7]"
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <>
                            <span>Submit Proposal</span>
                            <PiPaperPlaneTiltLight className="text-sm group-hover/submit:translate-x-0.5 group-hover/submit:-translate-y-0.5 transition-transform duration-300" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center py-6"
                  >
                    {/* Success Squircle Icon wrapper */}
                    <div className="w-16 h-16 rounded-[1.5rem] bg-[#1A1817]/[0.02] border border-[#1A1817]/[0.05] p-1 mb-5">
                      <div className="w-full h-full rounded-[calc(1.5rem-0.25rem)] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-[inset_0_1px_1px_rgba(26,24,23,0.01),0_4px_12px_rgba(16,185,129,0.1)]">
                        <PiCheckLight className="text-2xl" />
                      </div>
                    </div>

                    <h3 className="text-[18px] font-serif font-medium tracking-[-0.03em] text-[#1A1817]">
                      Proposal Logged
                    </h3>
                    <p className="text-[10px] text-[#1A1817]/50 mt-2 max-w-[85%] leading-relaxed">
                      Your request has been successfully recorded. Our intelligence architects will evaluate this during our next system sprint.
                    </p>

                    <button
                      onClick={onClose}
                      className="mt-6 px-6 py-2.5 rounded-full bg-[#1A1817]/[0.03] hover:bg-[#1A1817] text-[#1A1817] hover:text-[#FDFBF7] border border-[#1A1817]/[0.05] text-[10px] uppercase tracking-wider font-bold transition-all duration-300 active:scale-[0.98] cursor-pointer"
                    >
                      Return to Session
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

