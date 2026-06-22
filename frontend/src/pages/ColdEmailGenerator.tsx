import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PiFloppyDiskLight, 
  PiEnvelopeSimpleLight, 
  PiCopyLight, 
  PiCheckLight, 
  PiSparkleLight, 
  PiBuildingLight,
  PiArrowCounterClockwiseLight,
  PiBookOpenLight,
  PiListPlusLight,
  PiWarningCircleLight
} from 'react-icons/pi';

interface EmailResult {
  company: string;
  purpose: string;
  email: string;
  toEmail?: string;
}

export const ColdEmailGenerator: React.FC = () => {
  // Context states
  const [contextText, setContextText] = useState('');
  const [isContextLoading, setIsContextLoading] = useState(false);
  const [isContextSaving, setIsContextSaving] = useState(false);
  const [contextSavedSuccess, setContextSavedSuccess] = useState(false);

  // Generation states
  const [companiesInput, setCompaniesInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Individual copy states: maps companyName to copied boolean
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [copiedSubjectStates, setCopiedSubjectStates] = useState<Record<string, boolean>>({});

  // Fetch context from backend on mount
  const fetchContext = async () => {
    setIsContextLoading(true);
    try {
      const response = await fetch('http://localhost:3000/email/context');
      const data = await response.json();
      if (data.success) {
        setContextText(data.content);
      }
    } catch (error) {
      console.error('Failed to load email context:', error);
    } finally {
      setIsContextLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  // Save context handler
  const handleSaveContext = async () => {
    setIsContextSaving(true);
    setContextSavedSuccess(false);
    try {
      const response = await fetch('http://localhost:3000/email/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contextText })
      });
      const data = await response.json();
      if (data.success) {
        setContextSavedSuccess(true);
        setTimeout(() => setContextSavedSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save context:', error);
      alert('Error saving email context.');
    } finally {
      setIsContextSaving(false);
    }
  };

  // Generate emails handler
  const handleGenerate = async () => {
    if (!companiesInput.trim()) {
      setGenerationError('Please enter at least one company name.');
      return;
    }

    // Parse target companies and target email addresses
    const parsedList = companiesInput
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        
        // Find last comma
        const lastCommaIdx = trimmed.lastIndexOf(',');
        if (lastCommaIdx !== -1) {
          const possibleEmail = trimmed.substring(lastCommaIdx + 1).trim();
          const possibleName = trimmed.substring(0, lastCommaIdx).trim();
          
          // Basic email check: has '@' and '.'
          if (possibleEmail.includes('@') && possibleEmail.includes('.')) {
            return { name: possibleName, email: possibleEmail };
          }
        }
        return { name: trimmed, email: '' };
      })
      .filter((item): item is { name: string; email: string } => item !== null && item.name.length > 0);

    if (parsedList.length === 0) {
      setGenerationError('Please enter at least one valid company name.');
      return;
    }

    const companyNames = parsedList.map(item => item.name);

    setIsGenerating(true);
    setGenerationError(null);
    setResults([]);

    try {
      const response = await fetch('http://localhost:3000/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: companyNames })
      });

      const data = await response.json();
      if (data.success) {
        // Map the recipient email back to the result by index
        const mappedResults = data.results.map((res: any, index: number) => ({
          ...res,
          toEmail: parsedList[index] ? parsedList[index].email : ''
        }));
        setResults(mappedResults);
      } else {
        throw new Error(data.error || 'Failed to synthesize cold emails.');
      }
    } catch (error: any) {
      console.error(error);
      setGenerationError(error.message || 'An error occurred during cold email synthesis.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard helper (with rich text fallback for Gmail formatting)
  const handleCopy = async (companyName: string, _subject: string, bodyText: string) => {
    // plain text version (ensure links have https://)
    const plainText = bodyText.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('github') || trimmed.toLowerCase().includes('linkedin')) {
        let processed = trimmed;
        processed = processed.replace(/(?<!https?:\/\/)(github\.com\/[a-zA-Z0-9_-]+)/gi, 'https://$1');
        processed = processed.replace(/(?<!https?:\/\/)(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/gi, 'https://$1');
        return processed;
      }
      return line;
    }).join('\n');

    // Split by double newline to identify paragraphs
    const paragraphs = bodyText.split(/\n\s*\n/);
    const htmlLines = paragraphs.map(para => {
      const trimmedPara = para.trim();
      if (trimmedPara === '') return '';
      
      const lines = trimmedPara.split('\n').map(line => {
        let processed = line.trim();
        if (processed.toLowerCase().includes('github') || processed.toLowerCase().includes('linkedin')) {
          // match github
          const githubMatch = processed.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
          if (githubMatch) {
            const username = githubMatch[1];
            const url = `https://github.com/${username}`;
            processed = processed.replace(/(?:GitHub:\s*)?(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i, `<a href="${url}" style="color: #0969da; text-decoration: underline; font-weight: 500;">GitHub</a>`);
          }
          
          // match linkedin
          const linkedinMatch = processed.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
          if (linkedinMatch) {
            const username = linkedinMatch[1];
            const url = `https://linkedin.com/in/${username}`;
            processed = processed.replace(/(?:LinkedIn:\s*)?(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i, `<a href="${url}" style="color: #0969da; text-decoration: underline; font-weight: 500;">LinkedIn</a>`);
          }
        }
        return processed;
      });

      return `<p style="margin: 0 0 1em 0; font-family: sans-serif; font-size: 14px; color: #1a1817; line-height: 1.5;">${lines.join('<br/>')}</p>`;
    }).filter(p => p !== '').join('');

    const htmlContent = `
      <html>
      <body style="font-family: sans-serif; font-size: 14px; color: #1a1817; line-height: 1.5;">
        ${htmlLines}
      </body>
      </html>
    `;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
    } catch (err) {
      console.error('Failed to copy rich text:', err);
      try {
        await navigator.clipboard.writeText(plainText);
      } catch (err2) {
        console.error('Fallback copy failed:', err2);
      }
    }

    setCopiedStates(prev => ({ ...prev, [companyName]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [companyName]: false }));
    }, 2000);
  };

  // Copy Subject helper
  const handleCopySubject = (companyName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSubjectStates(prev => ({ ...prev, [companyName]: true }));
    setTimeout(() => {
      setCopiedSubjectStates(prev => ({ ...prev, [companyName]: false }));
    }, 2000);
  };

  // Renders the email body, formatting GitHub/LinkedIn profiles as clickable links
  const renderBodyWithLinks = (bodyText: string) => {
    const paragraphs = bodyText.split(/\n\s*\n/);
    return paragraphs.map((para, paraIndex) => {
      const trimmedPara = para.trim();
      if (trimmedPara === '') return null;

      const lines = trimmedPara.split('\n').map((line, lineIndex) => {
        const trimmedLine = line.trim();
        const isSignatureLine = trimmedLine.toLowerCase().includes('github') || trimmedLine.toLowerCase().includes('linkedin');
        
        if (isSignatureLine) {
          const githubMatch = trimmedLine.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
          const linkedinMatch = trimmedLine.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
          
          let githubUrl = '';
          if (githubMatch) {
            githubUrl = `https://github.com/${githubMatch[1]}`;
          }
          
          let linkedinUrl = '';
          if (linkedinMatch) {
            linkedinUrl = `https://linkedin.com/in/${linkedinMatch[1]}`;
          }

          return (
            <span key={lineIndex} className="inline-flex flex-wrap items-center gap-2 text-[12px] font-mono mt-1 pt-1 border-t border-[#1A1817]/[0.03]">
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                >
                  GitHub
                </a>
              )}
              {githubUrl && linkedinUrl && <span className="text-[#1A1817]/30">|</span>}
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                >
                  LinkedIn
                </a>
              )}
            </span>
          );
        }

        return (
          <span key={lineIndex}>
            {line}
            {lineIndex < trimmedPara.split('\n').length - 1 && <br />}
          </span>
        );
      });

      return (
        <p key={paraIndex} className="mb-4 last:mb-0">
          {lines}
        </p>
      );
    });
  };

  // Helper to parse subject and body from the generated email string
  const parseEmail = (emailStr: string) => {
    let subject = 'Inquiry – Full Stack Developer Opportunity';
    let body = emailStr;
    
    if (emailStr.startsWith('Subject:')) {
      const lines = emailStr.split('\n');
      const subjectLine = lines[0];
      subject = subjectLine.replace(/^Subject:\s*/i, '').trim();
      body = lines.slice(1).join('\n').trim();
    }
    
    return { subject, body };
  };

  // Stagger reveal animations for generated results
  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(5px)' },
    show: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-y-auto scrollbar-hide px-6 md:px-16 lg:px-24 pt-12 pb-32 md:pt-20 md:pb-48 bg-[#FDFBF7]">
      <div className="max-w-[1200px] mx-auto w-full space-y-12">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] md:text-[36px] font-serif font-medium tracking-tight text-[#1A1817]">
            Job Outreach Synthesizer
          </h1>
          <p className="text-[12px] md:text-[13px] text-[#1A1817]/50 leading-relaxed max-w-[700px]">
            Synthesize highly personalized application drafts in bulk. Search Goat researches each target company's mission and purpose, aligns it with your resume profile, and drafts tailored career pitch emails.
          </p>
        </div>

        {/* Workspace Dual Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Context File Editor */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1817]/[0.06]">
              <div className="flex items-center gap-2">
                <PiBookOpenLight className="text-lg text-[#1A1817]/60" />
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1A1817]">
                  My Context File (email_context.md)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchContext}
                  disabled={isContextLoading || isContextSaving}
                  className="p-1.5 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/50 hover:text-[#1A1817] transition-all cursor-pointer"
                  title="Reload context from backend"
                >
                  <PiArrowCounterClockwiseLight className={`text-sm ${isContextLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleSaveContext}
                  disabled={isContextSaving || isContextLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all duration-300 border cursor-pointer ${
                    contextSavedSuccess 
                      ? 'bg-emerald-500 border-emerald-500 text-[#FDFBF7] shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                      : 'bg-[#1A1817] border-[#1A1817] text-[#FDFBF7] hover:bg-[#1A1817]/90 shadow-[0_4px_12px_rgba(26,24,23,0.1)]'
                  }`}
                >
                  {contextSavedSuccess ? (
                    <>
                      <PiCheckLight className="text-xs" />
                      <span>Saved!</span>
                    </>
                  ) : isContextSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <PiFloppyDiskLight className="text-xs" />
                      <span>Save Context</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl border border-[#1A1817]/10 p-0.5 bg-[#1A1817]/[0.01]">
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="# Describe your company, product value, and call to action..."
                className="w-full h-[320px] md:h-[400px] p-5 bg-[#FDFBF7] rounded-[calc(1rem-0.125rem)] text-[12px] md:text-[13px] font-mono text-[#1A1817]/85 placeholder-[#1A1817]/25 border-none outline-none focus:bg-white transition-all duration-300 resize-y"
              />
              {isContextLoading && (
                <div className="absolute inset-0 bg-[#FDFBF7]/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#1A1817]/50">Reading context</span>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                          className="w-1 h-1 rounded-full bg-[#1A1817]/50"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Targets & Orchestration */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1A1817]/[0.06]">
                <PiListPlusLight className="text-lg text-[#1A1817]/60" />
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1A1817]">
                  Company Name List
                </span>
              </div>
              
              <div className="relative rounded-2xl border border-[#1A1817]/10 p-0.5 bg-[#1A1817]/[0.01]">
                <textarea
                  value={companiesInput}
                  onChange={(e) => setCompaniesInput(e.target.value)}
                  placeholder="Enter targets, one per line. E.g.&#10;Google, hr@google.com&#10;Stripe, jobs@stripe.com&#10;Airbnb"
                  rows={6}
                  className="w-full p-5 bg-[#FDFBF7] rounded-[calc(1rem-0.125rem)] text-[12px] md:text-[13px] font-sans text-[#1A1817] placeholder-[#1A1817]/25 border-none outline-none focus:bg-white transition-all duration-300 resize-none"
                />
              </div>
            </div>

            {/* Glowing Gradient Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !companiesInput.trim()}
              className="relative w-full group/btn overflow-hidden rounded-full py-4 text-[#FDFBF7] text-[12px] font-serif font-medium tracking-wide shadow-[0_16px_36px_-12px_rgba(26,24,23,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(26,24,23,0.4)] disabled:opacity-50 disabled:shadow-none transition-all duration-500 cursor-pointer active:scale-[0.99]"
            >
              {/* Animated Glowing Gradient BG */}
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-neutral-800 to-stone-950 group-hover/btn:scale-105 transition-transform duration-700" />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-[#1A1817]/0 to-amber-500/20 opacity-0 group-hover/btn:opacity-100 blur transition-opacity duration-700" />
              
              <div className="relative z-10 flex items-center justify-center gap-2.5">
                {isGenerating ? (
                  <>
                    <PiSparkleLight className="text-sm animate-spin text-amber-300" />
                    <span className="uppercase tracking-[0.2em] font-black italic text-stone-200">Synthesizing Pitch Stack...</span>
                  </>
                ) : (
                  <>
                    <PiEnvelopeSimpleLight className="text-base text-emerald-300 group-hover/btn:rotate-6 transition-transform" />
                    <span>Create Tailored Job Pitches</span>
                  </>
                )}
              </div>
            </button>

            {/* Generation Error notification */}
            <AnimatePresence>
              {generationError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200/50 text-rose-800 text-[11px] leading-relaxed"
                >
                  <PiWarningCircleLight className="text-base text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{generationError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RESULTS SECTION */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4 border-t border-[#1A1817]/[0.05]"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-[#1A1817]/[0.02] border border-[#1A1817]/[0.05] p-1 animate-pulse">
                <div className="w-full h-full rounded-[calc(1.5rem-0.25rem)] bg-[#FDFBF7] flex items-center justify-center text-[#1A1817]/40">
                  <PiSparkleLight className="text-2xl animate-spin text-amber-500" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-[14px] font-serif font-medium text-[#1A1817]">Scraping Target Companies & Synthesizing Pitch</h4>
                <p className="text-[10px] text-[#1A1817]/40 uppercase tracking-[0.2em] font-black italic">Please wait, this will process in staggered beats...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              variants={listContainerVariants}
              initial="hidden"
              animate="show"
              className="space-y-12 border-t border-[#1A1817]/[0.05] pt-12"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-serif font-medium tracking-tight text-[#1A1817]">
                  Generated Pitch Stack ({results.length})
                </h3>
              </div>

              <div className="space-y-8">
                {results.map((result) => {
                  const isCopied = copiedStates[result.company] || false;
                  const { subject, body } = parseEmail(result.email);
                  
                  // Ensure URLs in plain text have https:// for Gmail auto-linkify
                  const plainTextBody = body.split('\n').map(line => {
                    const trimmed = line.trim();
                    if (trimmed.toLowerCase().includes('github') || trimmed.toLowerCase().includes('linkedin')) {
                      let processed = trimmed;
                      processed = processed.replace(/(?<!https?:\/\/)(github\.com\/[a-zA-Z0-9_-]+)/gi, 'https://$1');
                      processed = processed.replace(/(?<!https?:\/\/)(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/gi, 'https://$1');
                      return processed;
                    }
                    return line;
                  }).join('\n');

                  const gmailUrl = `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${encodeURIComponent(result.toEmail || '')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody)}`;
                  
                  return (
                    <motion.div
                      key={result.company}
                      variants={cardVariants}
                      className="p-1 rounded-[2rem] bg-[#1A1817]/[0.02] border border-[#1A1817]/[0.04] shadow-[0_8px_32px_rgba(26,24,23,0.02)] hover:shadow-[0_16px_48px_rgba(26,24,23,0.04)] hover:border-[#1A1817]/[0.08] transition-all duration-700 overflow-hidden"
                    >
                      <div className="bg-[#FDFBF7] rounded-[calc(2rem-0.25rem)] p-6 md:p-8 space-y-6">
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1817]/[0.03] border border-[#1A1817]/[0.05] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(26,24,23,0.02)]">
                              <PiBuildingLight className="text-lg text-[#1A1817]" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <h4 className="text-[16px] md:text-[18px] font-serif font-medium text-[#1A1817] leading-none">
                                {result.company}
                              </h4>
                              <span className="text-[8px] uppercase tracking-widest font-black text-amber-600">Company Purpose Summary</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Open in Gmail Button */}
                            <a
                              href={gmailUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[9px] uppercase font-bold tracking-wider transition-all duration-300 border bg-rose-50 border-rose-200/50 hover:bg-rose-100/70 text-rose-800 cursor-pointer shadow-sm"
                              title="Open and Draft in Gmail"
                            >
                              <PiEnvelopeSimpleLight className="text-xs text-rose-600" />
                              <span>Open in Gmail</span>
                            </a>

                            {/* Copy Pitch Button */}
                            <button
                              onClick={() => handleCopy(result.company, subject, body)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[9px] uppercase font-bold tracking-wider transition-all duration-300 border cursor-pointer shadow-sm ${
                                isCopied 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                  : 'bg-[#1A1817]/[0.02] border-[#1A1817]/[0.06] text-[#1A1817]/60 hover:bg-[#1A1817]/5 hover:text-[#1A1817]'
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <PiCheckLight className="text-xs" />
                                  <span>Copied Pitch!</span>
                                </>
                              ) : (
                                <>
                                  <PiCopyLight className="text-xs" />
                                  <span>Copy Pitch</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Company Profile Scraped Bezel */}
                        <div className="p-4 rounded-2xl bg-[#1A1817]/[0.02] border border-[#1A1817]/[0.03] shadow-[inset_0_1px_2px_rgba(26,24,23,0.01)] text-[11px] md:text-[12px] text-[#1A1817]/65 italic leading-relaxed font-serif">
                          &ldquo;{result.purpose}&rdquo;
                        </div>

                        {/* Generated Email Content View */}
                        <div className="space-y-4">
                          {/* Subject line */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#1A1817]/40">
                                Email Subject
                              </label>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[#1A1817]/[0.01] border border-[#1A1817]/[0.05]">
                              <span className="text-[12px] font-mono font-medium text-[#1A1817]/85 select-text">
                                {subject}
                              </span>
                              <button
                                onClick={() => handleCopySubject(result.company, subject)}
                                className="p-1.5 rounded-lg hover:bg-[#1A1817]/5 text-[#1A1817]/45 hover:text-[#1A1817] transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                                title="Copy Subject Only"
                              >
                                {copiedSubjectStates[result.company] ? (
                                  <>
                                    <PiCheckLight className="text-xs text-emerald-600" />
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600">Copied</span>
                                  </>
                                ) : (
                                  <PiCopyLight className="text-sm" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Email Body */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#1A1817]/40">
                              Email Body Preview (Pasted with rich links)
                            </label>
                            <div className="p-5 rounded-2xl bg-[#1A1817]/[0.01] border border-[#1A1817]/[0.05] relative group/code">
                              <div className="text-[12px] text-[#1A1817]/85 font-sans leading-relaxed whitespace-pre-wrap select-text">
                                {renderBodyWithLinks(body)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
