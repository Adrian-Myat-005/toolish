// app/api/article-analysis/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio'; // For parsing HTML
import axios from 'axios'; // For fetching URLs



export async function POST(request: Request) {
  const { url, customApiKey, preferredModel } = await request.json();

  const apiKeyToUse = customApiKey || process.env.GEMINI_API_KEY;
  const modelToUse = preferredModel || 'gemini-pro'; // Default to gemini-pro if not specified

  if (!apiKeyToUse) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured. Provide it in .env or via customApiKey.' }, { status: 500 });
  }

  if (!url) {
    return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
  }

  try {
    // 1. Fetch article content
    const { data: htmlContent } = await axios.get(url);

    // 2. Extract and clean readable text from HTML
    const $ = cheerio.load(htmlContent);
    // Remove scripts, styles, and other non-content elements
    $('script, style, noscript, header, footer, nav, aside, form, iframe, .sidebar, .ads, .menu').remove();
    // Get text from common article containers or body
    let articleText = '';
    // Prioritize common article content tags
    const articleBody = $('article, .article-content, .post-content, .story-content, #article, #content');
    if (articleBody.length > 0) {
      articleText = articleBody.text();
    } else {
      // Fallback to body if no specific article tags are found
      articleText = $('body').text();
    }

    articleText = articleText.replace(/\s\s+/g, ' ').trim(); // Normalize whitespace

    if (!articleText || articleText.length < 100) { // Add a minimum length to avoid empty or junk content
      return NextResponse.json({ error: 'Could not extract sufficient readable text from the provided URL. Content might be too short or heavily structured.' }, { status: 400 });
    }

    // 3. Initialize Google Generative AI
    console.log(`[Article Summarizer] Request received. API Key present: ${!!apiKeyToUse}`);
    
    // Safety Truncation: Prevent massive payloads from causing fetch failures
    const MAX_CHARS = 30000; 
    if (articleText.length > MAX_CHARS) {
        console.warn(`[Article Summarizer] Article text too long (${articleText.length} chars). Truncating to ${MAX_CHARS}.`);
        articleText = articleText.slice(0, MAX_CHARS) + "\n...[Content Truncated]...";
    } else {
        console.log(`[Article Summarizer] Article text length: ${articleText.length} chars`);
    }

    const genAI = new GoogleGenerativeAI(apiKeyToUse);
    
    // 4. Construct the prompt with the analysis rules
      const prompt = `
You are an elite Article Summarizer. Your goal is to deconstruct articles provided by the user (or scraped from URLs) into precise, study-ready notes. You do not just summarize; you audit the content for truth, logic, and value.

      CORE ANALYSIS RULES (THE LOGIC):
      1.  **Thesis Extraction:** Identify the single main argument. What is the author trying to sell or prove?
      2.  **Credibility Audit:**
          * Distinguish *Verifiable Fact* from *Subjective Opinion*.
          * Scan for Logical Fallacies (e.g., Ad Hominem, Straw Man, False Equivalence).
          * Check for Evidence: Does the text cite data, studies, or experts? Or is it anecdotal?
      3.  **Bias & Tone:**
          * Identify the Political/Commercial leaning.
          * Flag "Loaded Language" (emotional manipulation).
      4.  **Value Assessment:** Who is this for? (Beginner, Expert, Investor).

      OUTPUT FORMAT (MANDATORY):
      You must output the analysis in the following structured Markdown format. Do not use conversational filler.

      ---

      # 📄 Article Summarizer: [Insert Article Title]

      ## 📌 Executive Notes (Simple & Effective)
      * **The "One-Liner":** A single sentence explaining exactly what this article is about.
      * **Key Takeaways:**
          * [Point 1: The most important fact/argument]
          * [Point 2]
          * [Point 3]
      * **Intended Audience:** [Who should read this?]

      ## 🔍 Critical Audit
      * **Credibility Score:** [High/Medium/Low] - *Brief explanation why.*
      * **Detected Bias:** [e.g., "Slightly Corporate Left-Leaning" or "Neutral"]
      * **Red Flags/Fallacies:**
          * *Warning:* [Quote the fallacy or weak point] -> [Explain the error]

      ## 🔗 Context & Validation
      * **Key Entities/Terms:** [List 3-5 technical terms, people, or companies mentioned that are central to the topic.]
      * **External Verification Queries:**
          * "Search query to verify claim A..."
          * "Search query to find counter-arguments..."

      ## 📚 Further Study & Expansion
      * **Deep Dive Topics:** [List 2 related subjects the user should study to understand this better.]
      * **Discussion Question:** [One thought-provoking question derived from the article's conclusion.]

      ---

      OPERATIONAL CONSTRAINTS:
      * If the input text is messy (scraped HTML), ignore the code and focus only on the readable text.
      * If the article is "Clickbait" (misleading title), explicitly state this in the Executive Notes.
      * Keep the "Executive Notes" simple enough for a student to understand.

      Please analyze the following article content and provide the output in the specified Markdown format. If you cannot determine some information, use "N/A" or "Not Applicable". Ensure the output is *only* the Markdown analysis, without any conversational preamble or postamble.

      Article Content:
      ---
      ${articleText}
      ---
    `;

    // 5. Dynamic Model Discovery & Multi-Model Fallback Loop
    let modelChain: string[] = [];
    
    // Step A: Dynamically fetch verified models from the API
    try {
        console.log('[Article Summarizer] Discovering available models...');
        const modelsResponse = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeyToUse}`);
        const availableModels = modelsResponse.data.models || [];
        
        // Filter for models that support content generation
        const generationModels = availableModels.filter((m: any) => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        ).map((m: any) => m.name.replace('models/', '')); // Remove 'models/' prefix if present

        console.log(`[Article Summarizer] Found ${generationModels.length} generation models.`);

        // Create a priority list based on what's ACTUALLY available
        // We look for our favorites in the available list
        const preferences = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
        
        // 1. User preference (if valid)
        if (modelToUse && generationModels.some((m: string) => m.includes(modelToUse))) {
             // Find the exact match in the available list
             const exactMatch = generationModels.find((m: string) => m === modelToUse || m.includes(modelToUse));
             if (exactMatch) modelChain.push(exactMatch);
        }

        // 2. Add high-priority favorites if they exist in the available list
        // We match partial names to catch specific versions (e.g. 'gemini-1.5-flash-001')
        for (const pref of preferences) {
            const matches = generationModels.filter((m: string) => m.includes(pref));
            // Sort matches to prefer shorter names (usually aliases) or specific versions? 
            // Let's just add them all, the loop will try them.
            modelChain.push(...matches);
        }

        // 3. Add any other 'gemini' models as a fallback
        const otherGemini = generationModels.filter((m: string) => m.includes('gemini') && !modelChain.includes(m));
        modelChain.push(...otherGemini);

        // Remove duplicates
        modelChain = [...new Set(modelChain)];

    } catch (discoveryError: any) {
        console.warn('[Article Summarizer] Failed to discover models dynamically:', discoveryError.message);
        // Fallback to hardcoded list if discovery fails
        modelChain = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    }

    if (modelChain.length === 0) {
         console.warn('[Article Summarizer] No valid models found via discovery. Using defaults.');
         modelChain = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    }

    console.log(`[Article Summarizer] Final Model Chain: ${modelChain.join(' -> ')}`);

    let aiAnalysis = '';
    let lastError: any = null;
    let success = false;
    const requestOptions = { timeout: 60000 }; // 60 seconds timeout

    for (const modelName of modelChain) {
        try {
            console.log(`[Article Summarizer] Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName }, requestOptions);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            aiAnalysis = response.text();
            const usage = response.usageMetadata;
            
            console.log(`[Article Summarizer] SUCCESS with model: ${modelName}`);
            success = true;
            
            return NextResponse.json({ 
              analysis: aiAnalysis,
              usageMetadata: usage,
              model: modelName
            });
        } catch (error: any) {
            console.warn(`[Article Summarizer] Failed with ${modelName}. Error: ${error.message}`);
            lastError = error;
            // Loop continues to the next model automatically
        }
    }

    if (!success) {
        console.error('[Article Summarizer] All models failed.');
        throw new Error(`All analysis models failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    return NextResponse.json({ analysis: aiAnalysis });
  } catch (error: any) {
    console.error('Article summarizer API error details:', error);
    // Return the actual error message to the client for better debugging
    return NextResponse.json({ error: error.message || 'Failed to analyze article.' }, { status: 500 });
  }
}
