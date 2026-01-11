"use client"

import React, { useState, useEffect } from 'react';
import { PortableText } from '@portabletext/react';
import { useLanguage } from "../../../../components/LanguageContext";
import { Sparkles, Languages } from 'lucide-react';
import { isBurmese } from "../../../../lib/utils";

export function PostContent({ post }) {
  const { 
    language, 
    startBgTranslation, 
    bgTranslation, 
    translationStatus, 
    translationError,
    resetTranslation
  } = useLanguage();

  const titleMm = post.title_mm || post.title;
  const titleEn = post.title_en || post.title;
  
  const bodyMm = post.body_mm || post.body;
  const bodyEn = post.body_en || post.body;

  const currentTitle = language === 'mm' ? (titleMm || titleEn) : (titleEn || titleMm);
  const currentBody = language === 'mm' ? (bodyMm || bodyEn) : (bodyEn || bodyMm);

  // Intelligently determine target language based on content
  const targetLanguageForAi = isBurmese(currentTitle) ? 'en' : 'mm';

  const handleTranslateClick = () => {
    // Only start translation if it hasn't been done for the current content or is in error state
    if (!bgTranslation || translationStatus === 'error' || translationStatus === 'idle') {
      startBgTranslation(currentTitle, currentBody, targetLanguageForAi);
    }
  };

  return (
    <div className="relative reader-article-container">
      {/* Translation Trigger Bar */}
      <div className="flex items-center justify-between mb-8 p-1 pl-4 bg-muted/50 rounded-2xl border">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <Languages size={14} />
          <span>Multilingual Article</span>
        </div>
        <button
          onClick={handleTranslateClick} // Use the new handler
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 text-xs font-bold uppercase tracking-widest"
        >
          <Sparkles size={14} />
          {targetLanguageForAi === 'en' ? 'Translate to English' : 'Translate to Burmese'}
        </button>
      </div>

      <header className="mb-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
          {currentTitle}
        </h1>
      </header>

      <div 
        className="prose prose-zinc dark:prose-invert max-w-none 
          prose-headings:font-bold prose-headings:tracking-tight
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:border"
      >
        <PortableText value={currentBody} />
      </div>
    </div>
  );
}
