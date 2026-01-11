"use client"

import { useLanguage } from "./LanguageContext"
import { motion } from "framer-motion"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'mm' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/[0.03] border border-foreground/10 hover:bg-foreground/[0.05] transition-all active:scale-95 group"
    >
      <span className={`text-[9px] font-black tracking-widest uppercase transition-colors ${language === 'en' ? 'text-foreground' : 'text-muted-foreground'}`}>
        ENG
      </span>
      <div className="w-px h-2 bg-foreground/10" />
      <span className={`text-[9px] font-black tracking-widest uppercase transition-colors ${language === 'mm' ? 'text-foreground' : 'text-muted-foreground'}`}>
        မြန်မာ
      </span>
    </button>
  )
}