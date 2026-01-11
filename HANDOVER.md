# Project Handover: gemini_testing

This document summarizes the current state of the project, its architecture, and the workflow for continuing development.

## Project Overview
A modern, multilingual blog/vlog platform built with Next.js 16 and Sanity CMS, featuring AI-powered translations via Google Gemini. Note that while a `supabase_schema.sql` exists in the root, the project is currently fetching data from **Sanity CMS**.

### Core Stack
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS + Framer Motion
- **CMS:** Sanity (Current) & Supabase (Schema prepared)
- **AI:** Google Generative AI (Gemini API)
- **State Management:** React Context (for Language/Theme)

## Key Features
1. **Multilingual Support:** Supports English (`en`) and Burmese (`mm`).
2. **AI Translation:** 
   - Located in `app/api/translate/route.ts`.
   - Uses a "Dynamic Scan" approach: it fetches available models for the provided API key and attempts translation using a priority hierarchy (Gemini 2.0 Flash -> 1.5 Pro -> 1.5 Flash -> 1.0 Pro).
   - This ensures resilience against model deprecations or tier limitations.
3. **Responsive Design:** Mobile-first design with dark mode support (via `next-themes`).
4. **Sanity Integration:** Centralized content management with GROQ queries in `sanity/lib/queries.ts`.

## Project Structure
- `app/`: Next.js App Router.
  - `(main)/`: Main application routes (Home, About, Posts).
  - `api/translate/`: The Gemini-powered translation endpoint.
  - `studio/`: Embedded Sanity Studio.
- `components/`: Modular UI components.
  - `PostFeed.tsx`: Handles the display of blog posts.
  - `LanguageContext.tsx`: Manages language state across the app.
  - `TranslationDrawer.tsx`: UI for AI-powered translation interactions.
- `lib/`: Utility functions and shared definitions (e.g., `translations.ts`).
- `sanity/`: Sanity schemas and client configuration.

## Development Workflow
### Environment Variables
Ensure the following are set in `.env.local`:
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `GOOGLE_GENERATIVE_AI_API_KEY`

### Common Commands
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run publish`: Custom script that stages all changes, commits with a timestamped message, and pushes to `main`.

## Current State & Next Steps
- **Completed:** Core infrastructure, Sanity integration, Multilingual UI, and Robust AI translation endpoint.
- **In Progress:** Polishing UI transitions and ensuring all static strings in `lib/translations.ts` cover the whole site.
- **Memory Note:** The AI translation route is designed to be self-healing by scanning for available Gemini models dynamically.

## Memory for Next AI Session
- **Context:** The project uses the latest React 19 features (like `use` or improved `Server Components` patterns).
- **Style:** Maintain the clean, minimalist aesthetic using Tailwind.
- **Translation:** When adding new UI text, always update `lib/translations.ts` for both `en` and `mm`.
- **Sanity:** The schema for posts is in `sanity/schema.ts`.
