"use client";

import React, { useState } from 'react';
import { useLanguage } from '../../../components/LanguageContext';
import { useApi } from '../../../components/ApiContext';
import { useUser } from '../../../components/UserContext';
import PageWrapper from '../../../components/PageWrapper';
import { Loader2, Link as LinkIcon, FileText, Sparkles, Download, Languages, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeHeader } from '../../../components/HomeHeader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ArticleAnalysisPage() {
  const { t } = useLanguage();
  const { apiKey, model, incrementUsage } = useApi();
  const { user, setIsAuthModalOpen } = useUser();
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [translatedAnalysis, setTranslatedAnalysis] = useState('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    setLoading(true);
    setError('');
    setAnalysis('');
    setTranslatedAnalysis('');
    setIsTranslated(false);

    try {
      const response = await fetch('/api/article-summarizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, customApiKey: apiKey, preferredModel: model }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      incrementUsage(data.usageMetadata);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      console.error('Article summarizer failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (isTranslated) {
        setIsTranslated(false);
        return;
    }

    if (translatedAnalysis) {
        setIsTranslated(true);
        return;
    }

    setIsTranslating(true);
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: analysis,
                target_language: 'Burmese', // Burmese
                source_language: 'English',
                customApiKey: apiKey,
                preferredModel: model
            })
        });

        if (!response.ok) {
             throw new Error('Translation failed');
        }

        const data = await response.json();
        setTranslatedAnalysis(data.translated_text);
        setIsTranslated(true);
        incrementUsage(data.usageMetadata);
    } catch (err) {
        console.error('Translation error:', err);
        alert('Failed to translate notes. Please try again.');
    } finally {
        setIsTranslating(false);
    }
  };

  const handleDownload = () => {
    const textToDownload = isTranslated ? translatedAnalysis : analysis;
    if (!textToDownload) return;
    
    const element = document.createElement("a");
    const file = new Blob([textToDownload], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = isTranslated ? "Article_Analysis_Burmese.txt" : "Article_Analysis_English.txt";
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto py-12 px-6">
        <HomeHeader
            title={t('article_analysis_title') || 'Article Summarizer'}
            description={t('article_analysis_description') || 'Deconstruct articles into precise, study-ready notes.'}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 max-w-2xl mx-auto"
        >
          {!user ? (
            <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-center space-y-4 shadow-sm">
               <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                  <ShieldCheck size={32} />
               </div>
               <h3 className="text-lg font-black uppercase tracking-widest">Authentication Required</h3>
               <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                  Analyze and summarize articles with Elite AI. Please sign in to your account to use these tools.
               </p>
               <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-8 py-3 bg-foreground text-background text-xs font-black uppercase tracking-widest rounded-full hover:opacity-90 transition-all active:scale-95"
               >
                 Login to Proceed
               </button>
            </div>
          ) : (
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                </div>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article..."
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all duration-200 shadow-sm hover:border-foreground/40"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-foreground text-background hover:opacity-90 font-medium rounded-lg shadow-sm transform transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>{t('analyzing') || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{t('analyze_article') || 'Analyze Article'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-sm"
              >
                <span className="font-semibold">{t('error')}:</span> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Section - Magazine Style */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-16"
            >
              <div className="bg-card text-card-foreground border border-border/60 rounded-xl shadow-lg overflow-hidden relative">
                {/* Decorative Left Border (Notebook style) */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/80 z-10" />

                {/* Header Actions */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-md border border-border/50 shadow-sm">
                       <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight font-serif text-foreground/90">
                      {isTranslated ? 'Analysis (Burmese)' : (t('analysis_results') || 'Study Notes')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium uppercase tracking-wider border border-border rounded-md hover:bg-foreground hover:text-background transition-colors"
                        title={isTranslated ? "Show Original" : "Translate to Burmese"}
                    >
                        {isTranslating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                        {isTranslating ? 'Translating...' : (isTranslated ? 'ENG' : 'MM')}
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium uppercase tracking-wider border border-border rounded-md hover:bg-foreground hover:text-background transition-colors"
                        title="Download Notes"
                    >
                        <Download className="h-3.5 w-3.5" />
                        TXT
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-8 md:p-12 bg-card">
                  <article className={`prose prose-lg dark:prose-invert max-w-none 
                    prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight 
                    prose-h1:text-3xl prose-h1:mb-6 prose-h1:text-foreground
                    prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/60 prose-h2:text-primary
                    prose-p:leading-relaxed prose-p:text-muted-foreground prose-p:mb-6
                    prose-li:text-foreground/90 prose-li:my-1
                    prose-strong:text-foreground prose-strong:font-bold
                    prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-muted-foreground
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    ${isTranslated ? 'font-burmese leading-loose' : ''}
                    `}>
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {isTranslated ? translatedAnalysis : analysis}
                     </ReactMarkdown>
                  </article>
                </div>

                {/* Footer / End of Notes */}
                <div className="px-8 py-4 bg-muted/20 border-t border-border/40 flex justify-center">
                    <Sparkles className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
