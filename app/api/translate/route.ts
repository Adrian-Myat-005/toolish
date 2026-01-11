import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, target_language, source_language, customApiKey, preferredModel } = body;

    if (!customApiKey) {
        return NextResponse.json({ error: 'API Key is missing' }, { status: 400 });
    }

    // Log masked key for debug
    const maskedKey = customApiKey.substring(0, 4) + '...' + customApiKey.substring(customApiKey.length - 4);
    console.log(`API Route: Received request. Key: ${maskedKey}, Target: ${target_language}, Model: ${preferredModel || 'default'}`);

    // Safety Truncation: Prevent massive payloads from causing fetch failures (matching Article Summarizer)
    let textToTranslate = text;
    const MAX_CHARS = 30000; 
    if (textToTranslate.length > MAX_CHARS) {
        console.warn(`[Translation] Text too long (${textToTranslate.length} chars). Truncating to ${MAX_CHARS}.`);
        textToTranslate = textToTranslate.slice(0, MAX_CHARS) + "\n...[Content Truncated]...";
    }

    const genAI = new GoogleGenerativeAI(customApiKey);
    
    // --- Dynamic Model Discovery (Adapted from Article Summarizer) ---
    let modelChain = [];
    
    try {
        console.log('[Translation] Discovering available models...');
        // Directly query the API for what models are actually available to this key
        const modelsResponse = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${customApiKey}`, {
            timeout: 60000 
        });
        const availableModels = modelsResponse.data.models || [];
        
        // Filter for models that support content generation
        const generationModels = availableModels.filter((m: any) => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        ).map((m: any) => m.name.replace('models/', '')); // Remove 'models/' prefix

        console.log(`[Translation] Found ${generationModels.length} generation models.`);

        // Preference list: we look for these specific strings inside the available model names
        const preferences = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
        
        // 1. User preference (if provided and valid)
        if (preferredModel && generationModels.some((m: string) => m.includes(preferredModel))) {
             const exactMatch = generationModels.find((m: string) => m === preferredModel || m.includes(preferredModel));
             if (exactMatch) modelChain.push(exactMatch);
        }

        // 2. Add high-priority favorites if they exist in the available list
        for (const pref of preferences) {
            // Find all models that *contain* the preference string (e.g. "gemini-1.5-flash-001" contains "gemini-1.5-flash")
            const matches = generationModels.filter((m: string) => m.includes(pref));
            modelChain.push(...matches);
        }

        // 3. Add any other 'gemini' models as a fallback
        const otherGemini = generationModels.filter((m: string) => m.includes('gemini') && !modelChain.includes(m));
        modelChain.push(...otherGemini);

        // Remove duplicates
        modelChain = [...new Set(modelChain)];

    } catch (discoveryError: any) {
        console.warn('[Translation] Failed to discover models dynamically:', discoveryError.message);
        // Fallback to a safe hardcoded list if discovery fails (e.g. network issue reaching the models endpoint)
        modelChain = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    }

    if (modelChain.length === 0) {
         console.warn('[Translation] No valid models found via discovery. Using defaults.');
         modelChain = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    }

        console.log(`[Translation] Final Model Chain: ${modelChain.join(' -> ')}`);

    

        const langMap: Record<string, string> = {

            'en': 'English',

            'my': 'Burmese',

            'zh': 'Chinese',

            'es': 'Spanish',

            'fr': 'French',

            'de': 'German',

            'ja': 'Japanese',

            'ko': 'Korean',

            'ru': 'Russian',

            'hi': 'Hindi',

            'ar': 'Arabic',

            'pt': 'Portuguese',

            'it': 'Italian',

            'th': 'Thai',

            'vi': 'Vietnamese',

            'id': 'Indonesian'

        };

    

        const sourceLangName = langMap[source_language] || source_language || 'auto';

        const targetLangName = langMap[target_language] || target_language;

    

        const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. Only return the translated text, do not include any preamble or markdown formatting unless the original text had it.\n\nText:\n${textToTranslate}`;

    

        let errorLog = [];

        let firstError = null;

        const requestOptions = { timeout: 60000 }; // 60 seconds timeout

    

        // Helper for exponential backoff retry

        const generateWithRetry = async (model: any, prompt: string, retries = 3, delay = 1000) => {

            for (let i = 0; i < retries; i++) {

                try {

                    return await model.generateContent(prompt);

                } catch (error: any) {

                    const isLastAttempt = i === retries - 1;

                    const msg = error.message || '';

                    

                    // Check for retryable errors: Network errors, 503 (Service Unavailable), 429 (Too Many Requests)

                    const isRetryable = 

                        msg.includes('fetch failed') || 

                        msg.includes('503') || 

                        msg.includes('429') ||

                        msg.includes('timeout');

    

                    if (!isRetryable || isLastAttempt) {

                        throw error;

                    }

    

                    console.warn(`[Translation] Retryable error (${i + 1}/${retries}): ${msg}. Retrying in ${delay}ms...`);

                    await new Promise(resolve => setTimeout(resolve, delay));

                    delay *= 2; // Exponential backoff

                }

            }

        };

    

        for (const modelName of modelChain) {

          try {

            console.log(`API Route: Attempting translation with model: ${modelName}`);

            

            const model = genAI.getGenerativeModel({ 

                model: modelName,

                safetySettings: [

                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },

                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },

                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },

                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },

                ]

            }, requestOptions);

    

            // Use the retry helper

            const result = await generateWithRetry(model, prompt);

            const response = await result.response;

            

            // Check if content was blocked
        if (response.candidates && response.candidates[0]?.finishReason === 'SAFETY') {
            const msg = `Model ${modelName} blocked content due to safety settings.`;
            console.warn(`API Route: ${msg}`);
            errorLog.push(msg);
            if (!firstError) firstError = msg;
            continue; 
        }

        const translatedText = response.text();
        const usage = response.usageMetadata; 

        console.log(`API Route: Success with model: ${modelName}`);

        return NextResponse.json({
            translated_text: translatedText,
            usageMetadata: usage,
            source_language: source_language || 'auto',
            target_language: target_language,
            model: modelName
        });

      } catch (error: any) {
        const status = error.status || 500;
        const msg = error.message || 'Unknown error';
        console.error(`API Route: Failed with model ${modelName} (Status: ${status}):`, msg);
        
        errorLog.push(`${modelName}: ${msg}`);
        if (!firstError) firstError = msg;

        // Fatal errors that imply the key itself is bad, or quota is hard blocked globally
        if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
            return NextResponse.json({
                error: `Invalid API Key. Please check your settings.`, 
                detail: msg 
            }, { status: 403 });
        }
      }
    }

    // If we get here, all models failed
    const consolidatedError = errorLog.join(' | ');
    console.error('API Route: All models failed. Errors:', consolidatedError);
    
    return NextResponse.json({
        error: `Translation Failed: ${firstError || 'All models failed'}`, 
        detail: consolidatedError
    }, { status: 500 });

  } catch (error: any) {
    console.error('API Route: Critical Error:', error);
    return NextResponse.json({
        error: error.message || 'Internal server error',
        detail: error.toString() 
    }, { status: 500 });
  }
}