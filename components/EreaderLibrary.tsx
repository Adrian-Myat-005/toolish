"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, X, Trash2, Clock, Plus, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { Book } from '../lib/db';
import { useLanguage } from './LanguageContext';

interface EreaderLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  savedBooks: Book[] | undefined;
  onOpenBook: (book: Book) => void;
  onDeleteBook: (e: React.MouseEvent, id: number) => void;
  onClearLibrary: () => void;
  openTabs: { bookId: number }[];
  getRootProps: any;
  getInputProps: any;
}

export function EreaderLibrary({
  isOpen,
  onClose,
  savedBooks,
  onOpenBook,
  onDeleteBook,
  onClearLibrary,
  openTabs,
  getRootProps,
  getInputProps
}: EreaderLibraryProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={false}
      animate={{
        width: isOpen ? (window.innerWidth < 768 ? '100%' : '320px') : '0px',
        x: isOpen ? 0 : -320
      }}
      className={cn(
        "absolute md:relative z-40 h-full bg-card border-r border-border flex flex-col transition-all shadow-xl md:shadow-none",
        !isOpen && "pointer-events-none"
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between min-w-[300px]">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
          <BookOpen size={16} className="text-primary" /> {t('ereader_title')}
        </h2>
        <div className="flex items-center gap-1">
          {savedBooks && savedBooks.length > 0 && (
            <button 
              onClick={onClearLibrary}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Clear Library"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>
      
      {/* Drop Zone in Library */}
      <div {...getRootProps()} className="m-4 p-6 border-2 border-dashed border-border rounded-2xl text-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all min-w-[260px] group">
        <input {...getInputProps()} />
        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
          <Plus className="text-muted-foreground group-hover:text-primary" size={20} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">Import Collection</p>
      </div>

      <div className="flex-1 overflow-y-auto min-w-[300px] p-4 space-y-3 custom-scrollbar">
        {savedBooks?.map(book => {
          const isActive = openTabs.find(t => t.bookId === book.id);
          return (
            <div 
              key={book.id}
              onClick={() => onOpenBook(book)}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer group relative shadow-sm hover:shadow-md active:scale-[0.98]",
                isActive 
                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" 
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              <div className="flex gap-3">
                <div className={cn(
                  "w-10 h-14 rounded-lg flex items-center justify-center shrink-0 shadow-inner",
                  book.fileType === 'pdf' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                )}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold line-clamp-2 leading-tight mb-2 pr-6 group-hover:text-primary transition-colors">{book.title}</p>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(book.lastOpened).toLocaleDateString()}</span>
                    {book.currentPage && <span className="bg-muted px-1.5 py-0.5 rounded-md text-foreground">Pg {book.currentPage}</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => onDeleteBook(e, book.id!)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        
        {savedBooks?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 opacity-40 text-center">
            <BookOpen size={48} className="mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">{t('no_posts')}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
