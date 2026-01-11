"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from './LanguageContext'
import { Play, Square, Volume2, Pause, FastForward, Zap, Languages } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ReaderControl() {
  const { t, language: appLanguage } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'my-MM'>('en-US')
  const [rate, setRate] = useState(1.1) // Default 1.1x feels more natural and faster
  const [available, setAvailable] = useState(false)
  
  const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([])
  const currentChunkIndex = useRef(0)

  // Load voices and sync with app language
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setAvailable(true)
      
      const updateVoiceLang = () => {
        setVoiceLang(appLanguage === 'mm' ? 'my-MM' : 'en-US')
      }

      updateVoiceLang()
      window.speechSynthesis.onvoiceschanged = updateVoiceLang
      return () => {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [appLanguage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    utteranceQueue.current = []
    currentChunkIndex.current = 0
  }, [])

  const startSpeechFromCurrent = useCallback((startIndex = 0) => {
    window.speechSynthesis.cancel()
    
    const title = document.querySelector('h1')?.textContent || ""
    const content = document.querySelector('article .prose')?.textContent || ""
    const fullText = `${title}. ${content}`

    if (!fullText.trim()) return

    const chunks = fullText.match(/[^.!?]+[.!?]+/g) || [fullText]
    const voices = window.speechSynthesis.getVoices()
    const selectedVoice = voices.find(v => v.lang === voiceLang) || 
                          voices.find(v => v.lang.startsWith(voiceLang.split('-')[0]))

    currentChunkIndex.current = startIndex
    
    utteranceQueue.current = chunks.map((text, index) => {
      const ut = new SpeechSynthesisUtterance(text.trim())
      ut.lang = voiceLang
      ut.rate = rate
      if (selectedVoice) ut.voice = selectedVoice
      
      ut.onend = () => {
        if (index === utteranceQueue.current.length - 1) {
          setIsPlaying(false)
          setIsPaused(false)
        } else {
          currentChunkIndex.current = index + 1
        }
      }

      ut.onerror = () => stopSpeech()
      return ut
    })

    setIsPlaying(true)
    setIsPaused(false)
    
    // Speak from the requested start index
    for (let i = startIndex; i < utteranceQueue.current.length; i++) {
      window.speechSynthesis.speak(utteranceQueue.current[i])
    }
  }, [voiceLang, rate, stopSpeech])

  // Handle immediate updates when settings change during playback
  useEffect(() => {
    if (isPlaying && !isPaused) {
      startSpeechFromCurrent(currentChunkIndex.current)
    }
  }, [voiceLang, rate])

  const handlePlay = () => {
    if (!available) return

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
      return
    }

    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      return
    }

    startSpeechFromCurrent(0)
  }

  if (!available) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-4 p-3 mb-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full">
          <Zap size={14} className="text-indigo-500 fill-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Fast Reader</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlay}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 transition-transform active:scale-95 shadow-md"
          >
            {isPlaying && !isPaused ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
          </button>
          
          <AnimatePresence>
            {isPlaying && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={stopSpeech}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <Square size={14} fill="currentColor" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Language Selection */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Languages size={12} className="text-zinc-400" />
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value as any)}
            className="bg-transparent text-[11px] font-bold uppercase tracking-tighter focus:outline-none cursor-pointer"
          >
            <option value="en-US">English</option>
            <option value="my-MM">Burmese</option>
          </select>
        </div>

        {/* Speed Selection */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <FastForward size={12} className="text-zinc-400" />
          <select
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="bg-transparent text-[11px] font-bold focus:outline-none cursor-pointer"
          >
            <option value="0.8">0.8x</option>
            <option value="1">1.0x</option>
            <option value="1.1">1.1x</option>
            <option value="1.25">1.2x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>
      </div>
    </motion.div>
  )
}

