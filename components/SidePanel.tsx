"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Github, Twitter, Instagram, ChevronRight, Check, AlertCircle, Loader2, Sparkles, ShieldCheck, ExternalLink, Zap, MousePointer2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "./LanguageContext"
import { useApi } from "./ApiContext"
import { useUser } from "./UserContext"
import { cn } from "../lib/utils"

import { ApiHealthBar } from "./ApiHealthBar"

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const { t } = useLanguage()
  const { apiKey, model, isValid, isLoading, setApiKey, setModel } = useApi()
  const { user, setIsAuthModalOpen } = useUser()
  const [localTime, setLocalTime] = React.useState("")
  const [isGeminiOpen, setIsGeminiOpen] = React.useState(false)
  
  // Local state for input before applying
  const [inputKey, setInputKey] = React.useState("")

  React.useEffect(() => {
    setInputKey(apiKey)
  }, [apiKey])

  const handleApplyGemini = async (e?: React.FormEvent, keyToUse?: string) => {
    if (e) e.preventDefault()
    if (!user) {
      setIsAuthModalOpen(true)
      onClose()
      return
    }
    const finalKey = keyToUse || inputKey
    if (!finalKey) return
    
    await setApiKey(finalKey)
    if (isValid) {
        setIsGeminiOpen(false)
    }
  }

  const handleModelChange = (newModel: string) => {
    setModel(newModel)
  }

  const handleSmartImport = async () => {
    if (!user) {
      setIsAuthModalOpen(true)
      onClose()
      return
    }
    try {
      const text = await navigator.clipboard.readText()
      const cleanKey = text.trim()
      if (cleanKey.startsWith('AIzaSy')) {
        setInputKey(cleanKey)
        handleApplyGemini(undefined, cleanKey)
      } else {
        alert("No valid Gemini API key found in clipboard. Please copy it from AI Studio first.")
      }
    } catch (err) {
      alert("Please allow clipboard access or paste the key manually.")
    }
  }

  const handleClearKey = () => {
    setApiKey("")
    setInputKey("")
  }

  React.useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 z-[101] h-full w-full max-w-sm bg-background border-l border-foreground/10 p-8 flex flex-col justify-between overflow-y-auto" >
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">{t('privilege_console')}</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <ApiHealthBar expanded={true} className="w-full" />
                
                {!user ? (
                  <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-4 shadow-inner">
                    <div className="flex items-center gap-3 text-amber-500">
                      <ShieldCheck size={18} />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">{t('auth_required')}</span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase tracking-wider">
                      {t('login_required_desc')}
                    </p>
                    <div className="pt-2">
                       <button 
                        onClick={() => {
                            setIsAuthModalOpen(true);
                            onClose();
                        }}
                        className="w-full py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity active:scale-95"
                       >
                         {t('login_to_proceed')}
                       </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Instant Connect Automation */}
                    <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-5 shadow-inner relative overflow-hidden">
                      {apiKey && isValid && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-[7px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-widest animate-pulse">
                          Connected
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-blue-500">
                        <div className="flex items-center gap-3">
                          <Zap size={18} className="fill-blue-500 animate-pulse" />
                          <span className="text-xs font-black uppercase tracking-[0.2em]">{t('instant_connect')}</span>
                        </div>
                        {apiKey && (
                           <div className={cn(
                             "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full",
                             isValid 
                               ? "text-green-600 dark:text-green-400 bg-green-500/10" 
                               : "text-red-600 dark:text-red-400 bg-red-500/10"
                           )}>
                             <div className={cn(
                               "w-1 h-1 rounded-full bg-current",
                               isValid ? "animate-ping" : ""
                             )} />
                             {isValid ? "Active" : "Invalid"}
                           </div>
                        )}
                      </div>
                      
                      <div className="space-y-3 relative">
                        <div className="absolute left-4 top-10 bottom-10 w-[1px] bg-blue-500/20 z-0" />
                        
                        <button 
                          onClick={() => window.open('https://aistudio.google.com/app/apikey', 'AIStudio', 'width=800,height=700')}
                          className="w-full flex items-center justify-between px-4 py-3 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20 relative z-10"
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[8px]">1</span>
                            Login & Generate
                          </span>
                          <ExternalLink size={14} />
                        </button>

                        <button 
                          onClick={handleSmartImport}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl relative z-10",
                            apiKey ? "bg-green-500 text-white" : "bg-foreground text-background hover:opacity-90"
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[8px]">2</span>
                            {apiKey ? "Update Connection" : "Auto-Link & Set"}
                          </span>
                          <MousePointer2 size={14} />
                        </button>
                      </div>

                      {isLoading && (
                        <div className="py-2 px-4 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center animate-in fade-in slide-in-from-top-1 bg-foreground/5 text-foreground">
                          Verifying Connection...
                        </div>
                      )}
                      {apiKey && !isLoading && !isValid && (
                        <div className="py-2 px-4 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center animate-in fade-in slide-in-from-top-1 bg-red-500 text-white">
                          Auth Handshake Failed
                        </div>
                      )}
                      {apiKey && !isLoading && isValid && (
                        <div className="py-2 px-4 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center animate-in fade-in slide-in-from-top-1 bg-green-500 text-white">
                          AI Engine Synchronized
                        </div>
                      )}
                    </div>

                    <div className="border border-foreground/10 overflow-hidden rounded-xl">
                      <button onClick={() => setIsGeminiOpen(!isGeminiOpen)} className="w-full flex items-center justify-between p-4 hover:bg-foreground/[0.02] transition-all text-left">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-muted-foreground" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('manual_config')}</span>
                        </div>
                        <ChevronRight size={14} className={cn("transition-transform text-muted-foreground", isGeminiOpen && "rotate-90")} />
                      </button>
                      <AnimatePresence>
                        {isGeminiOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-foreground/5 bg-foreground/[0.01]">
                            <form onSubmit={(e) => handleApplyGemini(e)} className="p-5 space-y-4">
                              <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Your API Key</label>
                                <input 
                                  type="password" 
                                  value={inputKey} 
                                  onChange={(e) => setInputKey(e.target.value)}
                                  placeholder="AIzaSy..." 
                                  className="w-full bg-background border border-foreground/10 px-3 py-2 text-xs font-mono focus:outline-none focus:border-foreground" 
                                />
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" disabled={isLoading} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded ${isValid ? 'bg-blue-500 text-white' : 'bg-foreground text-background hover:opacity-90'}`}>
                                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : isValid ? 'API SET' : 'Validate Key'}
                                </button>
                                {inputKey && (
                                  <button type="button" onClick={handleClearKey} className="px-3 py-2 border border-foreground/10 text-[9px] font-bold uppercase hover:bg-red-500/10 hover:text-red-500 transition-colors rounded">Reset</button>
                                )}
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                <nav className="flex flex-col gap-1 py-4">
                  {['home', 'ereader', 'posts', 'about', 'article-summarizer'].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={item === 'home' ? '/' : `/${item}`}
                        onClick={onClose}
                        className="group flex items-center px-4 py-3 rounded-xl transition-all duration-300 hover:bg-foreground/[0.03]"
                      >
                        <motion.span
                          whileHover={{ scale: 1.1, x: 5 }}
                          className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground group-hover:text-foreground transition-colors origin-left inline-block"
                        >
                          {item === 'home' ? t('back_to_home').split(' ')[0] : 
                           item === 'ereader' ? t('ereader_title') : 
                           item === 'posts' ? t('latest_stories').split(' ')[0] :
                           item === 'about' ? t('about') :
                           t('article_analysis_title')}
                        </motion.span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </div>
            </div>

            <div className="pt-8 border-t border-foreground/5 flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">TIME</span>
                <p className="text-[11px] font-mono">{localTime}</p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">v1.0.6</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}