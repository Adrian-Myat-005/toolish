"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useLanguage } from "./LanguageContext"

interface TypewriterProps {
  text: string
  className?: string
  delay?: number
}

export function Typewriter({ text, className, delay = 0 }: TypewriterProps) {
  const { language } = useLanguage();
  const [displayText, setDisplayText] = React.useState("");
  
  React.useEffect(() => {
    setDisplayText("");
    
    const getSegments = (t: string) => {
      try {
        // @ts-ignore
        const segmenter = new Intl.Segmenter(language === 'mm' ? 'my' : 'en', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(t)).map((s: any) => s.segment);
      } catch (e) {
        return Array.from(t);
      }
    };

    const segments = getSegments(text);
    let index = 0;
    let current = "";
    
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index < segments.length) {
          current += segments[index];
          setDisplayText(current);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 45); 
      
      return () => clearInterval(interval);
    }, delay * 1000);

    return () => {
      clearTimeout(startTimeout);
    };
  }, [text, language, delay]);

  return (
    <motion.div 
      key={`${text}-${language}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      className={`inline-block ${className}`}
      style={{ 
        lineHeight: language === 'mm' ? '1.8' : '1.4',
        fontFamily: 'inherit'
      }}
    >
      <span style={{ 
        whiteSpace: 'pre-wrap',
        fontFamily: 'inherit',
        fontWeight: 'inherit'
      }}>
        {displayText}
      </span>
    </motion.div>
  );
}
