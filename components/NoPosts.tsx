"use client"

import { useLanguage } from "./LanguageContext"

export function NoPosts() {
  const { t } = useLanguage()

  return (
    <div className="py-20 text-center">
      <p className="text-muted-foreground">{t('no_posts')}</p>
    </div>
  )
}
