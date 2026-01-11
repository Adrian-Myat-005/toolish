"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Minimize, Maximize, Trash2, Sparkles, Loader2, X, MessageSquareText, Plus, ShieldCheck } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FileText } from 'lucide-react';
import { TextSelectionTooltip } from './TextSelectionTooltip';
import { db } from '../lib/db';
import { useApi } from './ApiContext';
import { useLanguage } from './LanguageContext';
import { useUser } from './UserContext';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center text-primary">
      <FileText size={48} className="animate-pulse" />
      <p className="mt-2">Loading PDF Viewer...</p>
    </div>
  ),
});

const ReactReader = dynamic(() => import('react-reader').then(mod => mod.ReactReader), { ssr: false });

interface EreaderTabContentProps {
  bookId: number;
  title: string;
  file: File | Blob;
  fileType: 'pdf' | 'epub';
  initialPage?: number;
  initialEpubLocation?: string | number;
  onUpdateProgress: (page: number, total?: number, epubLoc?: string | number) => void;
  onDelete: () => void;
}

export function EreaderTabContent({
  bookId,
  title,
  file,
  fileType,
  initialPage = 1,
  initialEpubLocation,
  onUpdateProgress,
  onDelete
}: EreaderTabContentProps) {
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [epubLocation, setEpubLocation] = useState<string | number | undefined>(initialEpubLocation);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // AI State
  const { apiKey, model: preferredModel, incrementUsage } = useApi();
  const { user, setIsAuthModalOpen } = useUser();
  const { t } = useLanguage();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeAiTask, setActiveAiTask] = useState<'explain' | 'summarize' | 'ask' | 'mcq' | 'study_notes' | 'exam_prep'>('ask');
  const [userQuery, setUserQuery] = useState('');

  // PDF Handlers
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    onUpdateProgress(pageNumber, numPages, undefined);
  }

  const changePage = (offset: number) => {
    if (numPages) {
      const newPage = Math.max(1, Math.min(numPages, pageNumber + offset));
      setPageNumber(newPage);
      onUpdateProgress(newPage, numPages, undefined);
    }
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));

  // AI Functionality
  const runAiTask = async (text: string, task: 'explain' | 'summarize' | 'ask' | 'mcq' | 'study_notes' | 'exam_prep') => {
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    
    if (!apiKey) {
        setAiError("Please set your Gemini API key in the settings first.");
        setAiPanelOpen(true);
        return;
    }

    setAiLoading(true);
    setAiPanelOpen(true);
    setAiResponse(null);
    setAiError(null);
    setActiveAiTask(task);

    // If task is not 'ask' and text is empty, we need to handle it.
    // In a real RAG system we'd use the vector store. Here we'll use selection or title context.
    const inputText = text || (task !== 'ask' ? `[Analyzing ${title} - Page ${pageNumber}]` : '');

    try {
        const response = await fetch('/api/ai-reader', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: inputText,
                task,
                customApiKey: apiKey,
                preferredModel,
                context: `Book Title: ${title}${fileType === 'pdf' ? `, Current Page: ${pageNumber}/${numPages}` : ''}`
            })
        });

        const data = await response.json();

        if (response.ok) {
            setAiResponse(data.result);
            incrementUsage(data.usageMetadata);
            if (task === 'ask') setUserQuery('');
        } else {
            setAiError(data.error || "Failed to get AI response.");
        }
    } catch (err: any) {
        setAiError(err.message || "An error occurred.");
    } finally {
        setAiLoading(false);
    }
  };

  // EPUB Handlers
  const onEpubChange = (location: string) => {
    setEpubLocation(location);
    onUpdateProgress(0, 0, location);
  };

  // Fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullScreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false));
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Text Selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 2) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      // Only show if selection is inside our container
      if (containerRef.current?.contains(selection.anchorNode)) {
          setSelectedText(selection.toString());
          setSelectionRect(rect);
      }
    } else {
      setSelectedText('');
      setSelectionRect(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  return (
    <div ref={containerRef} className="flex h-full relative bg-background overflow-hidden">
      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col relative min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-2 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                   <FileText size={12} className="text-primary shrink-0" />
                   <h2 className="text-[10px] font-bold truncate max-w-[150px]" title={title}>{title}</h2>
                </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
                {fileType === 'pdf' && (
                  <div className="flex items-center bg-muted/50 rounded-lg p-1">
                    <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="p-1 rounded hover:bg-background disabled:opacity-30">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-mono px-2 min-w-[50px] text-center">
                      {pageNumber} / {numPages || '-'}
                    </span>
                    <button onClick={() => changePage(1)} disabled={!numPages || pageNumber >= numPages} className="p-1 rounded hover:bg-background disabled:opacity-30">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <button onClick={handleZoomOut} className="p-1.5 rounded hover:bg-background transition-all" title="Zoom Out"><ZoomOut size={16} /></button>
                  <button onClick={handleZoomIn} className="p-1.5 rounded hover:bg-background transition-all" title="Zoom In"><ZoomIn size={16} /></button>
                </div>

                <div className="w-px h-4 bg-border mx-1" />

                <button 
                  onClick={() => {
                      setAiPanelOpen(!aiPanelOpen);
                      setActiveAiTask('ask');
                  }} 
                  className={cn(
                      "p-1.5 rounded-lg transition-all flex items-center gap-2", 
                      aiPanelOpen ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"
                  )}
                  title="AI Assistant"
                >
                  <Sparkles size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Assistant</span>
                </button>

                <button onClick={toggleFullScreen} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all" title="Toggle Fullscreen">
                  {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
            </div>
          </div>

          {/* Viewer */}
          <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 relative custom-scrollbar">
            {fileType === 'pdf' ? (
                 <div className="relative w-full min-h-full flex justify-center p-4">
                    <PdfViewer 
                        file={file} 
                        onLoadSuccess={onDocumentLoadSuccess} 
                        pageNumber={pageNumber} 
                        scale={scale} 
                    />
                 </div>
            ) : (
                <div className="relative w-full h-full bg-background">
                      <ReactReader
                        url={URL.createObjectURL(file)}
                        location={epubLocation}
                        locationChanged={onEpubChange}
                        showToc={true}
                        epubOptions={{
                            allowPopups: true, 
                            allowScriptedContent: true,
                        }}
                      />
                </div>
            )}
          </div>
      </div>

      {/* AI Side Panel */}
      <AnimatePresence>
        {aiPanelOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-full sm:w-[350px] border-l border-border bg-card flex flex-col h-full shadow-2xl z-50 absolute right-0 top-0 md:relative"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                <Sparkles size={14} className="text-primary animate-pulse" />
                <span>{t('ereader_ai_assistant')}</span>
              </div>
              <button onClick={() => setAiPanelOpen(false)} className="p-1.5 hover:bg-muted rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
               {!user ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-6 p-4">
                     <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
                        <ShieldCheck size={32} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-sm font-black uppercase tracking-widest">Authentication Required</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-relaxed">
                           Please sign in to unlock Toolish AI capabilities, including summaries, study notes, and more.
                        </p>
                     </div>
                     <div className="pt-2 w-full">
                        <button 
                          onClick={() => setIsAuthModalOpen(true)}
                          className="w-full py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-95"
                        >
                          Login to Proceed
                        </button>
                     </div>
                     <div className="w-full h-px bg-border" />
                     <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        Your progress and AI history will be synced across devices.
                     </p>
                  </div>
               ) : (
                 <>
                   {/* Quick Actions Group */}
                   {!aiLoading && !aiResponse && !aiError && (
                     <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
                        <button 
                          onClick={() => runAiTask(selectedText, 'summarize')}
                          className="flex flex-col items-center gap-2 p-4 bg-muted/30 border border-border rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all group"
                        >
                           <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <MessageSquareText size={16} className="text-blue-500" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{t('ereader_summarize')}</span>
                        </button>
                        <button 
                          onClick={() => runAiTask(selectedText, 'mcq')}
                          className="flex flex-col items-center gap-2 p-4 bg-muted/30 border border-border rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all group"
                        >
                           <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <Sparkles size={16} className="text-amber-500" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{t('ereader_create_mcqs')}</span>
                        </button>
                        <button 
                          onClick={() => runAiTask(selectedText, 'study_notes')}
                          className="flex flex-col items-center gap-2 p-4 bg-muted/30 border border-border rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all group"
                        >
                           <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <FileText size={16} className="text-emerald-500" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{t('ereader_study_notes')}</span>
                        </button>
                        <button 
                          onClick={() => runAiTask(selectedText, 'exam_prep')}
                          className="flex flex-col items-center gap-2 p-4 bg-muted/30 border border-border rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all group"
                        >
                           <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <Plus size={16} className="text-purple-500" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{t('ereader_exam_prep')}</span>
                        </button>
                     </div>
                   )}

                   {aiLoading ? (
                      <div className="flex flex-col items-center justify-center h-40 gap-4 text-muted-foreground">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analyzing Context...</p>
                      </div>
                   ) : aiError ? (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-medium">
                         <p className="font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                            <X size={14} /> Error
                         </p>
                         {aiError}
                      </div>
                   ) : aiResponse ? (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                         <div className="flex items-center gap-2 mb-4">
                            <div className="px-2 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase rounded tracking-widest">
                               {activeAiTask}
                            </div>
                         </div>
                         <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:tracking-tighter prose-headings:font-black bg-background p-4 rounded-2xl border border-border shadow-sm">
                            <ReactMarkdown>{aiResponse}</ReactMarkdown>
                         </div>
                         <button 
                            onClick={() => setAiResponse(null)}
                            className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                         >
                            Clear Response
                         </button>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center gap-4 opacity-50">
                         <MessageSquareText size={48} className="text-muted-foreground/30" />
                         <p className="text-[10px] font-black uppercase tracking-widest">I'm ready to help.<br/>Highlight text or ask below.</p>
                      </div>
                   )}
                 </>
               )}
            </div>

            <div className="p-4 border-t border-border bg-muted/30">
               <form 
                  onSubmit={(e) => {
                      e.preventDefault();
                      if (userQuery.trim()) runAiTask(userQuery, 'ask');
                  }}
                  className="space-y-2"
               >
                  <textarea
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder={t('ereader_ask_placeholder')}
                    disabled={!user}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[80px] custom-scrollbar disabled:opacity-50"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (userQuery.trim()) runAiTask(userQuery, 'ask');
                        }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !userQuery.trim() || !user}
                    className="w-full bg-foreground text-background py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {t('ereader_query_ai')}
                  </button>
               </form>
               <p className="mt-4 text-[8px] font-black uppercase tracking-widest text-center text-muted-foreground opacity-60">
                  {preferredModel.toUpperCase()} Engine
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Selection Tooltip */}
      {selectedText && selectionRect && (
        <TextSelectionTooltip
          selectedText={selectedText}
          selectionRect={selectionRect}
          onExplain={() => runAiTask(selectedText, 'explain')}
          onSummarize={() => runAiTask(selectedText, 'summarize')}
          onClose={() => {
            setSelectedText('');
            setSelectionRect(null);
          }}
        />
      )}
    </div>
  );
}
