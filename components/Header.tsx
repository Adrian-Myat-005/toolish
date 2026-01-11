"use client"

import * as React from "react"
import Link from "next/link"
import { motion, Variants } from "framer-motion"
import { ThemeToggle } from "./ThemeToggle"
import { LanguageToggle } from "./LanguageToggle"
import { UserAuth } from "./UserAuth"
import { usePathname } from "next/navigation"
import { cn } from "../lib/utils"
import { useLanguage } from "./LanguageContext"
import { useUser } from "./UserContext"
import { Menu } from "lucide-react"
import { SidePanel } from "./SidePanel"
import { ApiHealthBar } from "./ApiHealthBar"

export default function Header() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { profile } = useUser()
  const [isSidePanelOpen, setIsSidePanelOpen] = React.useState(false)




  const logoText = "Toolish"
  const characters = Array.from(logoText)

  // Animation variants for the "running" state
  const charVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    reveal: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.4 }
    }),
    running: (i: number) => ({
      y: [0, -10, 0],
      rotate: i % 2 === 0 ? [0, -15, 15, 0] : [0, 15, -15, 0],
      scaleY: [1, 0.7, 1.3, 1],
      transition: { 
        repeat: Infinity, 
        duration: 0.5, 
        ease: "easeInOut",
        delay: i * 0.02
      }
    }),
    rest: {
      y: 0,
      rotate: 0,
      scaleY: 1,
      transition: { duration: 0.2 }
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-foreground/5 h-20 md:h-24">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl h-full flex items-center justify-between">
          
          <Link 
            href="/" 
            className="group outline-none relative py-2 mr-2"
          >
            <motion.div 
              className="flex items-end"
              initial="initial"
              animate="reveal"
              whileHover="running"
            >
              <span className="text-4xl md:text-6xl font-black tracking-tighter leading-none -mb-1 mr-[-0.05em]">T</span>
              <div className="flex pb-1 md:pb-2">
                {Array.from("oolish").map((char, index) => (
                  <motion.span
                    key={index}
                    custom={index}
                    variants={charVariants}
                    className="text-lg md:text-2xl font-black tracking-tighter inline-block pointer-events-none"
                    style={{ whiteSpace: char === " " ? "pre" : "normal" }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </Link>

          <nav className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-3 md:gap-6 pl-4 md:pl-8 border-l border-foreground/10">

              <div className="hidden md:block">
                <ApiHealthBar />
              </div>
              <UserAuth />
              <div className="flex gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <button 
                onClick={() => setIsSidePanelOpen(true)}
                className="p-2 md:p-3 hover:bg-foreground/5 rounded-2xl transition-all active:scale-90"
                aria-label={t('open_menu')}
              >
                <Menu size={22} className="md:size-6" />
              </button>
            </div>
          </nav>
        </div>
      </header>
      
      <SidePanel 
        isOpen={isSidePanelOpen} 
        onClose={() => setIsSidePanelOpen(false)} 
      />
    </>
  )
}
