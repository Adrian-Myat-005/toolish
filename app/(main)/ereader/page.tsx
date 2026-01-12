'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, BookOpen, X, Trash2, Clock, Plus, FileText, Layout, GripHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../../lib/utils';
import { useLiveQuery } from "dexie-react-hooks";
import { db, Book } from "../../../lib/db";
import { EreaderTabContent } from '../../../components/EreaderTabContent';
import { EreaderLibrary } from '../../../components/EreaderLibrary';
import { useLanguage } from '../../../components/LanguageContext';

interface Tab {
  id: string; // Unique ID for the tab (e.g., "book-{dbId}")
  bookId: number;
  title: string;
  file: File | Blob;
  fileType: 'pdf' | 'epub';
  currentPage: number;
  epubLocation?: string | number;
}

export default function EReaderPage() {
  const { t } = useLanguage();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Responsive default sidebar state
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setLibraryOpen(true);
    }
  }, []);

  // Load books from Dexie
  const savedBooks = useLiveQuery(() => db.books.orderBy('lastOpened').reverse().toArray());

  const openBook = async (book: Book) => {
    const tabId = `book-${book.id}`;
    
    // Check if tab exists
    if (tabs.find(t => t.id === tabId)) {
      setActiveTabId(tabId);
      setLibraryOpen(false); // Optional: close library on mobile?
      return;
    }

    // Create File/Blob
    let fileObj: File | Blob;
    if (book.fileType === 'pdf') {
      fileObj = new File([book.fileData.slice(0)], book.title, { type: 'application/pdf' });
    } else {
      fileObj = new Blob([book.fileData.slice(0)], { type: 'application/epub+zip' });
    }

    const newTab: Tab = {
      id: tabId,
      bookId: book.id!,
      title: book.title,
      file: fileObj,
      fileType: book.fileType,
      currentPage: book.currentPage || 1,
      epubLocation: undefined // TODO: Load epub location if saved
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
    setLibraryOpen(false);

    // Update last opened
    await db.books.update(book.id!, { lastOpened: new Date() });
  };

  const closeTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  const closeAllTabs = () => {
    setTabs([]);
    setActiveTabId(null);
  };

  const deleteBook = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Delete this book from your library?")) {
      await db.books.delete(id);
      // Close tabs associated with this book
      const tabId = `book-${id}`;
      if (tabs.find(t => t.id === tabId)) {
          const newTabs = tabs.filter(t => t.id !== tabId);
          setTabs(newTabs);
          if (activeTabId === tabId) {
            setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
          }
      }
    }
  };

  const clearLibrary = async () => {
      if (confirm("Are you sure you want to clear your entire library? This cannot be undone.")) {
          await db.books.clear();
          setTabs([]);
          setActiveTabId(null);
      }
  };

  // Dropzone for file uploads
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[acceptedFiles.length - 1]; // Take the last one for now
      const buffer = await file.arrayBuffer();
      const type = file.type === 'application/pdf' ? 'pdf' : 'epub';
      
      // Save to Dexie
      const id = await db.books.add({
        title: file.name,
        fileData: buffer,
        fileType: type as 'pdf' | 'epub',
        currentPage: 1,
        totalPages: 0,
        lastOpened: new Date()
      });

      // Open immediately
      const tabId = `book-${id}`;
      const newTab: Tab = {
        id: tabId,
        bookId: id as number,
        title: file.name,
        file: file,
        fileType: type as 'pdf' | 'epub',
        currentPage: 1
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(tabId);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: tabs.length > 0 // Disable click if tabs exist so we don't accidentally open dialog
  });

  const updateBookProgress = async (bookId: number, page: number, total?: number, epubLoc?: string | number) => {
     await db.books.update(bookId, { 
         currentPage: page,
         ...(total ? { totalPages: total } : {}),
         lastOpened: new Date()
     });
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-background text-foreground relative overflow-hidden">
      {/* Library Sidebar */}
      <EreaderLibrary 
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        savedBooks={savedBooks}
        onOpenBook={openBook}
        onDeleteBook={deleteBook}
        onClearLibrary={clearLibrary}
        openTabs={tabs}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        
        {/* Tab Bar */}
        <div className="flex items-center gap-1 p-1 md:p-2 bg-muted/30 border-b border-border overflow-x-auto custom-scrollbar no-scrollbar">
           <button 
              onClick={() => setLibraryOpen(!libraryOpen)}
              className={cn(
                  "p-2 rounded-xl mr-2 shrink-0 transition-all",
                  libraryOpen ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "hover:bg-muted text-muted-foreground hover:scale-105"
              )}
              title="Toggle Library"
           >
              <Layout size={20} />
           </button>

           <div className="flex items-center gap-1 flex-1 min-w-0">
              {tabs.map(tab => (
                  <div 
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-t-2xl border-t border-l border-r border-transparent min-w-[140px] max-w-[240px] cursor-pointer select-none transition-all group relative",
                          activeTabId === tab.id 
                            ? "bg-background border-border text-foreground shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.1)] translate-y-[1px] z-10" 
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                      )}
                  >
                      <FileText size={12} className={cn("shrink-0", activeTabId === tab.id ? "text-primary" : "opacity-50")} />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate flex-1">{tab.title}</span>
                      <button 
                          onClick={(e) => closeTab(e, tab.id)}
                          className="p-1 rounded-full hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all"
                      >
                          <X size={10} />
                      </button>
                  </div>
              ))}
           </div>

           {tabs.length > 1 && (
               <button 
                  onClick={closeAllTabs}
                  className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
               >
                  <X size={14} /> Clear Tabs
               </button>
           )}
           
           {tabs.length === 0 && (
               <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic flex items-center gap-3 animate-pulse">
                   <GripHorizontal size={16} /> {t('upload_docs')}
               </div>
           )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 relative overflow-hidden">
            {activeTabId ? (
                tabs.map(tab => (
                    <div 
                        key={tab.id} 
                        className={cn("w-full h-full", activeTabId === tab.id ? "block" : "hidden")}
                    >
                        <EreaderTabContent 
                            bookId={tab.bookId}
                            title={tab.title}
                            file={tab.file}
                            fileType={tab.fileType}
                            initialPage={tab.currentPage}
                            initialEpubLocation={tab.epubLocation}
                            onUpdateProgress={(page, total, epubLoc) => updateBookProgress(tab.bookId, page, total, epubLoc)}
                            onDelete={() => {
                                closeTab({ stopPropagation: () => {} } as any, tab.id);
                            }}
                        />
                    </div>
                ))
            ) : (
                // Empty State
                <div {...getRootProps({ onClick: evt => evt.stopPropagation() })} className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 p-8">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                        <BookOpen size={48} className="text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-widest">{t('no_book_open')}</h3>
                    <p className="text-sm font-medium max-w-md text-center leading-relaxed">
                        {t('no_book_desc')}
                    </p>
                    <button onClick={() => setLibraryOpen(true)} className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform">
                        {t('open_library')}
                    </button>
                    {/* Hidden input for dropzone if user drags file over empty area */}
                    <input {...getInputProps()} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
}