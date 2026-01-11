"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../lib/translations';
import { useApi } from './ApiContext';
import { useUser } from './UserContext';

// Define a maximum token budget for the API usage bar (e.g., 10,000 tokens)
// This can be adjusted based on desired scale or actual quota.
const MAX_API_TOKENS = 1000000; // Increased for debugging 

interface TranslationResult {
  title: string;
  body: string;
  targetLang: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  
  // Background Translation State
  translationStatus: 'idle' | 'loading' | 'ready' | 'error';
  translationError: string | null;
  bgTranslation: TranslationResult | null;
  startBgTranslation: (title: string, rawBody: any, target: string) => Promise<void>;
  resetTranslation: () => void;
}

interface PydanticError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface TranslateApiResponse {
  translatedText?: string;
  translated_text?: string;
  totalTokenCount?: number;
  usageMetadata?: any;
  error?: string | PydanticError[] | any;
  detail?: string | PydanticError[]; // FastAPI often uses 'detail' for errors
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { apiKey, model, incrementUsage } = useApi();
  const { user, setIsAuthModalOpen } = useUser();
  const [language, setLanguage] = useState<Language>('en');
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [bgTranslation, setBgTranslation] = useState<TranslationResult | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'mm')) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    if (language === 'mm') {
      document.body.classList.add('lang-mm');
      document.body.classList.remove('lang-en');
    } else {
      document.body.classList.add('lang-en');
      document.body.classList.remove('lang-mm');
    }
  }, [language]);

  const t = (key: TranslationKey) => translations[language][key] || key;

  /**
   * Helper to parse and stringify complex API errors (including Pydantic)
   */
  const parseApiError = (data: any): string => {
    const errorSource = data.error || data.detail;
    
    if (!errorSource) return "An unknown error occurred";
    
    if (typeof errorSource === 'string') return errorSource;
    
    if (Array.isArray(errorSource)) {
      return errorSource.map((err: any) => {
        if (typeof err === 'object' && err !== null && err.msg) {
          const path = Array.isArray(err.loc) ? err.loc.join('.') : (err.loc || '');
          return path ? `${path}: ${err.msg}` : err.msg;
        }
        return JSON.stringify(err);
      }).join('; ');
    }
    
    if (typeof errorSource === 'object' && errorSource !== null) {
      return errorSource.message || JSON.stringify(errorSource);
    }
    
    return JSON.stringify(errorSource);
  };

  const startBgTranslation = async (originalTitle: string, originalRawBody: any, targetLang: string) => {
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    
    setTranslationStatus('loading');
    setTranslationError(null);
    
    const extractText = (blocks: any) => {
      if (typeof blocks === 'string') return blocks;
      if (!blocks) return "";
      
      // If it's an array of Sanity blocks
      if (Array.isArray(blocks)) {
        return blocks.map(block => {
          if (block._type === 'block' && block.children) {
            return block.children
              .map((child: any) => child.text || "")
              .join("");
          }
          // Handle other potential block types that might contain text
          if (block.text) return block.text;
          return "";
        }).filter(text => text.trim().length > 0).join("\n\n");
      }
      
      return "";
    };

    const articleText = extractText(originalRawBody);
    console.log("Translation: Extracted text length:", articleText.length);
    
    if (!articleText.trim()) {
      console.warn("Translation: No content extracted from blocks:", originalRawBody);
      setTranslationError("Could not find any article content to translate.");
      setTranslationStatus('error');
      return;
    }

    const fullContentToTranslate = `${originalTitle}\n\n${articleText}`;
    
    // Map 'mm' (Myanmar/Burmese) to 'my' which the backend expects
    const target_language = targetLang === 'mm' ? 'my' : (targetLang || 'en');

    // Use keys from ApiContext
    const apiKeyToUse = apiKey;
    const modelToUse = model || "gemini-1.5-flash";

    if (!apiKeyToUse) {
       setTranslationError("API Key is missing. Please set it in the Privilege Console.");
       setTranslationStatus('error');
       return;
    }

    try {
      console.log("Frontend: Sending translation request:", { target_language, model: modelToUse });
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullContentToTranslate, 
          target_language,
          customApiKey: apiKeyToUse,
          preferredModel: modelToUse
        })
      });

      console.log("Frontend: API response status:", response.status, response.statusText);

      let data: TranslateApiResponse;
      const responseText = await response.text();
      // console.log("Frontend: API response raw text:", responseText); // Uncomment for deep debug
      
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error("Frontend: Failed to parse API response as JSON:", responseText);
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}. Check console.`);
      }

      console.log("Frontend: Data received from API:", data);

      if (!response.ok || data.error || data.detail) {
        console.error("Frontend: Error detected in API response:", {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          detail: data.detail
        });
        const errorMessage = parseApiError(data);
        throw new Error(errorMessage);
      }

      const translatedContent = data.translated_text || data.translatedText;

      if (!translatedContent) {
        throw new Error("API response did not contain translated text.");
      }

      setBgTranslation({
        title: originalTitle,
        body: translatedContent,
        targetLang
      });

      incrementUsage(data.usageMetadata);

      setTranslationStatus('ready');
    } catch (err: any) {
      console.error("BG Translation Failed:", err);
      // Explicitly handle network failures or other thrown errors
      const errorMessage = err instanceof Error ? err.message : "Translation failed. Check your API key and connection.";
      setTranslationError(errorMessage);
      setTranslationStatus('error');
    }
  };

  const resetTranslation = () => {
    setTranslationStatus('idle');
    setTranslationError(null);
    setBgTranslation(null);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, setLanguage, t, 
      translationStatus, translationError, bgTranslation, startBgTranslation, resetTranslation 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}