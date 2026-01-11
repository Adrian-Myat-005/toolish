"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLanguage } from './LanguageContext'
import { ArrowRight, BookOpen, User, Book, Sparkles, Layout } from 'lucide-react'

export default function SitePreview() {
  const { t } = useLanguage()

  const sections = [
    {
      title: t('latest_stories'),
      description: t('stories_desc'),
      href: '/posts',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: t('about'),
      description: t('about_desc'),
      href: '/about',
      icon: <User className="w-5 h-5" />,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      title: t('ereader_title'),
      description: t('ereader_desc'),
      href: '/ereader',
      icon: <Book className="w-5 h-5" />,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: t('analysis_title'),
      description: t('analysis_desc'),
      href: '/article-summarizer',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-amber-500/10 text-amber-500',
    }
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  return (
    <div className="py-8">
      <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        Features & Tools
      </div>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
      >
        {sections.map((section, index) => (
          <motion.div key={index} variants={item}>
            <Link 
              href={section.href}
              className="group flex flex-col justify-between h-28 p-4 rounded-2xl border border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-foreground/10 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                 <div className={`p-2 rounded-lg ${section.color} transition-transform duration-300 group-hover:scale-110`}>
                   {section.icon}
                 </div>
                 <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-muted-foreground" />
              </div>
              
              <div>
                <h3 className="text-xs font-black uppercase tracking-wide group-hover:text-foreground transition-colors">
                  {section.title}
                </h3>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  {section.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}