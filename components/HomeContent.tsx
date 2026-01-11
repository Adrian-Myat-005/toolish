"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { HomeHeader } from "./HomeHeader"
import SitePreview from "./SitePreview"
import { useLanguage } from "./LanguageContext"
import { PostFeed } from "./PostFeed"
import AboutContent from "./AboutContent"

export function HomeContent({ posts }: { posts: any[] }) {
  const { t } = useLanguage()

  return (
    <section className="space-y-16 md:space-y-24 pb-24">
      <motion.div 
        className="space-y-12"
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        viewport={{ amount: 0.3 }}
        transition={{ duration: 0.8 }}
      >
        <HomeHeader 
          description={t('explore_sections')} 
        />
        <SitePreview />
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1, duration: 1 }}
          className="flex justify-center -mt-4 pb-4"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown className="text-muted-foreground/30" size={32} />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div 
        id="stories" 
        className="scroll-mt-24 space-y-6"
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        viewport={{ amount: 0.3 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-end justify-end border-b border-foreground/10 pb-3">
           <Link 
             href="/posts" 
             className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] border border-foreground/10 px-6 py-3 rounded-full hover:bg-foreground hover:text-background transition-all group"
           >
             {t('full_archive')}
             <span className="group-hover:translate-x-1 transition-transform">→</span>
           </Link>
        </div>
        <PostFeed posts={posts} featuredCount={1} />
        <div className="md:hidden flex justify-center pt-8">
           <Link 
             href="/posts" 
             className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] border border-foreground/10 px-6 py-3 rounded-full hover:bg-foreground hover:text-background transition-all w-full justify-center"
           >
             {t('view_all_posts')}
           </Link>
        </div>
      </motion.div>

      <motion.div 
        id="about" 
        className="pt-12 border-t border-foreground/10"
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        viewport={{ amount: 0.3 }}
        transition={{ duration: 0.8 }}
      >
         <AboutContent settings={null} />
      </motion.div>
    </section>
  )
}