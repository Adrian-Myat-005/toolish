"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [hoverCycle, setHoverCycle] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Cycle symbols automatically ONLY when hovered
  React.useEffect(() => {
    if (!isHovered) {
      setHoverCycle(theme === "dark")
      return
    }
    
    const interval = setInterval(() => {
      setHoverCycle(prev => !prev)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isHovered, theme])

  if (!mounted) return <div className="w-12 h-12" />

  const isDark = theme === "dark"
  
  // Use the hover cycle state when hovering, otherwise use system theme state
  const activeIconIsDark = isHovered ? hoverCycle : isDark

  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
        setIsHovered(false); // Explicitly reset isHovered after a click
      }}
      whileTap={{ scale: 0.9 }}
      className="relative flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border border-foreground/5 bg-background shadow-inner group"
      aria-label="Toggle theme"
    >
      

      <motion.div
        animate={{
          rotate: isHovered ? 360 : 0,
        }}
        transition={{
          rotate: isHovered 
            ? { repeat: Infinity, duration: 2, ease: "linear" } 
            : { type: "spring", stiffness: 300, damping: 20 }
        }}
        className="relative z-10 flex items-center justify-center w-full h-full"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIconIsDark ? "moon" : "sun"}
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3 }}
            className="text-foreground"
          >
            {activeIconIsDark ? (
              <Moon size={20} fill="currentColor" />
            ) : (
              <Sun size={20} fill="currentColor" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Glossy Hardware Effect */}
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-full" />
    </motion.button>
  )
}
