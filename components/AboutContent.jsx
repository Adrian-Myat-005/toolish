"use client";

import { useLanguage } from "./LanguageContext";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutContent({ settings }) {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl py-6 md:py-12 px-2 md:px-0">
      <h1 className="text-3xl md:text-5xl font-black uppercase mb-8 md:mb-12 tracking-tighter">{t('about_me')}</h1>
      
      <div className="prose prose-sm md:prose-lg prose-zinc dark:prose-invert max-w-none">
        {settings?.aboutBio ? (
          <div className="whitespace-pre-wrap leading-relaxed">{settings.aboutBio}</div>
        ) : (
          <p className="lead text-base md:text-xl text-muted-foreground leading-relaxed">
            {t('default_bio')}
          </p>
        )}

        {settings?.twitterUrl && (
          <>
            <h3>{t('contact')}</h3>
            <p>
              {t('contact_twitter')} <a href={settings.twitterUrl} className="text-primary hover:underline">Twitter</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
