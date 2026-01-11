# Robust API Integration Architecture

This document outlines the "Make It Work First" philosophy and the technical patterns used to ensure stability, resilience, and correct functionality for the Gemini API integration (Translation & Analysis).

## Core Philosophy
**Stability > Speed.**
The system is designed to handle "brand new" API keys, network flakiness, and model deprecations without crashing. It prioritizes finding *any* working path to a solution over failing fast.

## Key Architectural Patterns

### 1. Dynamic Model Discovery
Instead of hardcoding model names (which leads to `404 Not Found` errors when models update or are region-locked), we query the API to ask "What models can *this* key actually use?"

**Implementation (`app/api/translate/route.ts`):**
```typescript
// Query the API for available models
const modelsResponse = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${customApiKey}`);
const availableModels = modelsResponse.data.models || [];

// Filter for models that support 'generateContent'
const generationModels = availableModels.filter((m) => 
    m.supportedGenerationMethods?.includes('generateContent')
).map((m) => m.name.replace('models/', ''));

// Build a chain: User Preference -> Favorites -> Any Gemini Model
```

### 2. Exponential Backoff Retry
Transient errors (`fetch failed`, `503`, `429`) should not kill a request. We implement a retry loop with exponential delays (1s -> 2s -> 4s) to ride out network hiccups.

**Implementation:**
```typescript
const generateWithRetry = async (model: any, prompt: string, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (error: any) {
            // Only retry if it's a network/server error
            const isRetryable = msg.includes('fetch failed') || msg.includes('503') || msg.includes('429');
            if (!isRetryable) throw error;
            
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Double the wait time
        }
    }
};
```

### 3. Model Fallback Chain
If the primary model fails (even after retries), we don't give up. We automatically iterate through the discovered `modelChain` until one succeeds.

```typescript
for (const modelName of modelChain) {
    try {
        // Attempt generation...
        return success;
    } catch (e) {
        // Log error and continue to next model
        errorLog.push(`${modelName}: ${e.message}`);
    }
}
// Only throw if ALL models fail
```

### 4. Payload Safety & Timeouts
To prevent silent hangs and request rejections:
*   **Truncation:** Input text is truncated to ~30,000 chars to avoid payload size limits.
*   **Timeouts:** All axios requests and generation calls have a strict `60000ms` (60s) timeout.

### 5. Explicit Prompting
To avoid ambiguity (e.g., "Translate to my" being read as "my" possession vs "my" language code):
*   **Language Mapping:** ISO codes are mapped to full names (`'my' -> 'Burmese'`).
*   **Safety Settings:** `BLOCK_NONE` is used to prevent over-sensitive filtering on new keys.

### 6. Article Analyzer Workflow (Application)
The Article Summarizer tool applies these patterns specifically for content extraction and structured auditing.

**Implementation (`app/api/article-analysis/route.ts`):**

1.  **Content Extraction:**
    *   Fetches URL content using `axios`.
    *   Uses `cheerio` to strip non-content tags (`script`, `style`, `nav`, `ads`).
    *   Extracts the core article text, falling back to `body` if semantic tags aren't found.

2.  **Safety Truncation:**
    *   Limits extracted content to **30,000 characters** (approx. 7k tokens) to ensure the payload fits within standard HTTP request limits and prevents network timeouts.

3.  **Dynamic Model Discovery & Fallback:**
    *   Identifies usable models via API query.
    *   Prioritizes: `User Preference` -> `gemini-1.5-flash` -> `gemini-1.5-pro` -> `gemini-pro`.
    *   Iterates through this verified list until a response is generated.

4.  **Structured Prompting:**
    *   Enforces a strict Markdown output format:
        *   `# Article Summarizer`
        *   `## Executive Notes` (One-liner, Key Takeaways)
        *   `## Critical Audit` (Credibility, Bias, Fallacies)
    *   The prompt explicitly instructs the model to act as an "Elite Article Summarizer Engine".

## Critical Files
*   `app/api/translate/route.ts`: Reference implementation for Translation.
*   `app/api/article-summarizer/route.ts`: Reference implementation for Article Summarizer.
*   `components/ApiContext.tsx`: Central source of truth for the API Key.
*   `components/LanguageContext.tsx`: Frontend logic that consumes the API.

## Recovery Instructions
If the API stops working:
1.  **Check Discovery:** Is `https://generativelanguage.googleapis.com/v1beta/models` returning a list?
2.  **Check Mapping:** Did Google change a model name? (The dynamic discovery should handle this).
3.  **Check Safety:** Are the `safetySettings` still valid for the SDK version?