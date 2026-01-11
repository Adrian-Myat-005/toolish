"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check, Sparkles, X } from "lucide-react"
import { useLanguage } from "./LanguageContext"
import { TranslationDrawer } from "./TranslationDrawer"

export function TranslationStatusOverlay() {
  const { translationStatus, translationError, bgTranslation, resetTranslation } = useLanguage()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  if (translationStatus === 'idle') return null

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[200] flex flex-col items-end gap-4">
        <AnimatePresence mode="wait">
          {translationStatus === 'loading' ? (
            <motion.div
              key="loading"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-background border border-foreground/10 shadow-2xl rounded-2xl p-4 flex items-center gap-4 min-w-[200px]"
            >
              <div className="relative">
                <Loader2 size={24} className="animate-spin text-blue-500" />
                <Sparkles size={10} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Gemini AI</p>
                <p className="text-xs font-bold">Translating Article...</p>
              </div>
            </motion.div>
          ) : translationStatus === 'ready' ? (
            <motion.button
              key="ready"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDrawerOpen(true)}
              className="bg-green-500 text-white shadow-2xl rounded-full p-4 flex items-center gap-3 group relative"
            >
              <Check size={24} strokeWidth={3} />
              <div className="pr-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ready</p>
                <p className="text-xs font-bold">Show Translation</p>
              </div>
              
              {/* Close mini-button */}
              <div 
                onClick={(e) => { e.stopPropagation(); resetTranslation(); }}
                className="absolute -top-2 -left-2 bg-zinc-900 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </div>
            </motion.button>
          ) : translationStatus === 'error' ? (
            <motion.div
              key="error"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-[300px] relative group"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                <X size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Translation Error</p>
                <p className="text-[10px] font-bold text-red-800 dark:text-red-300 line-clamp-2">{translationError}</p>
              </div>
              <button 
                onClick={resetTranslation}
                className="absolute -top-2 -right-2 bg-zinc-900 text-white rounded-full p-1"
              >
                <X size={10} />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {bgTranslation && (
        <TranslationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          bgTranslation={bgTranslation}
          translationStatus={translationStatus}
          translationError={translationError}
        />
      )}
    </>
  )
}
