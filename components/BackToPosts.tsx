"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "./LanguageContext"

export function BackToPosts() {
  const { t } = useLanguage()

  return (
    <Link 
      href="/posts" 
      className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
    >
      <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
      {t('back_to_posts')}
    </Link>
  )
}
