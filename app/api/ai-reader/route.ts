// app/api/ai-reader/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { text, task, customApiKey, preferredModel, context } = await request.json();

    const apiKeyToUse = customApiKey || process.env.GEMINI_API_KEY;
    const modelToUse = preferredModel || 'gemini-1.5-flash';

    if (!apiKeyToUse) {
      return NextResponse.json({ error: 'API Key not found. Please provide it in settings.' }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: 'Text is required for analysis.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKeyToUse);

    let systemPrompt = '';
    
    if (task === 'explain') {
        systemPrompt = `You are a helpful reading assistant. Explain the following text selected by the reader. 
        Provide a concise explanation, defining difficult terms if any, and giving context if relevant.
        Format your response in clean Markdown.`;
    } else if (task === 'summarize') {
        systemPrompt = `You are a helpful reading assistant. Summarize the following text selected by the reader. 
        Focus on the main points and key takeaways.
        Format your response in clean Markdown.`;
    } else if (task === 'translate') {
        systemPrompt = `You are a helpful reading assistant. Translate the following text to English (if it's not English) or to the reader's preferred language. 
        Provide the translation and any cultural context if necessary.
        Format your response in clean Markdown.`;
    } else if (task === 'mcq') {
        systemPrompt = `You are an educational assistant. Based on the provided text, create 5 Multiple Choice Questions with 4 options each (A, B, C, D). 
        Include the correct answer at the end of each question. 
        Format your response in clean Markdown.`;
    } else if (task === 'study_notes') {
        systemPrompt = `You are a study assistant. Create concise, well-organized study notes from the following content. 
        Use bullet points, headings, and a clear structure. Focus on key concepts and important information.
        Format your response in clean Markdown.`;
    } else if (task === 'exam_prep') {
        systemPrompt = `You are an exam preparation assistant. Based on the document content, generate 5-8 thoughtful practice questions 
        that would help someone understand the key concepts and important information.
        Format your response in clean Markdown.`;
    } else {
        systemPrompt = `You are a helpful reading assistant. Analyze the following text and provide insights.`;
    }

    const prompt = `
      ${systemPrompt}

      ${context ? `Context of the book: ${context}` : ''}

      Selected Text:
      ---
      ${text}
      ---
    `;

    // Dynamic Model Discovery & Multi-Model Fallback Loop
    let modelChain: string[] = [];
    
    try {
        const modelsResponse = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeyToUse}`, { timeout: 10000 });
        const availableModels = modelsResponse.data.models || [];
        const generationModels = availableModels.filter((m: any) => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        ).map((m: any) => m.name.replace('models/', ''));

        const preferences = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
        
        if (modelToUse && generationModels.some((m: string) => m.includes(modelToUse))) {
             const exactMatch = generationModels.find((m: string) => m === modelToUse || m.includes(modelToUse));
             if (exactMatch) modelChain.push(exactMatch);
        }

        for (const pref of preferences) {
            const matches = generationModels.filter((m: string) => m.includes(pref));
            modelChain.push(...matches);
        }
        
        const otherGemini = generationModels.filter((m: string) => m.includes('gemini') && !modelChain.includes(m));
        modelChain.push(...otherGemini);
        modelChain = [...new Set(modelChain)];
    } catch (e) {
        modelChain = [modelToUse, 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    }

    if (modelChain.length === 0) modelChain = ['gemini-1.5-flash', 'gemini-1.5-pro'];

    let aiResponse = '';
    let lastError: any = null;
    let success = false;

    for (const modelName of modelChain) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                }
            });
            const response = await result.response;
            aiResponse = response.text();
            
            return NextResponse.json({ 
              result: aiResponse,
              model: modelName,
              usageMetadata: response.usageMetadata
            });
        } catch (error: any) {
            lastError = error;
            console.warn(`Model ${modelName} failed:`, error.message);
        }
    }

    throw new Error(lastError?.message || 'AI processing failed.');

  } catch (error: any) {
    console.error('AI Reader API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
