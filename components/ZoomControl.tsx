"use client"

import React, { useState, useEffect } from 'react'
import { ZoomIn, ZoomOut, Type, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ZoomControl() {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)

  useEffect(() => {
    const savedFontSize = localStorage.getItem('reader-font-size')
    if (savedFontSize) {
      const size = parseInt(savedFontSize)
      setFontSize(size)
      document.documentElement.style.setProperty('--reader-font-size', `${size}%`)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--reader-font-size', `${fontSize}%`)
    localStorage.setItem('reader-font-size', fontSize.toString())
  }, [fontSize])

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xl hover:scale-110 transition-transform active:scale-95"
        title="Adjust Font Size"
      >
        {isOpen ? <X size={20} /> : <Type size={20} />}
      </button>

      {/* Bottom Slide Bar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-6 pb-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 shadow-2xl"
          >
            <div className="max-w-md mx-auto flex items-center gap-6">
              <button 
                onClick={() => setFontSize(prev => Math.max(prev - 5, 80))}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ZoomOut size={18} />
              </button>
              
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <span>Small</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold">{fontSize}%</span>
                  <span>Large</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="5"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
              </div>

              <button 
                onClick={() => setFontSize(prev => Math.min(prev + 5, 150))}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ZoomIn size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
