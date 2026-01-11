"use client"

import { useLanguage } from "./LanguageContext"
import { Typewriter } from "./Typewriter"
import { motion } from "framer-motion"

interface HomeHeaderProps {
  title?: string;
  description?: string;
}

export function HomeHeader({ title, description }: HomeHeaderProps) {
  const { t } = useLanguage()
  
  // Use fallback only if description is undefined. Allow "" to mean no description.
  let displayDescription = description !== undefined ? description : t('explore_sections')
  
  if (displayDescription === "Latest Stories") {
    displayDescription = t('latest_stories')
  }
  const isTargetDescription = displayDescription === "The House of AI powered utility tools" || (displayDescription && displayDescription === t('explore_sections'))
  
  // Logic to handle translated title if a specific string is passed
  const displayTitle = title === "Latest Stories" ? t('latest_stories') : title;

  return (
    <div className="flex flex-col space-y-4 pt-8 md:pt-12">
      {displayTitle && (
        <Typewriter 
          text={displayTitle} 
          className="text-3xl font-black uppercase tracking-tighter sm:text-5xl" 
        />
      )}
      {displayDescription && (
        isTargetDescription ? (
          <motion.p 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 5 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { 
                  duration: 0.5, 
                  delay: 0.5,
                  when: "beforeChildren",
                  staggerChildren: 0.1
                }
              }
            }}
            className="max-w-[700px] text-muted-foreground md:text-xl/relaxed font-medium cursor-default"
          >
            <motion.span 
              className="underline decoration-2 underline-offset-4 inline-block origin-bottom-left"
              variants={{
                hidden: { opacity: 0, scale: 1 },
                visible: { 
                  opacity: 1, 
                  scale: [1, 1.05, 1],
                  color: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"],
                  textDecorationColor: ["currentColor", "#3b82f6", "currentColor"],
                  transition: { 
                    duration: 2,
                    times: [0, 0.2, 1],
                    ease: "easeInOut"
                  }
                }
              }}
              whileHover={{ 
                scale: 1.05,
                color: "hsl(var(--foreground))",
                textDecorationColor: "#3b82f6",
                transition: { duration: 0.2 }
              }}
            >
              The House
            </motion.span>
            {" "}
            <motion.span
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              whileHover={{ color: "hsl(var(--foreground))" }}
              transition={{ duration: 0.2 }}
            >
              of AI powered utility tools
            </motion.span>
          </motion.p>
        ) : (
          <Typewriter 
            text={displayDescription} 
            className="max-w-[700px] text-muted-foreground md:text-xl/relaxed font-medium" 
            delay={0.5}
          />
        )
      )}
    </div>
  )
}