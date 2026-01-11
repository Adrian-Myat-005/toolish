"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { urlForImage } from "../sanity/lib/image"
import { useLanguage } from "./LanguageContext"

interface PostCardProps {
  post: {
    _id: string
    title?: string
    title_en?: string
    title_mm?: string
    slug: string
    mainImage?: any
    publishedAt?: string
    excerpt?: string
    excerpt_en?: string
    excerpt_mm?: string
  }
}

export function PostCard({ post }: PostCardProps) {
  const { language } = useLanguage()
  const imageUrl = post.mainImage?.asset?.url || (post.mainImage ? urlForImage(post.mainImage).url() : null);

  const title = language === 'mm' 
    ? (post.title_mm || post.title_en || post.title || "") 
    : (post.title_en || post.title || "");

  return (
    <Link href={`/posts/${post.slug}`} className="block h-full group">
      <motion.article 
        className="flex flex-col h-full py-6 space-y-4 border-t border-foreground/5 group-hover:border-foreground transition-colors duration-700"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {/* Meta Header */}
        <div className="flex justify-between items-center">
          <time className="font-mono text-[9px] tracking-[0.4em] text-muted-foreground uppercase">
            {post.publishedAt 
              ? new Date(post.publishedAt).toLocaleDateString(language === 'mm' ? 'my-MM' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit'
                })
              : '00.00.00'}
          </time>
          <div className="w-1 h-1 bg-foreground/20 rounded-full group-hover:bg-foreground transition-colors" />
        </div>

        {/* Image Area - Completely hidden if no imageUrl */}
        {imageUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-foreground/[0.02] border border-foreground/5">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-105 transition-all duration-1000 ease-out"
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            />
            {/* Running Title Overlay on Image */}
            <div className="absolute bottom-0 left-0 w-full bg-foreground text-background py-2 z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-out">
              <div className="flex whitespace-nowrap animate-marquee">
                <span className="text-xs font-bold uppercase tracking-[0.2em] pr-12">{title}</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] pr-12">{title}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Text-Only Hover Reveal logic */
          <div className="py-4 overflow-hidden relative">
             <div className="flex whitespace-nowrap animate-marquee opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-foreground text-background py-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] pr-12">{title}</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] pr-12">{title}</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] pr-12">{title}</span>
             </div>
             {/* Large static placeholder title for text-only posts when NOT hovering */}
             <div className="absolute inset-0 flex items-center group-hover:opacity-0 transition-opacity duration-300">
                <h3 className="text-lg font-bold uppercase tracking-tight truncate w-full opacity-40">{title}</h3>
             </div>
          </div>
        )}
      </motion.article>
    </Link>
  )
}
