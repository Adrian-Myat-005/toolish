"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useApi } from "./ApiContext"
import { useLanguage } from "./LanguageContext"
import { cn } from "../lib/utils"

export function ApiHealthBar({ className, expanded = false }: { className?: string, expanded?: boolean }) {
  const { currentRPM, currentTPM, dailyUsage, dailyTokens } = useApi()
  const { t } = useLanguage()
  
  // Real-time Health Logic: Based on RPM (Max 15 for free tier)
  const maxRPM = 15
  const rpmPercentage = Math.max(0, Math.min(100, 100 - (currentRPM / maxRPM) * 100))
  
  // TPM Logic (Max 1M for free tier)
  const maxTPM = 1000000
  const tpmPercentage = Math.max(0, Math.min(100, 100 - (currentTPM / maxTPM) * 100))

  // Overall Health is the lower of the two
  const healthPercentage = Math.min(rpmPercentage, tpmPercentage)
  
  const getColor = (p: number) => {
    if (p > 70) return "bg-emerald-500" 
    if (p > 30) return "bg-amber-500" 
    return "bg-rose-500" 
  }

  return (
    <div className={cn("flex flex-col gap-1.5 relative group cursor-help", className ?? "w-32")}>
      <div className="flex justify-between items-center text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">
        <span className="flex items-center gap-1">
          {currentRPM > 0 && (
            <motion.span 
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            />
          )}
          {t('api_stamina')}
        </span>
        <span>{healthPercentage.toFixed(0)}%</span>
      </div>
      
      <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden relative border border-foreground/[0.03]">
         <motion.div 
           className={cn("h-full transition-colors duration-1000", getColor(healthPercentage))}
           initial={{ width: "100%" }}
           animate={{ width: `${healthPercentage}%` }}
           transition={{ type: "spring", stiffness: 50, damping: 20 }}
         />
      </div>

      {/* Real-time Stats Tooltip */}
      <div className={cn(
        "bg-background/95 backdrop-blur-xl border border-foreground/10 p-4 rounded-xl shadow-2xl transition-all duration-300 z-50",
        expanded 
          ? "relative mt-3 w-full opacity-100 translate-y-0" 
          : "absolute top-full mt-3 left-1/2 -translate-x-1/2 w-56 opacity-0 group-hover:opacity-100 pointer-events-none transform translate-y-2 group-hover:translate-y-0"
      )}>
         <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Real-time Load</div>
              <div className="flex justify-between text-xs font-mono">
                <span>RPM (Requests)</span>
                <span className={cn(currentRPM > 10 ? "text-rose-500 font-bold" : "")}>{currentRPM} / 15</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span>TPM (Tokens)</span>
                <span>{(currentTPM / 1000).toFixed(1)}k / 1M</span>
              </div>
            </div>

            <div className="pt-2 border-t border-foreground/5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Daily Cumulative</div>
              <div className="flex justify-between text-xs font-mono">
                <span>Total Calls</span>
                <span>{dailyUsage}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span>Total Tokens</span>
                <span>{(dailyTokens / 1000).toFixed(1)}k</span>
              </div>
            </div>
         </div>
         <div className="mt-3 text-[8px] uppercase tracking-tighter text-muted-foreground/40 text-center">
            {t('engine_health')}
         </div>
      </div>
    </div>
  )
}
