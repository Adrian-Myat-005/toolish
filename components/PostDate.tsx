"use client"

import { useLanguage } from "./LanguageContext"

export function PostDate({ dateString }: { dateString: string }) {
  const { language } = useLanguage()

  if (!dateString) return null

  return (
    <time dateTime={dateString}>
      {new Date(dateString).toLocaleDateString(language === 'mm' ? 'my-MM' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </time>
  )
}
