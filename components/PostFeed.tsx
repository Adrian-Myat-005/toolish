"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutGrid, List as ListIcon, Search, ArrowUpDown, X } from "lucide-react"
import { urlForImage } from "../sanity/lib/image"
import { PostCard } from "./PostCard"
import { cn } from "../lib/utils"
import { useLanguage } from "./LanguageContext"

interface Post {
  _id: string
  _updatedAt?: string
  title?: string
  title_en?: string
  title_mm?: string
  slug: string
  mainImage?: any
  publishedAt?: string
  excerpt?: string
  excerpt_en?: string
  excerpt_mm?: string
  body?: any[]
  body_en?: any[]
  body_mm?: any[]
}

interface PostFeedProps { 
  posts: Post[] 
  featuredCount?: number
}

function getPostLength(post: Post) {
  const getTextLength = (blocks: any[]) => {
    if (!Array.isArray(blocks)) return 0;
    return blocks.reduce((acc, block) => {
      return acc + (block.children?.map((c: any) => c.text).join('').length || 0);
    }, 0);
  }
  // Sum up all available content for a rough length metric
  return getTextLength(post.body_en) + getTextLength(post.body_mm) + getTextLength(post.body);
}

const PostListItem = ({ post, language }: { post: Post, language: string }) => {
  const imageUrl = post.mainImage?.asset?.url || (post.mainImage ? urlForImage(post.mainImage).width(100).height(100).url() : null);
  const title = language === 'mm'
    ? (post.title_mm || post.title_en || post.title || "")
    : (post.title_en || post.title || "");

  return (
    <Link href={`/posts/${post.slug}`} className="block group border-b border-foreground/5 h-20">
      <motion.div
        className="relative flex items-center h-full px-4 md:px-6 gap-4 md:gap-8 group-hover:bg-foreground/[0.04] transition-colors"
        whileTap={{ scale: 0.99, backgroundColor: "rgba(0,0,0,0.08)" }}
      >
        <span className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground transition-colors duration-500 tabular-nums uppercase tracking-[0.1em] flex-shrink-0">
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString(language === 'mm' ? 'my-MM' : 'en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })
            : '00.00.0000'}
        </span>

        <div className="flex-1 overflow-hidden h-full flex items-center relative">
          <div className="absolute inset-0 flex items-center opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] truncate">
              {title}
            </h3>
          </div>
          {/* Default visible title (fades out on hover) */}
          <div className="absolute inset-0 flex items-center group-hover:opacity-0 transition-opacity duration-500">
            <h3 className="text-sm font-medium uppercase tracking-[0.2em] truncate text-muted-foreground">
              {title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
          {imageUrl && (
            <div className="relative h-10 w-14 grayscale group-hover:grayscale-0 transition-all duration-700 opacity-20 group-hover:opacity-100">
              <Image src={imageUrl} alt="" fill className="object-cover" />
            </div>
          )}
          <span className="text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
            [→]
          </span>
        </div>
      </motion.div>
    </Link>
  )
}

export function PostFeed({ posts, featuredCount = 2 }: PostFeedProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const { language } = useLanguage()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortOption, setSortOption] = React.useState<"newest" | "modified" | "oldest" | "length">("newest")
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const filteredPosts = React.useMemo(() => {
    let result = posts.filter(p => {
      const t = (p.title || "") + (p.title_en || "") + (p.title_mm || "");
      return t.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return result.sort((a, b) => {
      switch (sortOption) {
        case "modified":
          return new Date(b._updatedAt || b.publishedAt || 0).getTime() - new Date(a._updatedAt || a.publishedAt || 0).getTime();
        case "oldest":
          return new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
        case "length":
          return getPostLength(b) - getPostLength(a);
        case "newest":
        default:
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
      }
    })
  }, [posts, searchQuery, sortOption])

  const featuredPosts = viewMode === 'grid' ? filteredPosts.slice(0, featuredCount) : [];
  const remainingPosts = viewMode === 'grid' ? filteredPosts.slice(featuredCount) : filteredPosts;

  React.useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  return (
    <div className="space-y-8">
      {/* Controls Header */}
      <div className="flex flex-col gap-6 border-b border-foreground/5 pb-8">
        {/* Top Row: Search & Sort */}
        <div className="flex justify-end items-center gap-4">
          
           {/* Search */}
           <div className={cn("flex items-center transition-all duration-300 overflow-hidden", isSearchOpen ? "w-64 bg-foreground/5" : "w-10")}>
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <input
                 ref={searchInputRef}
                 type="text"
                 placeholder="Search titles..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className={cn(
                   "bg-transparent border-none outline-none text-xs font-mono px-2 h-10 w-full placeholder:text-muted-foreground/50",
                   !isSearchOpen && "opacity-0 pointer-events-none"
                 )}
              />
              {isSearchOpen && searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-2 hover:text-red-500">
                  <X size={14} />
                </button>
              )}
           </div>

           {/* Sort */}
           <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:inline-block">Sort:</span>
              <div className="relative group">
                <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 px-3 py-2 transition-colors">
                  {sortOption === 'newest' && 'Newest'}
                  {sortOption === 'modified' && 'Modified'}
                  {sortOption === 'oldest' && 'Oldest'}
                  {sortOption === 'length' && 'Length'}
                  <ArrowUpDown size={12} className="opacity-50" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-foreground/10 py-1 hidden group-hover:block z-50 shadow-xl">
                  {['newest', 'modified', 'oldest', 'length'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setSortOption(option as any)}
                      className={cn(
                        "w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-foreground/5 transition-colors",
                        sortOption === option && "font-bold bg-foreground/5"
                      )}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
           </div>
        </div>

        {/* Bottom Row: Title & View Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.6em] text-muted-foreground">
            Index / {filteredPosts.length} entries
          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-4 transition-all duration-300 border border-transparent active:scale-90",
                viewMode === "grid" 
                  ? "bg-foreground text-background" 
                  : "text-foreground/20 hover:text-foreground"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-4 transition-all duration-300 border border-transparent active:scale-90",
                viewMode === "list" 
                  ? "bg-foreground text-background" 
                  : "text-foreground/20 hover:text-foreground"
              )}
              aria-label="List view"
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      <motion.div layout>
        <AnimatePresence mode="popLayout">
          {viewMode === "grid" ? (
             <div className="space-y-8">
                {/* Big Panels for Top 2 */}
                {featuredPosts.length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {featuredPosts.map(post => (
                        <motion.div
                          layout
                          key={post._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <PostCard post={post} />
                        </motion.div>
                      ))}
                   </div>
                )}
                
                {/* List for Remaining */}
                {remainingPosts.length > 0 && (
                  <div className="flex flex-col border-t border-foreground/5">
                     {remainingPosts.map(post => (
                       <motion.div
                         layout
                         key={post._id}
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                       >
                         <PostListItem post={post} language={language} />
                       </motion.div>
                     ))}
                  </div>
                )}
             </div>
          ) : (
            /* Full List View */
            <div className="flex flex-col">
               {filteredPosts.map((post) => (
                  <motion.div
                    layout
                    key={post._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <PostListItem post={post} language={language} />
                  </motion.div>
               ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}