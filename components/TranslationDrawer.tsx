"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2, Volume2, Bot, CheckCircle2, Settings2, Key, ShieldCheck } from 'lucide-react'
import { isBurmese } from '../lib/utils'
import { useApi } from './ApiContext'
import { useUser } from './UserContext'

export function TranslationDrawer({
  isOpen,
  onClose,
  bgTranslation,
  translationStatus,
  translationError,
}) {

  const { apiKey, model, setApiKey, setModel, isValid } = useApi()
  const { user } = useUser()
  const [showSettings, setShowSettings] = useState(false)
  
  // Local state for input
  const [inputKey, setInputKey] = useState('')
  
  React.useEffect(() => {
    if (apiKey) setInputKey(apiKey)
  }, [apiKey])

  // Determine actual language of translated text for the UI label
  const actualResultLang = bgTranslation?.targetLang === 'mm' ? 'Burmese' : 'English';

  const saveSettings = async () => {
    if (!user) {
      alert("Authentication Required: Please login or signup first to save AI settings.")
      return
    }
    const trimmedKey = inputKey.trim()
    await setApiKey(trimmedKey)
    setShowSettings(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md z-[201]"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-[202] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
                  <Bot size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Gemini Reader</h2>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{isValid ? 'Ready' : 'Setup Required'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  <Settings2 size={18} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-10">
              <div className="max-w-prose mx-auto">
                <AnimatePresence mode="wait">
                  {showSettings ? (
                    <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold">API Settings</h3>
                        {!user ? (
                          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                              <ShieldCheck size={14} /> Authentication Required
                            </p>
                            <p className="text-[10px] font-medium text-amber-700/70 leading-relaxed uppercase tracking-wider">
                              Please login to your account to configure and sync your Gemini API key.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500">Update your Gemini API Key here.</p>
                        )}
                      </div>
                      
                      {user && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                              <Key size={12} /> API Key
                            </label>
                            <input 
                              type="password"
                              value={inputKey}
                              onChange={(e) => setInputKey(e.target.value)}
                              className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none text-sm"
                              placeholder="Gemini API Key..."
                            />
                          </div>

                          {translationError && <p className="text-xs font-bold text-red-500">{translationError}</p>}
                          <button onClick={saveSettings} className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest">Save Changes</button>
                        </div>
                      )}
                    </motion.div>
                  ) : translationStatus === 'loading' ? (
                    <div key="loading" className="h-[60vh] flex flex-col items-center justify-center space-y-6">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Gemini is processing...</p>
                    </div>
                  ) : translationStatus === 'error' ? (
                    <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex gap-4 items-start bg-red-50/50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/20">
                        <X size={18} className="text-red-600 shrink-0 mt-1" />
                        <div className="space-y-1">
                          <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Translation Failed</p>
                          <p className="text-[10px] text-zinc-500 font-bold">{translationError}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowSettings(true)} className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest">
                        Check API Settings
                      </button>
                    </motion.div>
                  ) : bgTranslation && translationStatus === 'ready' ? (
                    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
                      <div className="flex gap-4 items-start bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                        <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-1" />
                        <div className="space-y-1">
                          <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Translation Ready</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Natural {actualResultLang}</p>
                            {model && (
                              <>
                                <span className="text-zinc-300">|</span>
                                <p className="text-[10px] text-blue-500 font-black uppercase">{model}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <article className="prose prose-zinc dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap leading-[1.9] text-[18px] font-medium text-zinc-800 dark:text-zinc-200 antialiased">
                          {(() => {
                            const lines = bgTranslation.body.split('\n');
                            if (lines.length > 0) {
                              return (
                                <>
                                  <div className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white leading-tight">
                                    {bgTranslation.title}
                                  </div>
                                  <div>
                                    {lines.slice(1).join('\n')}
                                  </div>
                                </>
                              );
                            }
                            return bgTranslation.body;
                          })()}
                        </div>
                      </article>
                    </motion.div>
                  ) : null} {/* Fallback for other states or if no bgTranslation */}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            {!showSettings && bgTranslation?.body && translationStatus === 'ready' && (
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky bottom-0">
                <button 
                  onClick={() => {
                    const ut = new SpeechSynthesisUtterance(bgTranslation.body);
                    ut.lang = actualResultLang === 'Burmese' ? 'my-MM' : 'en-US';
                    window.speechSynthesis.speak(ut);
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg"
                >
                  <Volume2 size={18} />
                  Listen to Article
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}